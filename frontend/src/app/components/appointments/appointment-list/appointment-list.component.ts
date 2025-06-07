import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent
  ],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss'
})
export class AppointmentListComponent implements OnInit, OnDestroy {

  // 🔥 PROPIEDADES PARA MANEJAR LA URL DEL IFRAME
  airtableBaseUrl = 'https://airtable.com/embed/apphONbM2nnoZThgr/pagtZbDsnocCqMAzm/form';
  iframeUrl: SafeResourceUrl = '';
  propertyRecordId: string | null = null;
  currentUser: User | null = null;
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('📅 Inicializando AppointmentListComponent...');

    // Suscribirse al usuario actual
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User | null) => {
          this.currentUser = user;
          console.log('👤 Usuario actual en appointment-list:', user);

          if (user) {
            // Una vez que tenemos el usuario, procesamos los query params
            this.route.queryParams
              .pipe(takeUntil(this.destroy$))
              .subscribe(params => {
                this.propertyRecordId = params['propertyRecordId'] || null;
                console.log('🏠 Property Record ID:', this.propertyRecordId);
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
    console.log('🏠 Navegando a propiedades...');
    this.router.navigate(['/propiedades']);
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

/*import { Component } from '@angular/core';

@Component({
  selector: 'app-appointment-list',
  imports: [],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss'
})
export class AppointmentListComponent {

}*/


/*import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="fas fa-calendar-alt me-2"></i>Lista de Citas</h2>
            <button class="btn btn-primary">
              <i class="fas fa-plus me-2"></i>Nueva Cita
            </button>
          </div>

          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Funcionalidad en desarrollo...</strong>
            <p class="mb-0">Esta sección estará disponible próximamente.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }

    h2 {
      color: #2c3e50;
      font-weight: 600;
    }

    .alert {
      border-left: 4px solid #17a2b8;
    }
  `]
})
export class AppointmentListComponent {}*/
