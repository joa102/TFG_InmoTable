import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, User } from '../../../services/auth.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent  // 🔥 AÑADIR NAVBAR
  ],
  templateUrl: './appointment-calendar.component.html',
  styleUrls: ['./appointment-calendar.component.scss']
})
export class AppointmentCalendarComponent implements OnInit, OnDestroy {

  // 🔥 PROPIEDADES PARA MANEJAR LA URL DEL IFRAME
  airtableBaseUrl = 'https://airtable.com/embed/apphONbM2nnoZThgr/shrHTDPNqs0j8POzZ';
  iframeUrl: SafeResourceUrl = '';
  clienteRecordId: string | null = null;
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
    console.log('📅 Inicializando AppointmentCalendarComponent...');

    // Suscribirse al usuario actual
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        console.log('👤 Usuario actual:', user);

        if (user) {
          this.extractClienteRecordId();
        } else {
          console.warn('⚠️ No hay usuario logueado');
          this.router.navigate(['/auth/login']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 🔧 Extraer el primer cliente del array clientes[]
   */
  private extractClienteRecordId(): void {
    if (!this.currentUser) {
      console.warn('⚠️ No hay usuario actual');
      this.buildIframeUrl();
      return;
    }

    // Obtener el primer cliente del array
    if (this.currentUser.clientes && this.currentUser.clientes.length > 0) {
      this.clienteRecordId = this.currentUser.clientes[0];
      console.log('✅ Cliente Record ID extraído:', this.clienteRecordId);
      console.log('📋 Array completo de clientes:', this.currentUser.clientes);
    } else {
      console.log('ℹ️ El usuario no tiene clientes asignados');
      this.clienteRecordId = null;
    }

    this.buildIframeUrl();
  }

  /**
   * 🔧 Construir URL del iframe con parámetros
   */
  private buildIframeUrl(): void {
    let url = this.airtableBaseUrl;
    const params = new URLSearchParams();

    // Si hay un clienteRecordId, añadirlo como parámetro de filtro
    if (this.clienteRecordId) {
      params.append('filter_Cliente', this.clienteRecordId);
      console.log('✅ Agregando filtro de cliente al calendario:', this.clienteRecordId);
    } else {
      console.log('ℹ️ No se agregará filtro de cliente - mostrando todas las citas');
    }

    // Añadir información del usuario logueado si está disponible
    if (this.currentUser) {
      // Configurar vista por defecto
      params.append('view', 'Calendar');

      // Añadir identificación del usuario para logs
      if (this.currentUser.recordId) {
        params.append('user', this.currentUser.recordId);
      }
    }

    // Construir URL final
    if (params.toString()) {
      url += '?' + params.toString();
    }

    console.log('🔗 URL del calendario:', url);
    console.log('📋 Parámetros construidos:', Object.fromEntries(params));

    // Sanitizar URL para Angular
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.loading = false;
  }

  /**
   * 🔙 Volver a la página anterior
   */
  goBack(): void {
    console.log('🔙 Navegando hacia atrás...');
    this.router.navigate(['/propiedades']);
  }

  /**
   * 🏠 Ir a propiedades
   */
  goToProperties(): void {
    console.log('🏠 Navegando a propiedades...');
    this.router.navigate(['/propiedades']);
  }

  /**
   * 📅 Solicitar nueva cita (navegar a formulario de citas)
   */
  goToAppointmentList(): void {
    console.log('📅 Navegando a solicitar nueva cita...');
    this.router.navigate(['/citas']);
  }

  // 🔥 OPCIONAL: Añadir método más específico
  /**
   * 📅 Solicitar cita específica
   */
  requestAppointment(): void {
    console.log('📅 Navegando a solicitar cita...');
    this.router.navigate(['/citas']);
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
👥 Clientes: ${this.currentUser.clientes?.length || 0}
🆔 Cliente seleccionado: ${this.clienteRecordId || 'Ninguno'}
    `;
  }
}
