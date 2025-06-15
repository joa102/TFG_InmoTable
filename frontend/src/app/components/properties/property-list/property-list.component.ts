import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PropiedadesService } from '../../../services/propiedades.service';
import { ClientesService } from '../../../services/clientes.service'; // 🔥 AÑADIR
import { AuthService } from '../../../services/auth.service'; // 🔥 AÑADIR
import { Propiedad, PropiedadFields } from '../../../models/airtable.interfaces';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators'; // 🔥 AÑADIR switchMap

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.scss']
})
export class PropertyListComponent implements OnInit, OnDestroy {

  // ✅ DATOS
  properties: Propiedad[] = [];
  filteredProperties: Propiedad[] = [];
  paginatedProperties: Propiedad[] = [];

  // ✅ ESTADOS
  loading = true;
  error: string | null = null;

  // ✅ FILTROS
  searchText = '';
  filterType = '';
  filterStatus = '';
  priceMin: number | null = null;
  priceMax: number | null = null;

  // ✅ VISTA
  viewMode: 'grid' | 'list' = 'grid';

  // ✅ PAGINACIÓN
  currentPage = 1;
  itemsPerPage = 12;

  // 🔥 FAVORITOS (SIMULADO - EN FUTURO USAR SERVICIO)
  private favoriteIds: Set<string> = new Set();
  private favoritesLoaded = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private propiedadesService: PropiedadesService,
    private clientesService: ClientesService, // 🔥 AÑADIR
    private authService: AuthService, // 🔥 AÑADIR
    private router: Router
  ) {
    // Configurar búsqueda con debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadProperties();
    this.loadUserFavorites(); // 🔥 CARGAR FAVORITOS REALES
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ CARGAR PROPIEDADES
   */
  loadProperties(): void {
    this.loading = true;
    this.error = null;

    this.propiedadesService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.properties = response.data;
            this.applyFilters();
          } else {
            this.error = response.message || 'Error al cargar las propiedades';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar propiedades:', error);
          this.error = 'Error al cargar las propiedades';
          this.loading = false;
        }
      });
  }

  /**
   * 🔥 CARGAR FAVORITOS REALES DEL USUARIO
   */
  private loadUserFavorites(): void {
    if (!this.authService.isAuthenticated) {
      return;
    }

    this.clientesService.getMisPropiedadesInteres()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (propiedades) => {
          this.favoriteIds = new Set(propiedades.map(p => p.id!));
          this.favoritesLoaded = true;
          console.log('✅ Favoritos cargados:', this.favoriteIds.size);
        },
        error: (error) => {
          console.error('❌ Error al cargar favoritos:', error);
          this.favoritesLoaded = true;
        }
      });
  }

  /**
   * 🔥 NAVEGAR AL DETALLE DE LA PROPIEDAD
   */
  navigateToDetail(property: Propiedad): void {
    console.log('🏠 Navegando al detalle de:', property.id);
    this.router.navigate(['/propiedades', property.id]);
  }

  /**
   * ✅ OBTENER VALOR DE CAMPO (EXACTO COMO PROPERTY-DETAIL)
   */
  getFieldAsString(property: Propiedad, field: keyof PropiedadFields): string {
    const value = property?.fields[field];
    return value ? String(value) : '';
  }

  /**
   * ✅ OBTENER VALOR NUMÉRICO (EXACTO COMO PROPERTY-DETAIL)
   */
  getFieldAsNumber(property: Propiedad, field: keyof PropiedadFields): number {
    const value = property?.fields[field];
    return typeof value === 'number' ? value : 0;
  }

  /**
   * ✅ FORMATEAR PRECIO (EXACTO COMO PROPERTY-DETAIL)
   */
  formatPrice(precio: number): string {
    if (!precio) return 'Precio a consultar';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  }

  /**
   * ✅ PRECIO POR M² (EXACTO COMO PROPERTY-DETAIL)
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

    // Verificar que la primera imagen tenga URL válida
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
   * ✅ IMAGEN POR DEFECTO IDÉNTICA A PROPERTY-DETAIL
   */
  private getDefaultImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPgogICAgPHRzcGFuPjxmYSBjbGFzcz0iZmFzIGZhLWhvbWUiLz4gU2luIGltYWdlbjwvdHNwYW4+CiAgPC90ZXh0Pgo8L3N2Zz4K';
  }

  /**
   * ✅ MANEJAR ERROR DE IMAGEN (EXACTO COMO PROPERTY-DETAIL)
   */
  onImageError(event: any): void {
    if (event.target.src !== this.getDefaultImage()) {
      event.target.src = this.getDefaultImage();
    }
  }

  /**
   * ✅ OBTENER RATING ENERGÉTICO
   */
  getEnergyRating(property: Propiedad): string {
    const fields = property.fields as any;
    return fields['Clasificación Energética'] ||
           fields['Rating Energético'] ||
           fields['Eficiencia Energética'] ||
           '';
  }

  /**
   * ✅ OBTENER NÚMERO DE IMÁGENES
   */
  getImageCount(property: Propiedad): number {
    const imagenes = property?.fields['Imágenes'];
    return Array.isArray(imagenes) ? imagenes.length : 0;
  }

  /**
   * ✅ CLASE CSS PARA BADGE DE ESTADO
   */
  getStatusBadgeClass(property: Propiedad): string {
    const estado = this.getFieldAsString(property, 'Estado').toLowerCase();
    switch (estado) {
      case 'disponible':
      case 'available':
        return 'bg-success';
      case 'vendido':
      case 'sold':
        return 'bg-danger';
      case 'alquilado':
      case 'rented':
        return 'bg-warning';
      case 'reservado':
      case 'reserved':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  /**
   * ✅ CLASE CSS PARA BADGE ENERGÉTICO
   */
  getEnergyBadgeClass(property: Propiedad): string {
    const rating = this.getEnergyRating(property).toUpperCase();
    switch (rating) {
      case 'A': return 'bg-success';
      case 'B': return 'bg-success bg-opacity-75';
      case 'C': return 'bg-warning';
      case 'D': return 'bg-warning bg-opacity-75';
      case 'E': return 'bg-danger bg-opacity-75';
      case 'F': return 'bg-danger';
      case 'G': return 'bg-dark';
      default: return 'bg-secondary';
    }
  }

  /**
   * ✅ CAMBIO EN BÚSQUEDA
   */
  onSearchChange(): void {
    this.searchSubject.next(this.searchText);
  }

  /**
   * ✅ APLICAR FILTROS
   */
  applyFilters(): void {
    let filtered = [...this.properties];

    if (this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(property =>
        this.getFieldAsString(property, 'Título').toLowerCase().includes(searchLower) ||
        this.getFieldAsString(property, 'Descripción').toLowerCase().includes(searchLower) ||
        this.getFieldAsString(property, 'Dirección').toLowerCase().includes(searchLower) ||
        this.getFieldAsString(property, 'Tipo').toLowerCase().includes(searchLower)
      );
    }

    if (this.filterType) {
      filtered = filtered.filter(property =>
        this.getFieldAsString(property, 'Tipo') === this.filterType
      );
    }

    if (this.filterStatus) {
      filtered = filtered.filter(property =>
        this.getFieldAsString(property, 'Estado') === this.filterStatus
      );
    }

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

    this.filteredProperties = filtered;
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * ✅ LIMPIAR FILTROS
   */
  clearFilters(): void {
    this.searchText = '';
    this.filterType = '';
    this.filterStatus = '';
    this.priceMin = null;
    this.priceMax = null;
    this.applyFilters();
  }

  /**
   * ✅ ALTERNAR VISTA
   */
  toggleView(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  /**
   * ✅ REFRESCAR PROPIEDADES
   */
  refreshProperties(): void {
    this.loadProperties();
  }

  /**
   * ✅ ESTADÍSTICAS
   */
  getTotalProperties(): number {
    return this.properties.length;
  }

  getAvailableProperties(): number {
    return this.properties.filter(p => {
      const estado = this.getFieldAsString(p, 'Estado').toLowerCase();
      return estado === 'disponible' || estado === 'available';
    }).length;
  }

  getAveragePrice(): string {
    if (this.properties.length === 0) return '€0';

    const propertiesWithPrice = this.properties.filter(p => this.getFieldAsNumber(p, 'Precio') > 0);
    if (propertiesWithPrice.length === 0) return '€0';

    const total = propertiesWithPrice.reduce((sum, property) =>
      sum + this.getFieldAsNumber(property, 'Precio'), 0
    );

    const average = total / propertiesWithPrice.length;
    return this.formatPrice(average);
  }

  /**
   * ✅ PAGINACIÓN
   */
  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProperties = this.filteredProperties.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredProperties.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPages = 5;

    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage;
  }

  getEndIndex(): number {
    return Math.min(this.getStartIndex() + this.itemsPerPage, this.filteredProperties.length);
  }

  /**
   * ✅ TRACKBY PARA PERFORMANCE
   */
  trackByProperty(index: number, property: Propiedad): string {
    return property.id;
  }

  /**
   * 🔥 CONTACTAR PROPIEDAD (CON STOP PROPAGATION)
   */
  contactProperty(property: Propiedad, event?: Event): void {
    // Evitar que se propague el click al contenedor padre
    if (event) {
      event.stopPropagation();
    }

    console.log('📞 Contactar propiedad:', property.id);

    // TODO: Implementar modal de contacto o navegación
    const propertyTitle = this.getFieldAsString(property, 'Título');
    const propertyAddress = this.getFieldAsString(property, 'Dirección');

    alert(`📞 Contactar sobre: ${propertyTitle}\n📍 Ubicación: ${propertyAddress}\n\n🚧 Funcionalidad en desarrollo.\n\nPróximamente podrás:\n• Enviar mensaje directo\n• Programar visita\n• Solicitar más información`);
  }

  /**
   * 🔥 TOGGLE FAVORITO REAL (REEMPLAZAR EL MÉTODO ANTERIOR)
   */
  toggleFavorite(property: Propiedad, event?: Event): void {
    // Evitar que se propague el click al contenedor padre
    if (event) {
      event.stopPropagation();
    }

    if (!this.authService.isAuthenticated) {
      alert('⚠️ Debes iniciar sesión para gestionar favoritos');
      return;
    }

    const propertyId = property.id;
    const propertyTitle = this.getFieldAsString(property, 'Título');

    console.log('🔥 Toggling favorito para:', propertyTitle);

    this.clientesService.toggleInteresUsuario(propertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.accion === 'agregada') {
            this.favoriteIds.add(propertyId);
            console.log('❤️ Agregado a favoritos:', propertyTitle);
          } else {
            this.favoriteIds.delete(propertyId);
            console.log('💔 Quitado de favoritos:', propertyTitle);
          }

          // Mostrar mensaje de éxito
          this.showMessage(result.mensaje, 'success');
        },
        error: (error) => {
          console.error('❌ Error al toggle favorito:', error);
          this.showMessage('Error al gestionar favoritos', 'error');
        }
      });
  }

  /**
   * 🔥 VERIFICAR SI ES FAVORITO (REAL)
   */
  isFavorite(property: Propiedad): boolean {
    return this.favoriteIds.has(property.id);
  }

  /**
   * 🔥 MOSTRAR MENSAJE AL USUARIO
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    // Por ahora, usar alert simple. Después se puede mejorar con toast/snackbar
    if (type === 'success') {
      console.log('✅', message);
    } else {
      console.error('❌', message);
    }

    // Toast simple con timeout
    const toastElement = document.createElement('div');
    toastElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : '#dc3545'};
      color: white;
      padding: 12px 20px;
      border-radius: 5px;
      z-index: 9999;
      font-weight: 600;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    toastElement.textContent = message;

    document.body.appendChild(toastElement);

    setTimeout(() => {
      if (document.body.contains(toastElement)) {
        document.body.removeChild(toastElement);
      }
    }, 3000);
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
}
