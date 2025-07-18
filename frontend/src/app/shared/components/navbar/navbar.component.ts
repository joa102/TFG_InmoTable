import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, timer } from 'rxjs';
import { takeUntil, timeout, catchError } from 'rxjs/operators';
import { AuthService, User } from '../../../services/auth.service';
import { EmpresaService } from '../../../services/empresa.service';
import { ImageService } from '../../../services/image.service';
import { CacheService } from '../../../services/cache.service';
import { ConfigService } from '../../../services/config.service'; // 🔥 IMPORTAR CONFIG SERVICE
import { ThemeService } from '../../../services/theme.service'; // 🔥 IMPORTAR THEME SERVICE
import { Empresa } from '../../../interfaces/api.interfaces';

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

  // 🏢 DATOS DE LA EMPRESA
  empresaData: Empresa | null = null;
  empresaNombre: string = '';
  empresaLogo: string = '';
  logoImageError = false;

  // 🔥 VARIABLES PARA CACHÉ PERSISTENTE
  logoReady = true;
  fallbackUsed = false;
  imageLoadedFromCache = false;

  private destroy$ = new Subject<void>();
  private documentClickListener?: (event: Event) => void;

  constructor(
    private authService: AuthService,
    private empresaService: EmpresaService,
    private imageService: ImageService,
    private cacheService: CacheService,
    private configService: ConfigService, // 🔥 INYECTAR CONFIG SERVICE
    private themeService: ThemeService, // 🔥 INYECTAR THEME SERVICE
    private router: Router
  ) {
    // 🔥 INICIALIZAR CON VALORES DE CONFIGURACIÓN
    this.empresaNombre = this.configService.getEmpresaNombreFallback();
    this.empresaLogo = this.configService.getEmpresaIconoFallback();
  }

  ngOnInit(): void {
    // 🔥 CARGAR DATOS INMEDIATAMENTE DESDE CACHÉ PERSISTENTE
    this.loadEmpresaFromCacheFirst();

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

    if (this.documentClickListener) {
      document.removeEventListener('click', this.documentClickListener);
    }
  }

  /**
   * 🔥 CARGAR EMPRESA DESDE CACHÉ PERSISTENTE PRIMERO (USANDO CONFIGURACIÓN)
   */
  private loadEmpresaFromCacheFirst(): void {
    // 🔥 OBTENER NOMBRE DE EMPRESA DESDE CONFIGURACIÓN
    const empresaNombreConfig = this.configService.getEmpresaNombre();
    console.log('🔍 Buscando empresa en caché persistente (desde config):', empresaNombreConfig);

    // 🔥 VERIFICAR CACHÉ PERSISTENTE PRIMERO
    const cachedEmpresa = this.cacheService.getEmpresaByName(empresaNombreConfig);

    if (cachedEmpresa) {
      console.log('✅ Empresa encontrada en caché persistente:', cachedEmpresa);

      // 🔥 APLICAR COLORES INMEDIATAMENTE DESDE CACHÉ
      this.applyColorsFromCache(cachedEmpresa);

      // 🔥 SI TIENE IMAGEN CACHEADA, USARLA INMEDIATAMENTE
      if (cachedEmpresa.logoDataUrl) {
        this.empresaNombre = cachedEmpresa.nombre;
        this.empresaLogo = cachedEmpresa.logoDataUrl;
        this.imageLoadedFromCache = true;
        this.fallbackUsed = false;
        console.log('🖼️ Logo cargado INMEDIATAMENTE desde caché persistente');
        return; // 🔥 SALIR AQUÍ - NO NECESITAMOS CARGAR NADA MÁS
      }

      // Si tiene datos pero no imagen cacheada, cargar datos y buscar imagen
      this.empresaNombre = cachedEmpresa.nombre;
      this.empresaLogo = cachedEmpresa.logo;

      // Si es URL de imagen, verificar si está cacheada
      if (this.isImageUrl(cachedEmpresa.logo)) {
        const cachedImage = this.cacheService.getCachedImage(cachedEmpresa.logo);
        if (cachedImage) {
          this.empresaLogo = cachedImage;
          this.imageLoadedFromCache = true;
          console.log('🖼️ Imagen del logo cargada desde caché persistente');
          return; // 🔥 SALIR AQUÍ
        }
      }
    }

    // 🔥 SI NO HAY CACHÉ O NO TIENE IMAGEN, CARGAR DESDE API
    console.log('🔄 No hay caché persistente, cargando desde API...');
    this.loadEmpresaFromAPI();
  }

  /**
   * 🔄 CARGAR EMPRESA DESDE API (USANDO CONFIGURACIÓN)
   */
  private async loadEmpresaFromAPI(): Promise<void> {
    try {
      console.log('🌐 Cargando datos de empresa desde API...');

      // 🔥 USAR MÉTODO SIMPLIFICADO QUE USA CONFIGURACIÓN INTERNA
      const empresa = await this.empresaService.getEmpresaPrincipal()
        .pipe(
          timeout(3000),
          catchError(() => this.empresaService.getFirstActive()),
          takeUntil(this.destroy$)
        )
        .toPromise();

      if (empresa) {
        console.log('📊 Empresa encontrada en API:', empresa);

        // Actualizar datos básicos
        this.empresaNombre = empresa.nombre || this.configService.getEmpresaNombreFallback();
        this.fallbackUsed = false;

        // 🔥 SI ES IMAGEN, VERIFICAR CACHÉ O DESCARGAR
        if (this.isImageUrl(empresa.logo)) {
          console.log('🖼️ Procesando logo de imagen:', empresa.logo);

          // Verificar si ya está cacheada
          const cachedImage = this.cacheService.getCachedImage(empresa.logo);
          if (cachedImage) {
            console.log('✅ Imagen ya estaba cacheada');
            this.empresaLogo = cachedImage;
            this.imageLoadedFromCache = true;

            // Actualizar caché de empresa con imagen
            this.updateEmpresaCache(empresa, cachedImage);
          } else {
            console.log('🔄 Descargando y cacheando imagen...');
            // Mostrar icono mientras descarga
            this.empresaLogo = this.configService.getEmpresaIconoFallback();

            // Descargar y cachear
            this.cacheService.cacheImage(empresa.logo)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (cachedImageUrl) => {
                  console.log('✅ Imagen descargada y cacheada');
                  this.empresaLogo = cachedImageUrl;
                  this.imageLoadedFromCache = true;

                  // Actualizar caché de empresa con imagen
                  this.updateEmpresaCache(empresa, cachedImageUrl);
                },
                error: (error) => {
                  console.warn('⚠️ Error al cachear imagen:', error);
                  this.empresaLogo = this.configService.getEmpresaIconoFallback();
                  this.fallbackUsed = true;
                }
              });
          }
        } else {
          // Es icono, usar directamente
          this.empresaLogo = empresa.logo || this.configService.getEmpresaIconoFallback();
          this.updateEmpresaCache(empresa, null);
        }
      } else {
        console.log('⚠️ No se encontró empresa, manteniendo valores por defecto');
        this.fallbackUsed = true;
        this.empresaNombre = this.configService.getEmpresaNombreFallback();
        this.empresaLogo = this.configService.getEmpresaIconoFallback();
      }
    } catch (error) {
      console.warn('⚠️ Error al cargar empresa desde API:', error);
      this.fallbackUsed = true;
      this.empresaNombre = this.configService.getEmpresaNombreFallback();
      this.empresaLogo = this.configService.getEmpresaIconoFallback();
    }
  }

  /**
   * 🔥 APLICAR COLORES DESDE CACHÉ
   */
  private applyColorsFromCache(cachedEmpresa: any): void {
    console.log('🎨 Aplicando colores desde caché:', cachedEmpresa);

    const colorsFromCache = {
      'color-primary': cachedEmpresa.colorPrimary,
      'color-primary-dark': cachedEmpresa.colorPrimaryDark,
      'color-primary-light': cachedEmpresa.colorPrimaryLight,
      'color-primary-rgb': cachedEmpresa.colorPrimaryRgb
    };

    this.themeService.applyColorsFromEmpresa(colorsFromCache);
  }

  /**
   * 🔄 ACTUALIZAR CACHÉ DE EMPRESA
   */
  private updateEmpresaCache(empresa: Empresa, logoDataUrl: string | null): void {
    const cacheData = {
      id: empresa.id,
      nombre: empresa.nombre,
      logo: empresa.logo,
      estado: empresa.estado,
      logoDataUrl: logoDataUrl || undefined
    };

    this.cacheService.setEmpresa(cacheData);
    console.log('💾 Caché de empresa actualizado');
  }

  /**
   * 🔄 VERIFICAR SI ES URL DE IMAGEN
   */
  private isImageUrl(url: string): boolean {
    if (!url) return false;
    return url.startsWith('http') || url.startsWith('data:image') || url.startsWith('blob:');
  }

  /**
   * 🏠 Obtener logo de la empresa
   */
  getEmpresaLogo(): string {
    // Si hubo error de imagen, usar icono por defecto
    if (this.logoImageError) {
      return 'fas fa-home';
    }

    // Si es una URL o Data URL, retornar para usar como src de imagen
    if (this.empresaLogo && (this.empresaLogo.startsWith('http') || this.empresaLogo.startsWith('data:image'))) {
      return this.empresaLogo;
    }

    // Si es una clase de icono, retornar como tal
    return this.empresaLogo || 'fas fa-home';
  }

  /**
   * 🏢 Verificar si el logo es una imagen
   */
  isLogoImage(): boolean {
    if (this.logoImageError) return false;
    return !!(this.empresaLogo && typeof this.empresaLogo === 'string' &&
      (this.empresaLogo.startsWith('http') || this.empresaLogo.startsWith('data:image')));
  }

  /**
   * 🏢 Verificar si el logo es un icono
   */
  isLogoIcon(): boolean {
    return !this.isLogoImage();
  }

  /**
   * 🔥 NUNCA MOSTRAR LOADING
   */
  isLoading(): boolean {
    return false;
  }

  /**
   * 🖼️ Manejar error de carga de imagen
   */
  onLogoImageError(event: any): void {
    console.warn('❌ Error al cargar imagen del logo:', this.empresaLogo);
    this.logoImageError = true;

    if (event && event.target) {
      event.target.style.display = 'none';
    }

    console.log('🔄 Usando icono de fallback por error de imagen');
  }

  /**
   * 🔥 MANEJAR CARGA EXITOSA DE IMAGEN
   */
  onLogoImageLoad(): void {
    console.log('✅ Imagen del logo cargada exitosamente');
    this.logoImageError = false;
  }

  /**
   * 🧹 LIMPIAR CACHÉ COMPLETAMENTE (AÑADIR RESET DE COLORES)
   */
  clearCache(): void {
    this.cacheService.clear();
    console.log('🧹 Caché completamente limpiado');

    // 🔥 RESETEAR COLORES A DEFAULT (RESETEA EL FLAG TAMBIÉN)
    this.themeService.resetToDefault();

    // Resetear estado usando configuración
    this.empresaNombre = this.configService.getEmpresaNombreFallback();
    this.empresaLogo = this.configService.getEmpresaIconoFallback();
    this.logoImageError = false;
    this.fallbackUsed = false;
    this.imageLoadedFromCache = false;

    // 🔥 PEQUEÑO DELAY PARA ASEGURAR LIMPIEZA ANTES DE RECARGAR
    setTimeout(() => {
      this.loadEmpresaFromCacheFirst();
    }, 100);
  }

  /**
   * 📊 MOSTRAR ESTADÍSTICAS DEL CACHÉ (INCLUIR COLORES)
   */
  showCacheStats(): void {
    const stats = this.cacheService.getCacheStats();
    const storageSize = this.cacheService.getLocalStorageSize();
    const currentColors = this.themeService.getCurrentColors(); // 🔥 OBTENER COLORES ACTUALES
    const empresaConfig = this.configService.getEmpresaConfig(); // 🔥 OBTENER CONFIG

    console.log('📊 Estadísticas del caché:', stats);
    console.log('💾 Tamaño localStorage:', storageSize);
    console.log('🎨 Colores actuales:', currentColors);
    console.log('⚙️ Configuración empresa:', empresaConfig);

    alert(`📊 Caché Stats:

🗂️ Elementos en memoria: ${stats.size}
💾 Elementos en localStorage: ${stats.localStorage}
📏 Tamaño usado: ${storageSize.used}
🖼️ Logo desde caché: ${this.imageLoadedFromCache ? 'SÍ' : 'NO'}
⚠️ Usando fallback: ${this.fallbackUsed ? 'SÍ' : 'NO'}

🏢 Configuración de Empresa:
Nombre: ${empresaConfig.nombre}
Fallback: ${empresaConfig.nombreFallback}
Icono: ${empresaConfig.idFallback}

🎨 Colores actuales:
Primary: ${currentColors.primary}
Primary Dark: ${currentColors.primaryDark}
Primary Light: ${currentColors.primaryLight}
Primary RGB: ${currentColors.primaryRgb}

🔑 Claves: ${stats.keys.join(', ')}`);
  }

  // ===============================
  // 🔄 TOGGLE DROPDOWN
  // ===============================

  toggleUserDropdown(): void {
    this.showUserDropdown = !this.showUserDropdown;
    console.log('🔄 Toggle dropdown:', this.showUserDropdown);
  }

  // ===============================
  // 🔗 MÉTODOS DE NAVEGACIÓN (SIN CAMBIOS)
  // ===============================

  navigateToHome(): void {
    console.log('🏠 Navegando a inicio...');
    this.showUserDropdown = false;
    this.router.navigate(['/']);
  }

  navigateToProperties(): void {
    console.log('🏢 Navegando a propiedades...');
    this.showUserDropdown = false;
    this.router.navigate(['/propiedades']);
  }

  navigateToContact(): void {
    console.log('📧 Navegando a contacto...');
    this.showUserDropdown = false;
    //alert('🚧 Página de contacto en desarrollo.\n\nPróximamente podrás:\n• Enviar consultas\n• Ver información de contacto\n• Solicitar información');
    this.router.navigate(['/contacto']);
  }

  navigateToLogin(): void {
    console.log('🔐 Navegando a login...');
    this.showUserDropdown = false;
    this.router.navigate(['/auth/login']);
  }

  /**
   * 👤 Navegar al perfil del usuario
   */
  navigateToUserProfile(): void {
    console.log('👤 Navegando al perfil del usuario');
    this.router.navigate(['/perfil']);
    // this.hideDropdowns(); // 🔥 COMENTAR O QUITAR ESTA LÍNEA
  }

  navigateToInterestedProperties(): void {
    console.log('❤️ Navegando a propiedades de interés...');
    this.showUserDropdown = false;

    if (!this.currentUser) {
      console.warn('⚠️ No hay usuario logueado');
      this.router.navigate(['/auth/login']);
      return;
    }

    //alert('❤️ Propiedades de Interés\n\n🚧 Funcionalidad en desarrollo.\n\nPróximamente podrás:\n• Ver tus propiedades favoritas\n• Gestionar tu lista de interés\n• Recibir notificaciones de cambios');
    this.router.navigate(['/mis-propiedades-interes']).catch(error => {
      console.error('❌ Error al navegar a mis propiedades de interes:', error);
      //alert('📅 Gestión de Citas\n\n🚧 Módulo en desarrollo.\n\nPróximamente podrás:\n• Ver tus citas programadas\n• Solicitar nuevas citas\n• Gestionar tu calendario');
    });
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
      //alert('📅 Gestión de Citas\n\n🚧 Módulo en desarrollo.\n\nPróximamente podrás:\n• Ver tus citas programadas\n• Solicitar nuevas citas\n• Gestionar tu calendario');
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
  // 🎨 MÉTODOS DE UTILIDAD (SIN CAMBIOS)
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
