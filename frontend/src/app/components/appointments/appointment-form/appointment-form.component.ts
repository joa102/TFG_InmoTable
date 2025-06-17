import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, User } from '../../../services/auth.service';
import { PropiedadesService } from '../../../services/propiedades.service'; // 🔥 AÑADIR IMPORT
import { Propiedad } from '../../../models/airtable.interfaces'; // 🔥 AÑADIR IMPORT

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.scss']
})
export class AppointmentFormComponent implements OnInit, OnDestroy {

  // 🔥 PROPIEDADES EXISTENTES
  airtableBaseUrl = 'https://airtable.com/embed/apphONbM2nnoZThgr/pagtZbDsnocCqMAzm/form';
  iframeUrl: SafeResourceUrl = '';
  propertyRecordId: string | null = null;
  currentUser: User | null = null;
  loading = true;

  // 🔥 NUEVAS PROPIEDADES PARA LA PROPIEDAD
  selectedProperty: Propiedad | null = null;
  loadingProperty = false;
  propertyError: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private authService: AuthService,
    private propiedadesService: PropiedadesService // 🔥 AÑADIR SERVICIO
  ) {}

  ngOnInit(): void {
    console.log('📝 Inicializando AppointmentFormComponent...');

    // Suscribirse al usuario actual
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User | null) => {
          this.currentUser = user;
          console.log('👤 Usuario actual en appointment-form:', user);

          if (user) {
            // Una vez que tenemos el usuario, procesamos los query params
            this.route.queryParams
              .pipe(takeUntil(this.destroy$))
              .subscribe(params => {
                this.propertyRecordId = params['propertyRecordId'] || null;
                console.log('🏠 Property Record ID:', this.propertyRecordId);

                // 🔥 CARGAR DATOS DE LA PROPIEDAD SI HAY ID
                if (this.propertyRecordId) {
                  this.loadPropertyData(this.propertyRecordId);
                }

                this.buildIframeUrl();
              });
          } else {
            console.warn('⚠️ No hay usuario logueado');
            this.router.navigate(['/auth/login']);
          }
        },
        error: (error: any) => {
          console.error('❌ Error al obtener usuario:', error);
          this.router.navigate(['/auth/login']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 🔥 CAMBIAR DE PRIVATE A PUBLIC
  /**
   * 🏠 Cargar datos de la propiedad seleccionada
   */
  loadPropertyData(propertyId: string): void { // 🔥 QUITAR 'private'
    this.loadingProperty = true;
    this.propertyError = null;

    console.log('🔍 Cargando datos de la propiedad:', propertyId);

    this.propiedadesService.getById(propertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.selectedProperty = response.data;
            console.log('✅ Propiedad cargada:', this.selectedProperty);
          } else {
            this.propertyError = response.message || 'No se pudo cargar la propiedad';
            console.error('❌ Error en respuesta:', response.message);
          }
          this.loadingProperty = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar propiedad:', error);
          this.propertyError = 'Error al cargar los datos de la propiedad';
          this.loadingProperty = false;
        }
      });
  }

  /**
   * 🔧 Construir URL del iframe con parámetros
   */
  private buildIframeUrl(): void {
    let url = this.airtableBaseUrl;
    const params = new URLSearchParams();

    // Agregar ID de propiedad si existe
    if (this.propertyRecordId) {
      params.append('prefill_Propiedad', this.propertyRecordId);
      params.append('hide_Propiedad', 'true');
      console.log('✅ Agregando propiedad al formulario:', this.propertyRecordId);
    }

    // 🔥 USAR EL recordId DEL USUARIO LOGUEADO
    if (this.currentUser?.recordId) {
      params.append('prefill_Cliente', this.currentUser.recordId);
      params.append('hide_Cliente', 'true');
      console.log('✅ Agregando cliente del usuario logueado:', this.currentUser.recordId);
    } else {
      console.warn('⚠️ No se encontró recordId del usuario, usando valor por defecto');
      // Fallback al valor anterior si no hay recordId
      params.append('prefill_Cliente', 'recDmY1oJL8wNTO9q');
      params.append('hide_Cliente', 'true');
    }

    // Parámetros adicionales
    params.append('hide_Estado', 'true');

    // Prerellenar información adicional del usuario si está disponible
    if (this.currentUser) {
      if (this.currentUser.nombre) {
        params.append('prefill_Nombre_Cliente', this.currentUser.nombre);
      }
      if (this.currentUser.email) {
        params.append('prefill_Email_Cliente', this.currentUser.email);
      }
      if (this.currentUser.telefono) {
        params.append('prefill_Teléfono_Cliente', this.currentUser.telefono);
      }
    }

    // Construir URL final
    if (params.toString()) {
      url += '?' + params.toString();
    }

    console.log('🔗 URL del formulario de citas:', url);
    console.log('📋 Parámetros construidos:', Object.fromEntries(params));

    // Sanitizar URL para Angular
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.loading = false;
  }

  // 🔥 NUEVOS MÉTODOS PARA OBTENER DATOS DE LA PROPIEDAD
  /**
   * 🏷️ Obtener título de la propiedad
   */
  getPropertyTitle(): string {
    if (!this.selectedProperty?.fields) return 'Propiedad seleccionada';
    return this.selectedProperty.fields['Título'] || 'Sin título';
  }

  /**
   * 📍 Obtener dirección de la propiedad
   */
  getPropertyAddress(): string {
    if (!this.selectedProperty?.fields) return '';
    return this.selectedProperty.fields['Dirección'] || '';
  }

  /**
   * 🏠 Obtener tipo de la propiedad
   */
  getPropertyType(): string {
    if (!this.selectedProperty?.fields) return '';
    return this.selectedProperty.fields['Tipo'] || '';
  }

  /**
   * 💰 Obtener precio formateado de la propiedad
   */
  getPropertyPrice(): string {
    if (!this.selectedProperty?.fields) return '';
    const precio = this.selectedProperty.fields['Precio'];
    if (!precio) return 'Consultar precio';

    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  }

  /**
   * 🎨 Obtener estado de la propiedad
   */
  getPropertyStatus(): string {
    if (!this.selectedProperty?.fields) return '';
    return this.selectedProperty.fields['Estado'] || '';
  }

  /**
   * 🎨 Obtener clase CSS del estado
   */
  getPropertyStatusClass(): string {
    const estado = this.getPropertyStatus().toLowerCase();
    switch (estado) {
      case 'disponible':
      case 'available':
        return 'success';
      case 'vendido':
      case 'sold':
        return 'danger';
      case 'alquilado':
      case 'rented':
        return 'warning';
      case 'reservado':
      case 'reserved':
        return 'info';
      default:
        return 'secondary';
    }
  }

  /**
   * 🔍 Verificar si la propiedad tiene características para mostrar
   */
  hasPropertyFeatures(): boolean {
    if (!this.selectedProperty?.fields) return false;
    
    return !!(
      this.selectedProperty.fields['Habitaciones'] ||
      this.selectedProperty.fields['Baños'] ||
      this.selectedProperty.fields['Superficie']
    );
  }

  // 🔥 MÉTODOS EXISTENTES SIN CAMBIOS
  /**
   * 🔙 Volver a propiedades
   */
  goBack(): void {
    console.log('🔙 Navegando de vuelta a propiedades...');
    this.router.navigate(['/propiedades']);
  }

  /**
   * 🏠 Ir a propiedades
   */
  goToProperty(): void {
    if (this.propertyRecordId) {
      console.log('🏠 Navegando al detalle de la propiedad:', this.propertyRecordId);
      this.router.navigate(['/propiedades', this.propertyRecordId]);
    } else {
      console.log('🏠 Navegando a la lista de propiedades...');
      this.router.navigate(['/propiedades']);
    }
  }

  /**
   * 📅 Ir al calendario de citas
   */
  goToAppointmentCalendar(): void {
    console.log('📅 Navegando al calendario de citas...');
    this.router.navigate(['/calendario']);
  }

  /**
   * 🏷️ Obtener etiqueta del rol
   */
  getRoleLabel(): string {
    if (!this.currentUser?.rol) return 'Usuario';

    const roleLabels: { [key: string]: string } = {
      'admin': 'Administrador',
      'agente': 'Agente Inmobiliario',
      'cliente': 'Cliente'
    };

    return roleLabels[this.currentUser.rol.toLowerCase()] || this.currentUser.rol;
  }

  /**
   * 🎨 Obtener clase CSS del rol
   */
  getRoleClass(): string {
    if (!this.currentUser?.rol) return 'secondary';

    const roleClasses: { [key: string]: string } = {
      'admin': 'danger',
      'agente': 'success',
      'cliente': 'primary'
    };

    return roleClasses[this.currentUser.rol.toLowerCase()] || 'secondary';
  }

  /**
   * 🔍 Obtener información del usuario para debug
   */
  getUserInfo(): string {
    if (!this.currentUser) return 'No hay usuario logueado';

    return `
👤 Usuario: ${this.currentUser.nombre}
📧 Email: ${this.currentUser.email}
🏷️ Rol: ${this.currentUser.rol}
🆔 Record ID: ${this.currentUser.recordId}
🏠 Propiedad: ${this.propertyRecordId || 'Ninguna'}
    `;
  }
}
