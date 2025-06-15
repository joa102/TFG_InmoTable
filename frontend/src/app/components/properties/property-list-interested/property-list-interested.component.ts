import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Servicios
import { ClientesService } from '../../../services/clientes.service';
import { AuthService } from '../../../services/auth.service';

// 🔥 USAR LAS INTERFACES CORRECTAS DEL API
import { Propiedad } from '../../../interfaces/api.interfaces';

@Component({
  selector: 'app-property-list-interested',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './property-list-interested.component.html',
  styleUrls: ['./property-list-interested.component.scss']
})
export class PropertyListInterestedComponent implements OnInit, OnDestroy {

  // ✅ DATOS - USANDO INTERFACE CORRECTA
  properties: Propiedad[] = [];
  filteredProperties: Propiedad[] = [];
  paginatedProperties: Propiedad[] = [];

  // ✅ ESTADOS - IGUAL QUE PROPERTY-LIST
  loading = true;
  error: string | null = null;

  // 🔥 FILTROS COMPLETOS - IGUAL QUE PROPERTY-LIST
  searchText = '';
  filterType = '';
  filterStatus = '';
  priceMin: number | null = null;
  priceMax: number | null = null;

  // ✅ VISTA - IGUAL QUE PROPERTY-LIST
  viewMode: 'grid' | 'list' = 'grid';

  // ✅ PAGINACIÓN - IGUAL QUE PROPERTY-LIST
  currentPage = 1;
  itemsPerPage = 12;

