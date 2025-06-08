import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit, OnDestroy {

  // 🔥 PROPIEDADES PARA MANEJAR LA URL DEL IFRAME
  airtableBaseUrl = 'https://airtable.com/embed/apphONbM2nnoZThgr/pagJn1sd3oLYMMkYg/form'; // 🔥 CAMBIAR POR TU URL DE CONTACTO
  iframeUrl: SafeResourceUrl = '';
  currentUser: User | null = null;
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('📧 Inicializando ContactComponent...');

    // Suscribirse al usuario actual
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User | null) => {
          this.currentUser = user;
          console.log('👤 Usuario actual en contact:', user);
          this.buildIframeUrl();
        },
        error: (error: any) => {
          console.error('❌ Error al obtener usuario:', error);
          // No redirigir al login - el formulario de contacto es público
          this.buildIframeUrl();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 🔧 Construir URL del iframe con parámetros (CORREGIDO)
   */
  private buildIframeUrl(): void {
    let url = this.airtableBaseUrl;
    const params = new URLSearchParams();

    // 🔥 PARÁMETROS DE OCULTACIÓN PRIMERO (COMO EN APPOINTMENT-LIST)
    params.append('hide_Estado', 'true'); // Ocultar estado (nuevo por defecto)
    //params.append('hide_Fecha_Contacto', 'true'); // Ocultar fecha (se rellena automáticamente)

    // Si hay usuario logueado, prerellenar sus datos
    if (this.currentUser) {
      if (this.currentUser.nombre) {
        params.append('prefill_Nombre', this.currentUser.nombre);
      }
      if (this.currentUser.email) {
        params.append('prefill_Email', this.currentUser.email);
      }
      if (this.currentUser.telefono) {
        params.append('prefill_Teléfono', this.currentUser.telefono);
      }

      // Indicar el rol del usuario
      if (this.currentUser.rol) {
        params.append('prefill_Tipo_Usuario', this.getRoleLabel());
      }

      console.log('✅ Usuario logueado - prerrellenando datos:', {
        nombre: this.currentUser.nombre,
        email: this.currentUser.email,
        telefono: this.currentUser.telefono,
        rol: this.currentUser.rol
      });
    } else {
      console.log('ℹ️ Usuario no logueado - formulario público');
    }

    // Construir URL final
    if (params.toString()) {
      url += '?' + params.toString();
    }

    console.log('🔗 URL del formulario de contacto:', url);
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
   * 📅 Ir al calendario de citas
   */
  goToAppointmentCalendar(): void {
    console.log('📅 Navegando al calendario de citas...');
    this.router.navigate(['/calendario']);
  }

  /**
   * 📧 Ir a solicitar cita
   */
  goToAppointmentList(): void {
    console.log('📧 Navegando a solicitar cita...');
    this.router.navigate(['/citas']);
  }

  /**
   * 🏷️ Obtener etiqueta del rol
   */
  getRoleLabel(): string {
    if (!this.currentUser?.rol) return 'Visitante';

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
   * ✉️ Obtener información del contacto
   */
  getContactInfo(): string {
    return `
📧 Formulario de contacto
👤 Usuario: ${this.currentUser?.nombre || 'Anónimo'}
📧 Email: ${this.currentUser?.email || 'No disponible'}
🏷️ Tipo: ${this.getRoleLabel()}
    `;
  }
}
