import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit, OnDestroy {

  // 🔥 PROPIEDADES PARA MANEJAR LA URL DEL IFRAME
  airtableBaseUrl = 'https://airtable.com/embed/apphONbM2nnoZThgr/pag9Q6NBo4IFez6L7/form';
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
    console.log('📝 Inicializando RegisterComponent...');

    // Verificar si ya está autenticado
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User | null) => {
          this.currentUser = user;
          console.log('👤 Usuario actual en register:', user);

          if (user) {
            // Si ya está logueado, redirigir al dashboard
            console.log('✅ Usuario ya autenticado, redirigiendo...');
            //this.router.navigate(['/dashboard']);
            this.router.navigate(['/propiedades']);
          } else {
            // Si no está logueado, construir el formulario
            this.buildIframeUrl();
          }
        },
        error: (error: any) => {
          console.error('❌ Error al verificar usuario:', error);
          this.buildIframeUrl();
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

    // Parámetros adicionales para el formulario de registro
    params.append('hide_Estado', 'true');
    params.append('prefill_Estado', 'Activo');
    params.append('hide_Fecha de Registro', 'true');

    // Construir URL final
    if (params.toString()) {
      url += '?' + params.toString();
    }

    console.log('🔗 URL del formulario de registro:', url);
    console.log('📋 Parámetros construidos:', Object.fromEntries(params));

    // Sanitizar URL para Angular
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.loading = false;
  }

  /**
   * 🔙 Volver al login
   */
  goToLogin(): void {
    console.log('🔙 Navegando al login...');
    this.router.navigate(['/auth/login']);
  }

  /**
   * 🏠 Ir a inicio
   */
  goToHome(): void {
    console.log('🏠 Navegando a inicio...');
    this.router.navigate(['/propiedades']);
  }

  /**
   * 💡 Ir a la página de ayuda
   */
  goToHelp(): void {
    console.log('💡 Navegando a ayuda...');
    // Aquí puedes agregar la lógica para ir a la página de ayuda
    window.open('mailto:ayuda@inmotable.com', '_blank');
  }

  /**
   * 📞 Contactar por teléfono
   */
  callSupport(): void {
    window.open('tel:+34900000000', '_self');
  }

  /**
   * 📧 Contactar por email
   */
  emailSupport(): void {
    window.open('mailto:registro@inmotable.com?subject=Ayuda con el registro', '_blank');
  }
}