  // 🔥 GESTIÓN DE INTERÉS (ESPECÍFICO PARA ESTE COMPONENTE)
  private interestedIds: Set<string> = new Set();

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private clientesService: ClientesService,
    private authService: AuthService,
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
    this.loadInterestedProperties();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 🔥 CARGAR PROPIEDADES DE INTERÉS DEL USUARIO LOGUEADO
   */
  private loadInterestedProperties(): void {
    this.loading = true;
    this.error = null;

    // 🔥 SALTAR VERIFICACIÓN DE AUTENTICACIÓN - Sin autenticación real
    // if (!this.authService.isAuthenticated) {
    //   this.error = 'Debes iniciar sesión para ver tus propiedades de interés';
    //   this.loading = false;
    //   return;
    // }

    this.clientesService.getMisPropiedadesInteres()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (propiedades: Propiedad[]) => { // 🔥 TIPO CORRECTO
          console.log('✅ Propiedades de interés cargadas:', propiedades.length);
          this.properties = propiedades;

          // Crear set de IDs para gestión rápida
          this.interestedIds = new Set(propiedades.map(p => p.id!));

          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar propiedades de interés:', error);
          this.error = 'Error al cargar tus propiedades de interés';
          this.loading = false;
        }
      });
  }

  /**
   * 🔥 NAVEGAR AL DETALLE DE LA PROPIEDAD - IGUAL QUE PROPERTY-LIST
   */
  navigateToDetail(property: Propiedad): void {
    console.log('🏠 Navegando al detalle de:', property.id);
    this.router.navigate(['/propiedades', property.id]);
  }

  // ===============================
  // 🔥 MÉTODOS ADAPTADOS PARA API.INTERFACES
  // ===============================

  /**
   * ✅ OBTENER VALOR DE CAMPO (ADAPTADO PARA API.INTERFACES)
   */
  getFieldAsString(property: Propiedad, field: keyof Propiedad['fields']): string {
    const value = property?.fields[field];
    return value ? String(value) : '';
  }

  /**
   * ✅ OBTENER VALOR NUMÉRICO (ADAPTADO PARA API.INTERFACES)
   */
  getFieldAsNumber(property: Propiedad, field: keyof Propiedad['fields']): number {
    const value = property?.fields[field];
    return typeof value === 'number' ? value : 0;
  }

  /**
   * ✅ FORMATEAR PRECIO (EXACTO COMO PROPERTY-LIST)
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
   * ✅ PRECIO POR M² (ADAPTADO PARA API.INTERFACES)
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
   * ✅ VERIFICAR SI LA PROPIEDAD TIENE IMAGEN VÁLIDA (CORREGIDO)
   */
  hasPropertyImage(property: Propiedad): boolean {
    const imagenes = property?.fields['Imágenes'];
    if (!Array.isArray(imagenes) || imagenes.length === 0) {
      return false;
    }

    // 🔥 MANEJO SEGURO DE DIFERENTES TIPOS DE IMAGEN
    const firstImage = imagenes[0];

    // Caso 1: Es string (URL directa)
    if (typeof firstImage === 'string') {
      return firstImage.length > 0;
    }

    // Caso 2: Es objeto con propiedades
    if (typeof firstImage === 'object' && firstImage !== null) {
      const imageObj = firstImage as any;
      return !!(imageObj.url || imageObj.thumbnails?.large?.url);
    }

    return false;
  }

  /**
   * ✅ OBTENER IMAGEN SEGURA (CORREGIDO)
   */
  getPropertyImage(property: Propiedad): string {
    if (!this.hasPropertyImage(property)) {
      return this.getDefaultImage();
    }

    const imagenes = property.fields['Imágenes'] as any[];
    const firstImage = imagenes[0];

    // 🔥 MANEJO SEGURO DE DIFERENTES TIPOS DE IMAGEN

    // Caso 1: Es string (URL directa)
    if (typeof firstImage === 'string') {
      return firstImage;
    }

    // Caso 2: Es objeto con propiedades
    if (typeof firstImage === 'object' && firstImage !== null) {
      const imageObj = firstImage as any;

      return imageObj.thumbnails?.large?.url ||
             imageObj.thumbnails?.medium?.url ||
             imageObj.thumbnails?.small?.url ||
             imageObj.url ||
             this.getDefaultImage();
    }

    return this.getDefaultImage();
  }

  /**
   * ✅ IMAGEN POR DEFECTO IDÉNTICA A PROPERTY-LIST
   */
  private getDefaultImage(): string {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZjNzU3ZCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPgogICAgPHRzcGFuPjxmYSBjbGFzcz0iZmFzIGZhLWhvbWUiLz4gU2luIGltYWdlbjwvdHNwYW4+CiAgPC90ZXh0Pgo8L3N2Zz4K';
  }

  /**
   * ✅ MANEJAR ERROR DE IMAGEN (EXACTO COMO PROPERTY-LIST)
   */
  onImageError(event: any): void {
    if (event.target.src !== this.getDefaultImage()) {
      event.target.src = this.getDefaultImage();
    }
  }

  /**
   * ✅ OBTENER NÚMERO DE VISITAS - ADAPTADO PARA API.INTERFACES
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
   * ✅ OBTENER AÑO DE CONSTRUCCIÓN - ADAPTADO PARA API.INTERFACES
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
   * ✅ CLASE CSS PARA BADGE DE ESTADO (ADAPTADO)
   */
  getStatusBadgeClass(property: Propiedad): string {
    const estado = this.getFieldAsString(property, 'Estado').toLowerCase();
    switch (estado) {
      case 'disponible':
      case 'available':
        return 'bg-success';
      case 'vendida':
      case 'sold':
        return 'bg-danger';
      case 'alquilada':
      case 'rented':
        return 'bg-warning';
      case 'reservada':
      case 'reserved':
        return 'bg-info';
      default:
        return 'bg-secondary';
    }
  }

  // ===============================
  // 🔥 MÉTODOS ESPECÍFICOS DE INTERÉS
  // ===============================

  /**
   * 🔥 QUITAR DE INTERÉS REAL (REEMPLAZAR EL MÉTODO SIMULADO)
   */
  removeFromInterest(property: Propiedad, event?: Event): void {
    // Evitar que se propague el click al contenedor padre
    if (event) {
      event.stopPropagation();
    }

    const propertyTitle = this.getFieldAsString(property, 'Título');

    // Confirmar acción
    if (!confirm(`¿Estás seguro de que deseas quitar "${propertyTitle}" de tus propiedades de interés?`)) {
      return;
    }

    console.log('🔥 Quitando de interés:', propertyTitle);

    this.clientesService.quitarInteresUsuario(property.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Quitar de la lista local inmediatamente
          this.interestedIds.delete(property.id!);
          this.properties = this.properties.filter(p => p.id !== property.id);
          this.applyFilters();

          console.log('✅ Propiedad quitada de interés:', propertyTitle);
          this.showMessage('Propiedad quitada de tus favoritos', 'success');
        },
        error: (error) => {
          console.error('❌ Error al quitar de interés:', error);
          this.showMessage('Error al quitar de favoritos', 'error');
        }
      });
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

    const propertyTitle = this.getFieldAsString(property, 'Título');
    const propertyAddress = this.getFieldAsString(property, 'Dirección');

    alert(`📞 Contactar sobre: ${propertyTitle}\n📍 Ubicación: ${propertyAddress}\n\n🚧 Funcionalidad en desarrollo.\n\nPróximamente podrás:\n• Enviar mensaje directo\n• Programar visita\n• Solicitar más información`);
  }

  /**
   * ✅ CAMBIO EN BÚSQUEDA
   */
  onSearchChange(): void {
    this.searchSubject.next(this.searchText);
  }

  /**
   * ✅ APLICAR FILTROS COMPLETOS - COPIADO DE PROPERTY-LIST
   */
  applyFilters(): void {
    let filtered = [...this.properties];

    // 🔥 FILTRO POR BÚSQUEDA DE TEXTO
    if (this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(property =>
        this.getFieldAsString(property, 'Título').toLowerCase().includes(searchLower) ||
        this.getFieldAsString(property, 'Descripción').toLowerCase().includes(searchLower) ||
        this.getFieldAsString(property, 'Dirección').toLowerCase().includes(searchLower) ||
        this.getFieldAsString(property, 'Tipo').toLowerCase().includes(searchLower)
      );
    }

    // 🔥 FILTRO POR TIPO
    if (this.filterType) {
      filtered = filtered.filter(property =>
        this.getFieldAsString(property, 'Tipo') === this.filterType
      );
    }

    // 🔥 FILTRO POR ESTADO
    if (this.filterStatus) {
      filtered = filtered.filter(property =>
        this.getFieldAsString(property, 'Estado') === this.filterStatus
      );
    }

    // 🔥 FILTRO POR PRECIO MÍNIMO
    if (this.priceMin !== null && this.priceMin > 0) {
      filtered = filtered.filter(property =>
        this.getFieldAsNumber(property, 'Precio') >= this.priceMin!
      );
    }

    // 🔥 FILTRO POR PRECIO MÁXIMO
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
   * ✅ LIMPIAR FILTROS COMPLETOS
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
   * ✅ ESTADÍSTICAS ESPECÍFICAS PARA PROPIEDADES DE INTERÉS
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

  getSoldProperties(): number {
    return this.properties.filter(p => {
      const estado = this.getFieldAsString(p, 'Estado').toLowerCase();
      return estado === 'vendida' || estado === 'vendido' || estado === 'sold';
    }).length;
  }

  getRentedProperties(): number {
    return this.properties.filter(p => {
      const estado = this.getFieldAsString(p, 'Estado').toLowerCase();
      return estado === 'alquilada' || estado === 'alquilado' || estado === 'rented';
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
   * ✅ ALTERNAR VISTA (FALTABA ESTE MÉTODO)
   */
  toggleView(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  /**
   * ✅ REFRESCAR PROPIEDADES (FALTABA ESTE MÉTODO)
   */
  refreshProperties(): void {
    this.loadInterestedProperties();
  }

  /**
   * ✅ PAGINACIÓN - MÉTODOS FALTANTES
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
   * ✅ TRACKBY PARA PERFORMANCE (FALTABA)
   */
  trackByProperty(index: number, property: Propiedad): string {
    return property.id!;
  }

  /**
   * ✅ IR A PROPERTY LIST PARA EXPLORAR (FALTABA)
   */
  goToPropertyList(): void {
    this.router.navigate(['/propiedades']);
  }

  /**
   * ✅ ESTADÍSTICAS DETALLADAS POR ESTADO (FALTABA)
   */
  getPropertiesByStatus(): any {
    const byStatus = {
      disponible: 0,
      vendida: 0,
      alquilada: 0,
      reservada: 0,
      otros: 0
    };

    this.properties.forEach(property => {
      const estado = this.getFieldAsString(property, 'Estado').toLowerCase();

      if (estado === 'disponible' || estado === 'available') {
        byStatus.disponible++;
      } else if (estado === 'vendida' || estado === 'vendido' || estado === 'sold') {
        byStatus.vendida++;
      } else if (estado === 'alquilada' || estado === 'alquilado' || estado === 'rented') {
        byStatus.alquilada++;
      } else if (estado === 'reservada' || estado === 'reservado' || estado === 'reserved') {
        byStatus.reservada++;
      } else {
        byStatus.otros++;
      }
    });

    return byStatus;
  }

  /**
   * ✅ TIPOS DE PROPIEDADES MÁS COMUNES (FALTABA)
   */
  getMostCommonTypes(): string[] {
    const typeCounts: {[key: string]: number} = {};

    this.properties.forEach(property => {
      const tipo = this.getFieldAsString(property, 'Tipo');
      if (tipo) {
        typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
      }
    });

    return Object.keys(typeCounts)
      .sort((a, b) => typeCounts[b] - typeCounts[a])
      .slice(0, 3); // Top 3 tipos
  }

  /**
   * 🔥 MOSTRAR MENSAJE AL USUARIO (IGUAL QUE EN PROPERTY-LIST)
   */
  private showMessage(message: string, type: 'success' | 'error'): void {
    console.log(type === 'success' ? '✅' : '❌', message);

    // Toast simple
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
}
