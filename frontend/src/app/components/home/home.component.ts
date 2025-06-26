import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Servicios
import { PropiedadesService } from '../../services/propiedades.service';
import { AuthService, User } from '../../services/auth.service';
import { EmpresaService } from '../../services/empresa.service';
import { ConfigService } from '../../services/config.service'; // 🔥 IMPORTAR CONFIG SERVICE

// Interfaces
import { Propiedad, PropiedadFields } from '../../models/airtable.interfaces';
import { Empresa } from '../../interfaces/api.interfaces';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  // 🏠 DATOS PRINCIPALES
  featuredProperties: Propiedad[] = [];
  allProperties: Propiedad[] = [];
  filteredProperties: Propiedad[] = [];
  empresaData: Empresa | null = null;
  loading = true;
  error: string | null = null;

  // 🔐 ESTADO DE AUTENTICACIÓN
  isLoggedIn = false;
  currentUser: User | null = null;

  // 🔥 BÚSQUEDA HERO
  searchTerm = '';
  searchType = '';
  searchLocation = '';
  priceRange = '';

  // 🔥 FILTROS ADICIONALES
  filterStatus = 'Disponible';
  priceMin: number | null = null;
  priceMax: number | null = null;

  // 🔥 VISTA DE PROPIEDADES EN HERO
  showFilteredResults = false;

  // 📊 ESTADÍSTICAS
  stats = {
    totalProperties: 0,
    citasRealizadas: 150,
    clientesSatisfechos: 98,
    anosExperiencia: 15
  };

  // 🎨 CONFIGURACIÓN DE SECCIONES
  propertyTypes = ['Piso', 'Casa', 'Dúplex', 'Ático', 'Garaje', 'Local', 'Terreno'];
  locations = ['Centro', 'Zapillo', 'Nueva Andalucía', 'El Puche', 'Los Ángeles'];
  priceRanges = [
    { label: 'Hasta 100.000€', value: '0-100000' },
    { label: '100.000€ - 200.000€', value: '100000-200000' },
    { label: '200.000€ - 300.000€', value: '200000-300000' },
    { label: 'Más de 300.000€', value: '300000-999999' }
  ];

  private favoriteIds: Set<string> = new Set();
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private propiedadesService: PropiedadesService,
    private authService: AuthService,
    private empresaService: EmpresaService,
    private configService: ConfigService, // 🔥 INYECTAR CONFIG SERVICE
    private router: Router,
    private route: ActivatedRoute
  ) {
    // 🔥 CONFIGURAR BÚSQUEDA CON DEBOUNCE
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyHeroFilters();
    });
  }

  ngOnInit(): void {
    console.log('🏠 Inicializando HomeComponent...');
    this.checkAuthStatus();
    this.loadQueryParams();
    this.loadHomeData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 🔥 CARGAR PARÁMETROS DE URL
  private loadQueryParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['search']) this.searchTerm = params['search'];
      if (params['type']) this.searchType = params['type'];
      if (params['location']) this.searchLocation = params['location'];
      if (params['priceRange']) this.priceRange = params['priceRange'];
      if (params['priceMin']) this.priceMin = +params['priceMin'];
      if (params['priceMax']) this.priceMax = +params['priceMax'];

      console.log('📥 Parámetros cargados desde URL:', params);
    });
  }

  // 🔥 VERIFICAR ESTADO DE AUTENTICACIÓN (SIN CAMBIOS)
  private checkAuthStatus(): void {
    try {
      this.isLoggedIn = this.authService.isAuthenticated;

      if (this.isLoggedIn) {
        this.authService.getCurrentUser()
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (user: User | null) => {
              this.currentUser = user;
              this.isLoggedIn = !!user;
              console.log('✅ Usuario obtenido:', user?.email || 'Sin email');
            },
            error: (error: any) => {
              console.warn('⚠️ Error obteniendo usuario:', error);
              this.currentUser = null;
              this.isLoggedIn = false;
            }
          });
      }

      console.log('✅ Estado de autenticación:', this.isLoggedIn);

    } catch (error) {
      console.warn('⚠️ Error verificando autenticación:', error);
      this.isLoggedIn = false;
      this.currentUser = null;
    }
  }

  /**
   * 📊 Cargar datos iniciales
   */
  private loadHomeData(): void {
    this.loading = true;
    this.loadAllProperties();
    this.loadEmpresaData();
  }

  // 🔥 CARGAR TODAS LAS PROPIEDADES (SIN CAMBIOS)
  private loadAllProperties(): void {
    this.propiedadesService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const properties = response.data || [];
          this.allProperties = properties;

          // Propiedades destacadas (disponibles, primeras 6)
          this.featuredProperties = properties
            .filter((p: Propiedad) => p.fields?.Estado === 'Disponible')
            .slice(0, 6);

          this.stats.totalProperties = properties.length;
          this.loading = false;

          // 🔥 APLICAR FILTROS INICIALES SI HAY PARÁMETROS
          if (this.hasActiveFilters()) {
            this.applyHeroFilters();
          }

          console.log('✅ Propiedades cargadas:', {
            total: properties.length,
            destacadas: this.featuredProperties.length
          });
        },
        error: (error: any) => {
          console.error('❌ Error al cargar propiedades:', error);
          this.error = 'Error al cargar las propiedades';
          this.loading = false;
        }
      });
  }

  /**
   * 🔥 CARGAR DATOS DE EMPRESA USANDO CONFIG SERVICE
   */
  private loadEmpresaData(): void {
    // 🔥 USAR MÉTODO SIMPLIFICADO QUE USA CONFIGURACIÓN INTERNA
    this.empresaService.getEmpresaPrincipal()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresa: Empresa | null) => {
          if (empresa) {
            this.empresaData = empresa;
            console.log('✅ Datos de empresa cargados desde configuración:', empresa);
          } else {
            // 🔥 USAR CONFIGURACIÓN COMO FALLBACK
            console.warn('⚠️ No se encontró empresa, usando configuración por defecto');
          }
        },
        error: (error: any) => {
          console.warn('⚠️ Error al cargar datos de empresa:', error);
        }
      });
  }

  // ===============================
  // 🔥 MÉTODOS DE FILTRADO (SIN CAMBIOS)
  // ===============================

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.searchType || this.searchLocation ||
              this.priceRange || this.priceMin || this.priceMax);
  }

  private applyHeroFilters(): void {
    if (!this.hasActiveFilters()) {
      this.showFilteredResults = false;
      this.filteredProperties = [];
      return;
    }

    let filtered = [...this.allProperties];

    // 🔍 Filtro por texto
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(property =>
        this.getFieldAsString(property, 'Título').toLowerCase().includes(searchLower) ||
        this.getFieldAsString(property, 'Descripción').toLowerCase().includes(searchLower) ||
        this.getFieldAsString(property, 'Dirección').toLowerCase().includes(searchLower) ||
        this.getFieldAsString(property, 'Tipo').toLowerCase().includes(searchLower)
      );
    }

    // 🏠 Filtro por tipo
    if (this.searchType) {
      filtered = filtered.filter(property =>
        this.getFieldAsString(property, 'Tipo') === this.searchType
      );
    }

    // 📍 Filtro por ubicación
    if (this.searchLocation) {
      filtered = filtered.filter(property =>
        this.getFieldAsString(property, 'Dirección').toLowerCase().includes(this.searchLocation.toLowerCase())
      );
    }

    // 💰 Filtro por rango de precio
    if (this.priceRange) {
      const [min, max] = this.priceRange.split('-').map(Number);
      if (min) {
        filtered = filtered.filter(property =>
          this.getFieldAsNumber(property, 'Precio') >= min
        );
      }
      if (max && max !== 999999) {
        filtered = filtered.filter(property =>
          this.getFieldAsNumber(property, 'Precio') <= max
        );
      }
    }

    // 🔢 Filtros por precio manual
    if (this.priceMin !== null && this.priceMin > 0) {
      filtered = filtered.filter(property =>
        this.getFieldAsNumber(property, 'Precio') >= this.priceMin!
      );
    }

    if (this.priceMax !== null && this.priceMax > 0) {
      filtered = filtered.filter(property =>
        this.getFieldAsNumber(property, 'Precio') <= this.priceMax!
      );
    }

    // 🏷️ Solo propiedades disponibles (por defecto en home)
    filtered = filtered.filter(property =>
      this.getFieldAsString(property, 'Estado') === 'Disponible'
    );

    this.filteredProperties = filtered.slice(0, 6); // Máximo 6 en home
    this.showFilteredResults = true;

    console.log('🎯 Filtros aplicados:', {
      total: filtered.length,
      mostrados: this.filteredProperties.length,
      filtros: {
        searchTerm: this.searchTerm,
        searchType: this.searchType,
        searchLocation: this.searchLocation,
        priceRange: this.priceRange
      }
    });
  }

  // ===============================
  // 🔥 MÉTODOS DE EVENTO (SIN CAMBIOS)
  // ===============================

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onTypeChange(): void {
    this.applyHeroFilters();
  }

  onLocationChange(): void {
    this.applyHeroFilters();
  }

  onPriceRangeChange(): void {
    if (this.priceRange) {
      this.priceMin = null;
      this.priceMax = null;
    }
    this.applyHeroFilters();
  }

  clearHeroFilters(): void {
    this.searchTerm = '';
    this.searchType = '';
    this.searchLocation = '';
    this.priceRange = '';
    this.priceMin = null;
    this.priceMax = null;
    this.showFilteredResults = false;
    this.filteredProperties = [];
  }

  // ===============================
  // 🚀 MÉTODOS DE NAVEGACIÓN (SIN CAMBIOS)
  // ===============================

  performSearch(): void {
    const queryParams: any = {};

    if (this.searchTerm) queryParams.search = this.searchTerm;
    if (this.searchType) queryParams.type = this.searchType;
    if (this.searchLocation) queryParams.location = this.searchLocation;
    if (this.priceRange) {
      const [min, max] = this.priceRange.split('-');
      if (min) queryParams.priceMin = min;
      if (max && max !== '999999') queryParams.priceMax = max;
    }
    if (this.priceMin) queryParams.priceMin = this.priceMin;
    if (this.priceMax) queryParams.priceMax = this.priceMax;

    console.log('🔍 Navegando a property-list con filtros:', queryParams);
    this.router.navigate(['/propiedades'], { queryParams });
  }

  viewAllProperties(): void {
    this.router.navigate(['/propiedades']);
  }

  viewProperty(property: Propiedad): void {
    if (property.id) {
      this.router.navigate(['/propiedades', property.id]);
    }
  }

  goToContact(): void {
    this.router.navigate(['/contacto']);
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  goToProfile(): void {
    this.router.navigate(['/perfil']);
  }

  // ===============================
  // 🔧 MÉTODOS AUXILIARES (SIN CAMBIOS)
  // ===============================

  formatPrice(price: number | undefined): string {
    if (!price || price === 0) return 'Consultar precio';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(price);
  }

  getFieldAsString(property: Propiedad, field: keyof PropiedadFields): string {
    const value = property?.fields[field];
    return value ? String(value) : '';
  }

  getFieldAsNumber(property: Propiedad, field: keyof PropiedadFields): number {
    const value = property?.fields[field];
    return typeof value === 'number' ? value : 0;
  }

  getPricePerSquareMeter(property: Propiedad): string {
    const precio = this.getFieldAsNumber(property, 'Precio');
    const superficie = this.getFieldAsNumber(property, 'Superficie');

    if (precio && superficie) {
      const precioM2 = precio / superficie;
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(precioM2);
    }
    return '';
  }

  hasPropertyImage(property: Propiedad): boolean {
    const imagenes = property?.fields['Imágenes'];
    if (!Array.isArray(imagenes) || imagenes.length === 0) {
      return false;
    }
    const firstImage = imagenes[0];
    return !!(firstImage?.url || firstImage?.thumbnails?.large?.url);
  }

  getPropertyImage(property: Propiedad): string {
    if (!this.hasPropertyImage(property)) {
      return '';
    }
    const imagenes = property.fields['Imágenes'] as any[];
    const firstImage = imagenes[0];
    return firstImage.thumbnails?.large?.url ||
           firstImage.thumbnails?.medium?.url ||
           firstImage.url ||
           '';
  }

  private getDefaultImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvcnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPgogICAgPHRzcGFuPjxmYSBjbGFzcz0iZmFzIGZhLWhvbWUiLz4gU2luIGltYWdlbjwvdHNwYW4+CiAgPC90ZXh0Pgo8L3N2Zz4K';
  }

  onImageError(event: any): void {
    if (event.target.src !== this.getDefaultImage()) {
      event.target.src = this.getDefaultImage();
    }
  }

  getVisitCount(property: Propiedad): string {
    const fields = property.fields as any;
    const visits = fields['Número de visitas'] ||
                   fields['Número de Visitas'] ||
                   fields['numero de visitas'] ||
                   fields['NumeroDeVisitas'] ||
                   fields['Visitas'] ||
                   0;
    return visits ? String(visits) : '0';
  }

  getConstructionYear(property: Propiedad): string {
    const fields = property.fields as any;
    const year = fields['Año de construcción'] ||
                 fields['Año de Construcción'] ||
                 fields['año de construcción'] ||
                 fields['AñoDeConstruccion'] ||
                 fields['Año construcción'] ||
                 fields['Construido en'] ||
                 fields['Año'] ||
                 '';
    return year ? String(year) : '';
  }

  /**
   * 🔥 OBTENER NOMBRE DE EMPRESA DESDE CONFIGURACIÓN
   */
  getEmpresaNombre(): string {
    // 🔥 PRIORIDAD: datos cargados desde API > configuración por defecto
    return this.empresaData?.nombre || this.configService.getEmpresaNombreFallback();
  }

  // 🔥 MÉTODOS PARA EL TEMPLATE (SIN CAMBIOS)
  getDisplayProperties(): Propiedad[] {
    return this.showFilteredResults ? this.filteredProperties : this.featuredProperties;
  }

  getSectionTitle(): string {
    if (this.showFilteredResults) {
      const count = this.filteredProperties.length;
      return `Resultados de búsqueda (${count})`;
    }
    return 'Propiedades Destacadas';
  }

  getSectionSubtitle(): string {
    if (this.showFilteredResults) {
      return this.filteredProperties.length > 0
        ? 'Propiedades que coinciden con tu búsqueda'
        : 'No se encontraron propiedades con estos filtros';
    }
    return 'Descubre las mejores oportunidades inmobiliarias';
  }

  shouldShowClearButton(): boolean {
    return this.showFilteredResults && this.hasActiveFilters();
  }
}
