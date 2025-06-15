import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Servicios
import { PropiedadesService } from '../../services/propiedades.service';
import { AuthService, User } from '../../services/auth.service'; // 🔥 IMPORT CORRECTO
import { EmpresaService } from '../../services/empresa.service';

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
  empresaData: Empresa | null = null;
  loading = true;
  error: string | null = null;

  // 🔐 ESTADO DE AUTENTICACIÓN - 🔥 USAR USER DEL AUTH.SERVICE
  isLoggedIn = false;
  currentUser: User | null = null;

  // 🔍 BÚSQUEDA HERO
  searchTerm = '';
  searchType = '';
  searchLocation = '';
  priceRange = '';

  // 📊 ESTADÍSTICAS
  stats = {
    totalProperties: 0,
    citasRealizadas: 150,
    clientesSatisfechos: 98,
    anosExperiencia: 15
  };

  // 🎨 CONFIGURACIÓN DE SECCIONES
  propertyTypes = ['Piso', 'Casa', 'Chalet', 'Apartamento', 'Local', 'Oficina'];
  locations = ['Centro', 'Zapillo', 'Nueva Andalucía', 'El Puche', 'Los Ángeles'];
  priceRanges = [
    { label: 'Hasta 100.000€', value: '0-100000' },
    { label: '100.000€ - 200.000€', value: '100000-200000' },
    { label: '200.000€ - 300.000€', value: '200000-300000' },
    { label: 'Más de 300.000€', value: '300000-999999' }
  ];

  private favoriteIds: Set<string> = new Set();
  private destroy$ = new Subject<void>();

  constructor(
    private propiedadesService: PropiedadesService,
    private authService: AuthService,
    private empresaService: EmpresaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🏠 Inicializando HomeComponent...');
    this.checkAuthStatus();
    this.loadHomeData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 🔥 MÉTODO ÚNICO Y CORRECTO DE AUTENTICACIÓN
  /**
   * 🔐 Verificar estado de autenticación
   */
  private checkAuthStatus(): void {
    try {
      // 🔥 VERIFICAR ESTADO INICIAL CON EL GETTER
      this.isLoggedIn = this.authService.isAuthenticated;

      if (this.isLoggedIn) {
        // 🔥 OBTENER USUARIO ACTUAL
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
    this.loadFeaturedProperties();
    this.loadEmpresaData();
  }

  /**
   * 🌟 Cargar propiedades destacadas
   */
  private loadFeaturedProperties(): void {
    this.propiedadesService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          const allProperties = response.data || [];
          this.featuredProperties = allProperties
            .filter((p: Propiedad) => p.fields?.Estado === 'Disponible')
            .slice(0, 6);
          this.stats.totalProperties = allProperties.length;
          this.loading = false;
          console.log('✅ Propiedades destacadas cargadas:', this.featuredProperties.length);
        },
        error: (error: any) => {
          console.error('❌ Error al cargar propiedades destacadas:', error);
          this.error = 'Error al cargar las propiedades';
          this.loading = false;
        }
      });
  }

  /**
   * 🏢 Cargar datos de empresa
   */
  private loadEmpresaData(): void {
    this.empresaService.getByName('InmoTable')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (empresa: Empresa | null) => {
          if (empresa) {
            this.empresaData = empresa;
            console.log('✅ Datos de empresa cargados:', empresa);
          } else {
            console.warn('⚠️ No se encontró empresa con el nombre InmoTable');
          }
        },
        error: (error: any) => {
          console.warn('⚠️ Error al cargar datos de empresa:', error);
        }
      });
  }

  // ===============================
  // 🚀 MÉTODOS DE NAVEGACIÓN
  // ===============================

  /**
   * 🔍 Realizar búsqueda
   */
  performSearch(): void {
    const queryParams: any = {};
    if (this.searchTerm) queryParams.search = this.searchTerm;
    if (this.searchType) queryParams.type = this.searchType;
    if (this.searchLocation) queryParams.location = this.searchLocation;
    if (this.priceRange) {
      const [min, max] = this.priceRange.split('-');
      if (min) queryParams.priceMin = min;
      if (max) queryParams.priceMax = max;
    }
    console.log('🔍 Realizando búsqueda con:', queryParams);
    this.router.navigate(['/propiedades'], { queryParams });
  }

  /**
   * 🏠 Ver todas las propiedades
   */
  viewAllProperties(): void {
    this.router.navigate(['/propiedades']);
  }

  /**
   * 🏠 Ver detalles de propiedad
   */
  viewProperty(property: Propiedad): void {
    if (property.id) {
      this.router.navigate(['/propiedades', property.id]);
    }
  }

  /**
   * 📞 Ir a contacto
   */
  goToContact(): void {
    this.router.navigate(['/contacto']);
  }

  /**
   * 👤 Ir a registro
   */
  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  /**
   * 👤 Ir a perfil
   */
  goToProfile(): void {
    this.router.navigate(['/dashboard']);
  }

  // ===============================
  // 🔧 MÉTODOS AUXILIARES
  // ===============================

  /**
   * 💰 Formatear precio
   */
  formatPrice(price: number | undefined): string {
    if (!price || price === 0) return 'Consultar precio';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(price);
  }

  /**
   * ✅ OBTENER VALOR DE CAMPO
   */
  getFieldAsString(property: Propiedad, field: keyof PropiedadFields): string {
    const value = property?.fields[field];
    return value ? String(value) : '';
  }

  /**
   * ✅ OBTENER VALOR NUMÉRICO
   */
  getFieldAsNumber(property: Propiedad, field: keyof PropiedadFields): number {
    const value = property?.fields[field];
    return typeof value === 'number' ? value : 0;
  }

  /**
   * ✅ PRECIO POR M²
   */
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

  /**
   * ✅ VERIFICAR SI LA PROPIEDAD TIENE IMAGEN VÁLIDA
   */
  hasPropertyImage(property: Propiedad): boolean {
    const imagenes = property?.fields['Imágenes'];
    if (!Array.isArray(imagenes) || imagenes.length === 0) {
      return false;
    }
    const firstImage = imagenes[0];
    return !!(firstImage?.url || firstImage?.thumbnails?.large?.url);
  }

  /**
   * ✅ OBTENER IMAGEN SEGURA
   */
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

  /**
   * ✅ IMAGEN POR DEFECTO
   */
  private getDefaultImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvcnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPgogICAgPHRzcGFuPjxmYSBjbGFzcz0iZmFzIGZhLWhvbWUiLz4gU2luIGltYWdlbjwvdHNwYW4+CiAgPC90ZXh0Pgo8L3N2Zz4K';
  }

  /**
   * ✅ MANEJAR ERROR DE IMAGEN
   */
  onImageError(event: any): void {
    if (event.target.src !== this.getDefaultImage()) {
      event.target.src = this.getDefaultImage();
    }
  }

  /**
   * ✅ OBTENER NÚMERO DE VISITAS
   */
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

  /**
   * ✅ OBTENER AÑO DE CONSTRUCCIÓN
   */
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
   * 📍 Obtener nombre de empresa
   */
  getEmpresaNombre(): string {
    return this.empresaData?.nombre || 'InmoTable';
  }
}
