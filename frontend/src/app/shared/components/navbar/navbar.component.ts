import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, User } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {

  currentUser: User | null = null;
  isLoggedIn = false;
  showUserDropdown = false;

  private destroy$ = new Subject<void>();
  private documentClickListener?: (event: Event) => void;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios de autenticación
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isLoggedIn = !!user;
        console.log('👤 Usuario actual en navbar:', user);
      });

    // Cerrar dropdown al hacer click en cualquier parte del documento
    this.documentClickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('.dropdown');

      if (!dropdown && this.showUserDropdown) {
        this.showUserDropdown = false;
        console.log('🔒 Dropdown cerrado por click fuera');
      }
    };

    document.addEventListener('click', this.documentClickListener);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Limpiar event listener para evitar memory leaks
    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener);
    }
  }

  // ===============================
  // 🔄 TOGGLE DROPDOWN
  // ===============================

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
    console.log('🔄 Toggle dropdown:', this.showUserDropdown);
  }

  // ===============================
  // 🔗 MÉTODOS DE NAVEGACIÓN
  // ===============================

  navigateToHome(): void {
    console.log('🏠 Navegando a inicio...');
    this.showUserDropdown = false;
    this.router.navigate(['/propiedades']);
  }

  navigateToProperties(): void {
    console.log('🏢 Navegando a propiedades...');
    this.showUserDropdown = false;
    this.router.navigate(['/propiedades']);
  }

  navigateToContact(): void {
    console.log('📧 Navegando a contacto...');
    this.showUserDropdown = false;
    alert('🚧 Página de contacto en desarrollo.\n\nPróximamente podrás:\n• Enviar consultas\n• Ver información de contacto\n• Solicitar información');
  }

  navigateToLogin(): void {
    console.log('🔐 Navegando a login...');
    this.showUserDropdown = false;
    this.router.navigate(['/auth/login']);
  }

  navigateToUserProfile(): void {
    console.log('👤 Navegando a perfil de usuario...');
    this.showUserDropdown = false;

    if (!this.currentUser) {
      console.warn('⚠️ No hay usuario logueado');
      this.router.navigate(['/auth/login']);
      return;
    }

    const userInfo = `
👤 DATOS DEL USUARIO:

📛 Nombre: ${this.currentUser.nombre}
📧 Email: ${this.currentUser.email}
🏷️ Rol: ${this.getRoleLabel()}
🆔 ID: ${this.currentUser.id}

🚧 Página de perfil en desarrollo.
Próximamente podrás editar tus datos.
    `;

    alert(userInfo);
  }

  navigateToInterestedProperties(): void {
    console.log('❤️ Navegando a propiedades de interés...');
    this.showUserDropdown = false;

    if (!this.currentUser) {
      console.warn('⚠️ No hay usuario logueado');
      this.router.navigate(['/auth/login']);
      return;
    }

    alert('❤️ Propiedades de Interés\n\n🚧 Funcionalidad en desarrollo.\n\nPróximamente podrás:\n• Ver tus propiedades favoritas\n• Gestionar tu lista de interés\n• Recibir notificaciones de cambios');
  }

  navigateToAppointments(): void {
    console.log('📅 Navegando a citas...');
    this.showUserDropdown = false;

    if (!this.currentUser) {
      console.warn('⚠️ No hay usuario logueado');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.router.navigate(['/calendario']).catch(error => {
      console.error('❌ Error al navegar a calendario:', error);
      alert('📅 Gestión de Citas\n\n🚧 Módulo en desarrollo.\n\nPróximamente podrás:\n• Ver tus citas programadas\n• Solicitar nuevas citas\n• Gestionar tu calendario');
    });
  }

  navigateToDashboard(): void {
    console.log('🏢 Navegando a dashboard...');
    this.showUserDropdown = false;
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    console.log('🚪 Iniciando cierre de sesión...');
    this.showUserDropdown = false;

    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Sesión cerrada exitosamente');
        this.router.navigate(['/propiedades']);
      },
      error: (error) => {
        console.error('❌ Error al cerrar sesión:', error);
        this.router.navigate(['/propiedades']);
      }
    });
  }

  // ===============================
  // 🎨 MÉTODOS DE UTILIDAD
  // ===============================

  getUserInitials(): string {
    if (!this.currentUser?.nombre) return 'U';

    const nombres = this.currentUser.nombre.trim().split(' ');
    if (nombres.length === 1) {
      return nombres[0].charAt(0).toUpperCase();
    }

    return nombres
      .slice(0, 2)
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  }

  getRoleLabel(): string {
    if (!this.currentUser?.rol) return 'Usuario';

    const roleLabels: { [key: string]: string } = {
      'admin': 'Administrador',
      'agente': 'Agente Inmobiliario',
      'cliente': 'Cliente'
    };

    return roleLabels[this.currentUser.rol.toLowerCase()] || this.currentUser.rol;
  }

  getRoleClass(): string {
    if (!this.currentUser?.rol) return 'secondary';

    const roleClasses: { [key: string]: string } = {
      'admin': 'danger',
      'agente': 'success',
      'cliente': 'primary'
    };

    return roleClasses[this.currentUser.rol.toLowerCase()] || 'secondary';
  }

  isAdmin(): boolean {
    return this.currentUser?.rol?.toLowerCase() === 'admin';
  }

  isAgent(): boolean {
    return this.currentUser?.rol?.toLowerCase() === 'agente';
  }

  isClient(): boolean {
    return this.currentUser?.rol?.toLowerCase() === 'cliente';
  }

  getDisplayName(): string {
    if (!this.currentUser?.nombre) return 'Usuario';

    const nombres = this.currentUser.nombre.trim().split(' ');
    return nombres[0];
  }
}
