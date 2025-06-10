import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropiedadesService } from '../../../services/propiedades.service';
import { ClientesService } from '../../../services/clientes.service'; // 🔥 AÑADIR
import { AuthService } from '../../../services/auth.service'; // 🔥 AÑADIR
import { Propiedad, PropiedadFields } from '../../../models/airtable.interfaces';
import { EnergyRatingComponent, EnergyRatingData } from '../../../shared/components/energy-rating/energy-rating.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

// ✅ LEAFLET SIN CONFIGURACIÓN PERSONALIZADA DE ICONOS
import * as L from 'leaflet';

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EnergyRatingComponent,
    NavbarComponent
  ],
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.scss']
})
export class PropertyDetailComponent implements OnInit, OnDestroy, AfterViewInit {

  property: Propiedad | null = null;
  loading = true;
  error: string | null = null;
  currentImageIndex = 0;

  // 🔥 FAVORITOS - IGUAL QUE EN PROPERTY-LIST
  private favoriteIds: Set<string> = new Set();
  private favoritesLoaded = false;

  // 🔥 ESTADO DE LOADING PARA FAVORITOS
  favoriteLoading = false;

  // Mapa
  private map: L.Map | null = null;
  private mapInitialized = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propiedadesService: PropiedadesService,
    private clientesService: ClientesService, // 🔥 AÑADIR
    private authService: AuthService // 🔥 AÑADIR
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params['id'];
        if (id) {
          this.loadProperty(id);
          this.loadUserFavorites(); // 🔥 CARGAR FAVORITOS
        }
      });
  }

  ngAfterViewInit(): void {
    if (this.property && !this.mapInitialized) {
      this.initializeMap();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  /**
   * Cargar datos de la propiedad
   */
  private loadProperty(id: string): void {
    this.loading = true;
    this.error = null;

    this.propiedadesService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.property = response.data;

            setTimeout(() => {
              this.initializeMap();
            }, 100);
          } else {
            this.error = response.message || 'Propiedad no encontrada';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar propiedad:', error);
          this.error = 'Error al cargar los datos de la propiedad';
          this.loading = false;
        }
      });
  }

  /**
   * Obtener valor seguro de campo con tipado correcto
   */
  getFieldValue<K extends keyof PropiedadFields>(field: K): PropiedadFields[K] | undefined {
    return this.property?.fields[field];
  }

  /**
   * Obtener valor de campo como string
   */
  getFieldAsString(field: keyof PropiedadFields): string {
    const value = this.getFieldValue(field);
    return value ? String(value) : '';
  }

  /**
   * Obtener valor de campo como número
   */
  getFieldAsNumber(field: keyof PropiedadFields): number {
    const value = this.getFieldValue(field);
    return typeof value === 'number' ? value : 0;
  }

  /**
   * ✅ MÉTODO SEGURO para obtener valor sin restricción de tipos
   */
  private getFieldValueSafe(fieldName: string): any {
    return this.property?.fields?.[fieldName as keyof PropiedadFields];
  }

  /**
   * Formatear precio
   */
  formatPrice(precio: number | undefined): string {
    if (!precio) return 'Precio a consultar';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  }

  /**
   * Calcular precio por m²
   */
  getPricePerSquareMeter(): string {
    const precio = this.getFieldAsNumber('Precio');
    const superficie = this.getFieldAsNumber('Superficie');

    if (precio && superficie) {
      const precioM2 = precio / superficie;
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(precioM2);
    }

    return 'No calculable';
  }

  /**
   * ✅ OBTENER DATOS DE CLASIFICACIÓN ENERGÉTICA
   */
  getEnergyRatingData(): EnergyRatingData {
    if (!this.property?.fields) {
      return { rating: 'E' };
    }

    const fields = this.property.fields as any;

    // Buscar rating energético
    const rating = fields['Clasificación Energética'] ||
                   fields['Rating Energético'] ||
                   fields['Eficiencia Energética'] ||
                   'E';

    // Buscar consumo energía
    const consumoEnergia = fields['Consumo Energía'] ||
                           fields['Consumo de Energía'] ||
                           fields['kWh/m²'] ||
                           fields['Energía kWh/m²'] ||
                           undefined;

    // ✅ BUSCAR CONSUMO CO₂ - CON "Consumo KG"
    const consumoCO2 = fields['Consumo KG'] ||
                       fields['Consumo CO2'] ||
                       fields['Consumo CO₂'] ||
                       fields['Emisiones CO2'] ||
                       fields['Consumo Kg CO2'] ||
                       fields['Kg CO2/m²'] ||
                       fields['CO2 kg/m²'] ||
                       undefined;

    return {
      rating: String(rating),
      consumoEnergia: typeof consumoEnergia === 'number' ? consumoEnergia : undefined,
      consumoCO2: typeof consumoCO2 === 'number' ? consumoCO2 : undefined
    };
  }

  /**
   * ✅ VERIFICAR SI TIENE INFORMACIÓN ENERGÉTICA
   */
  hasEnergyInfo(): boolean {
    if (!this.property?.fields) return false;

    const data = this.getEnergyRatingData();
    return !!(data.rating !== 'E' || data.consumoEnergia || data.consumoCO2);
  }

  /**
   * Verificar si tiene imágenes
   */
  get hasImages(): boolean {
    const imagenes = this.getFieldValue('Imágenes');
    return Array.isArray(imagenes) && imagenes.length > 0;
  }

  /**
   * Obtener imagen actual
   */
  getCurrentImage(): string {
    const imagenes = this.getFieldValue('Imágenes');
    if (Array.isArray(imagenes) && imagenes[this.currentImageIndex]) {
      return imagenes[this.currentImageIndex].url;
    }
    return '/assets/images/no-image.jpg';
  }

  /**
   * Obtener todas las imágenes
   */
  getAllImages(): any[] {
    const imagenes = this.getFieldValue('Imágenes');
    return Array.isArray(imagenes) ? imagenes : [];
  }

  /**
   * Obtener número total de imágenes
   */
  getTotalImages(): number {
    return this.getAllImages().length;
  }

  /**
   * Navegar a imagen anterior
   */
  previousImage(): void {
    const imagenes = this.getAllImages();
    if (imagenes.length > 1) {
      this.currentImageIndex = this.currentImageIndex === 0
        ? imagenes.length - 1
        : this.currentImageIndex - 1;
    }
  }

  /**
   * Navegar a imagen siguiente
   */
  nextImage(): void {
    const imagenes = this.getAllImages();
    if (imagenes.length > 1) {
      this.currentImageIndex = this.currentImageIndex === imagenes.length - 1
        ? 0
        : this.currentImageIndex + 1;
    }
  }

  /**
   * Seleccionar imagen específica
   */
  selectImage(index: number): void {
    const imagenes = this.getAllImages();
    if (index >= 0 && index < imagenes.length) {
      this.currentImageIndex = index;
    }
  }

  /**
   * Manejar error al cargar imagen principal
   */
  onImageError(event: any): void {
    event.target.src = '/assets/images/no-image.jpg';
  }

  /**
   * Manejar error al cargar thumbnail
   */
  onThumbnailError(event: any, index: number): void {
    const imagenes = this.getAllImages();
    if (imagenes[index]) {
      event.target.src = imagenes[index].url;
    }
  }

  /**
   * Manejar error en imagen placeholder
   */
  onPlaceholderError(event: any): void {
    event.target.style.display = 'none';
  }

  /**
   * Obtener coordenadas de la propiedad
   */
  private getCoordinates(): { lat: number; lng: number } {
    const coordenadas = this.getFieldAsString('Coordenadas (Lat, Lng)');
    if (coordenadas) {
      try {
        const [lat, lng] = coordenadas.split(',').map((coord: string) => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      } catch (error) {
        console.warn('Error al parsear coordenadas:', error);
      }
    }

    return { lat: 40.4168, lng: -3.7038 };
  }

  /**
   * ✅ INICIALIZAR MAPA SIN ICONOS PERSONALIZADOS
   */
  private initializeMap(): void {
    if (!this.property || this.mapInitialized) return;

    setTimeout(() => {
      const mapElement = document.getElementById('propertyMap');
      if (!mapElement) return;

      try {
        if (this.map) {
          this.map.remove();
          this.map = null;
        }

        const coordinates = this.getCoordinates();

        this.map = L.map('propertyMap', {
          center: [coordinates.lat, coordinates.lng],
          zoom: 15,
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
          attributionControl: true
        });

        // ✅ TILES DE OPENSTREETMAP
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          detectRetina: true
        }).addTo(this.map);

        // ✅ MARCADOR CON ICONO POR DEFECTO
        const marker = L.marker([coordinates.lat, coordinates.lng]).addTo(this.map);

        const popupContent = `
          <div class="map-popup">
            <h6 class="mb-1">${this.getFieldAsString('Título') || 'Propiedad'}</h6>
            <p class="mb-1 text-muted small">${this.getFieldAsString('Dirección') || 'Ubicación'}</p>
            <p class="mb-0 fw-bold text-primary">${this.formatPrice(this.getFieldAsNumber('Precio'))}</p>
          </div>
        `;

        marker.bindPopup(popupContent);

        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
            this.mapInitialized = true;
          }
        }, 200);

      } catch (error) {
        console.error('Error al inicializar mapa:', error);
      }
    }, 300);
  }

  /**
   * Reinicializar mapa
   */
  reinitializeMap(): void {
    this.mapInitialized = false;
    this.initializeMap();
  }

  /**
   * Volver a la lista
   */
  goBack(): void {
    this.router.navigate(['/propiedades']);
  }

  /**
   * Solicitar cita para esta propiedad
   */
  requestAppointment(): void {
    if (this.property?.id) {
      console.log('📝 Navegando al formulario de citas para la propiedad:', this.property.id);

      // Navegar al formulario de citas pasando el Record ID de la propiedad
      this.router.navigate(['/citas'], {
        queryParams: { propertyRecordId: this.property.id }
      });
    } else {
      console.error('❌ No se puede solicitar cita: property.id no disponible');
    }
  }

  /**
   * Contactar sobre esta propiedad
   */
  contactAboutProperty(): void {
    console.log('Contactar sobre propiedad:', this.property?.id);
  }

  /**
   * ✅ OBTENER NÚMERO DE VISITAS - CAMPO REAL DE AIRTABLE
   */
  getVisitCount(): string {
    const fields = this.property?.fields as any;

    if (!fields) return '0';

    // 🔥 BUSCAR EL CAMPO EXACTO DE VISITAS
    const visits = fields['Número de visitas'] ||     // Nombre exacto
                   fields['Número de Visitas'] ||     // Con mayúscula
                   fields['numero de visitas'] ||     // En minúsculas
                   fields['NumeroDeVisitas'] ||       // Sin espacios
                   fields['Visitas'] ||               // Nombre corto
                   fields['Views'] ||                 // En inglés
                   0;

    return visits ? String(visits) : '0';
  }

  /**
   * ✅ CLASE CSS PARA BADGE DE ESTADO - IGUAL QUE EN PROPERTY-LIST
   */
  getStatusBadgeClass(): string {
    const estado = this.getFieldAsString('Estado').toLowerCase();
    switch (estado) {
      case 'disponible':
      case 'available':
        return 'bg-success'; // #28a745 (verde)
      case 'vendido':
      case 'vendida':
      case 'sold':
        return 'bg-danger'; // #dc3545 (rojo)
      case 'alquilado':
      case 'alquilada':
      case 'rented':
        return 'bg-warning'; // #fd7e14 (naranja)
      case 'reservado':
      case 'reservada':
      case 'reserved':
        return 'bg-info'; // #17a2b8 (azul claro)
      default:
        return 'bg-secondary'; // Gris para estados desconocidos
    }
  }

  /**
   * 🔥 CARGAR FAVORITOS REALES DEL USUARIO - IGUAL QUE PROPERTY-LIST
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
          console.log('✅ Favoritos cargados en detail:', this.favoriteIds.size);
        },
        error: (error) => {
          console.error('❌ Error al cargar favoritos en detail:', error);
          this.favoritesLoaded = true;
        }
      });
  }

  /**
   * 🔥 TOGGLE FAVORITO REAL - IGUAL QUE PROPERTY-LIST
   */
  toggleFavorite(event?: Event): void {
    // Evitar que se propague el click
    if (event) {
      event.stopPropagation();
    }

    if (!this.authService.isAuthenticated) {
      alert('⚠️ Debes iniciar sesión para gestionar favoritos');
      return;
    }

    if (!this.property?.id || this.favoriteLoading) {
      return;
    }

    const propertyId = this.property.id;
    const propertyTitle = this.getFieldAsString('Título');

    // 🔥 ACTIVAR LOADING
    this.favoriteLoading = true;

    this.clientesService.toggleInteresUsuario(propertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result.accion === 'agregada') {
            this.favoriteIds.add(propertyId);
            console.log('❤️ Agregado a favoritos en detail:', propertyTitle);
          } else {
            this.favoriteIds.delete(propertyId);
            console.log('💔 Quitado de favoritos en detail:', propertyTitle);
          }

          this.showMessage(result.mensaje, 'success');
          this.favoriteLoading = false; // 🔥 DESACTIVAR LOADING
        },
        error: (error) => {
          console.error('❌ Error al toggle favorito en detail:', error);
          this.showMessage('Error al gestionar favoritos', 'error');
          this.favoriteLoading = false; // 🔥 DESACTIVAR LOADING
        }
      });
  }

  /**
   * 🔥 VERIFICAR SI ES FAVORITO - IGUAL QUE PROPERTY-LIST
   */
  isFavorite(): boolean {
    return this.property?.id ? this.favoriteIds.has(this.property.id) : false;
  }

  /**
   * 🔥 MOSTRAR MENSAJE AL USUARIO - IGUAL QUE PROPERTY-LIST
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
