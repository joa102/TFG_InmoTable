import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, timeout, catchError } from 'rxjs/operators';

// 🔥 IMPORTAR SERVICIOS EXISTENTES
import { EmpresaService } from '../../../services/empresa.service';
import { ImageService } from '../../../services/image.service';
import { CacheService } from '../../../services/cache.service';
import { ConfigService } from '../../../services/config.service'; // 🔥 IMPORTAR CONFIG SERVICE
import { ThemeService } from '../../../services/theme.service'; // 🔥 IMPORTAR THEME SERVICE
import { Empresa } from '../../../interfaces/api.interfaces';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {

  /**
   * ✅ Año actual para el copyright
   */
  currentYear = new Date().getFullYear();

  // 🏢 DATOS DE LA EMPRESA DESDE AIRTABLE
  empresaData: Empresa | null = null;
  empresaNombre: string = '';
  empresaLogo: string = '';
  empresaTelefono: string = '+34 612 345 789';
  empresaEmail: string = 'info@inmoapp.com';
  empresaDireccion: string = 'Almería, España';
  empresaHorario: string = 'Lunes a Viernes: 10:00 a 14:00 h - 17:00 a 20:00 h';

  // Redes sociales
  facebookUrl: string = '#';
  instagramUrl: string = '#';
  twitterUrl: string = '#';
  linkedinUrl: string = '#';

  // Control de imagen - IGUAL QUE NAVBAR
  logoImageError = false;
  imageLoadedFromCache = false;
  fallbackUsed = false;

  private destroy$ = new Subject<void>();

  constructor(
    private empresaService: EmpresaService,
    private imageService: ImageService,
    private cacheService: CacheService,
    private configService: ConfigService, // 🔥 INYECTAR CONFIG SERVICE
    private themeService: ThemeService // 🔥 INYECTAR THEME SERVICE
  ) {
    // 🔥 INICIALIZAR CON VALORES DE CONFIGURACIÓN
    this.empresaNombre = this.configService.getEmpresaNombreFallback();
    this.empresaLogo = this.configService.getEmpresaIconoFallback();

    // 🔥 VERIFICAR SI EL CACHÉ TIENE DATOS INCORRECTOS
    const empresaNombreConfig = this.configService.getEmpresaNombre();
    const cachedEmpresa = this.cacheService.getEmpresaByName(empresaNombreConfig);
    if (cachedEmpresa &&
        (cachedEmpresa.telefono === undefined || cachedEmpresa.direccion === undefined)) {
      console.log('⚠️ Footer: Caché con datos incorrectos detectado, limpiando...');
      this.cacheService.clearEmpresaCache();
      console.log('🧹 Footer: Caché limpiado automáticamente');
    }
  }

  ngOnInit(): void {
    // 🔥 USAR EXACTAMENTE LA MISMA LÓGICA QUE NAVBAR
    console.log('🚀 Footer: Iniciando carga de datos de empresa...');
    this.loadEmpresaFromCacheFirst(); // 🔥 USAR CONFIGURACIÓN
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 🔥 CARGAR EMPRESA DESDE CACHÉ PERSISTENTE PRIMERO (USANDO CONFIGURACIÓN)
   */
  private loadEmpresaFromCacheFirst(): void {
    // 🔥 OBTENER NOMBRE DE EMPRESA DESDE CONFIGURACIÓN
    const empresaNombreConfig = this.configService.getEmpresaNombre();
    console.log('🔍 Footer: Buscando empresa en caché persistente (desde config):', empresaNombreConfig);

    const cachedEmpresa = this.cacheService.getEmpresaByName(empresaNombreConfig);

    if (cachedEmpresa) {
      console.log('✅ Footer: Empresa encontrada en caché persistente:', cachedEmpresa);

      // 🔥 APLICAR COLORES INMEDIATAMENTE DESDE CACHÉ (SOLO SI NAVBAR NO LOS APLICÓ)
      this.applyColorsFromCacheIfNeeded(cachedEmpresa);

      // 🔥 VERIFICAR ESPECÍFICAMENTE LOS CAMPOS QUE FALTAN
      console.log('🔍 Footer: Verificando campos específicos:', {
        'telefono en caché': cachedEmpresa.telefono,
        'direccion en caché': cachedEmpresa.direccion,
        'email en caché': cachedEmpresa.email,
        'web en caché': cachedEmpresa.web,
        'horario en caché': cachedEmpresa.horario // 🔥 AÑADIR HORARIO
      });

      this.empresaNombre = cachedEmpresa.nombre;

      // 🔥 MAPEAR CAMPOS CON LOGS DETALLADOS USANDO FALLBACKS DE CONFIG
      this.empresaTelefono = cachedEmpresa.telefono || '+34 612 345 789';
      console.log('📞 Footer: Teléfono final asignado:', this.empresaTelefono);

      this.empresaEmail = cachedEmpresa.email || cachedEmpresa.web || 'info@inmotable.com';
      console.log('📧 Footer: Email/Web final asignado:', this.empresaEmail);

      this.empresaDireccion = cachedEmpresa.direccion || 'Almería, España';
      console.log('📍 Footer: Dirección final asignada:', this.empresaDireccion);

      // 🔥 MAPEAR HORARIO DESDE CACHÉ
      this.empresaHorario = cachedEmpresa.horario || 'Lunes a Viernes: 10:00 a 14:00 h - 17:00 a 20:00 h';
      console.log('🕐 Footer: Horario final asignado:', this.empresaHorario);

      // Redes sociales
      this.facebookUrl = cachedEmpresa.facebook || '#';
      this.instagramUrl = cachedEmpresa.instagram || '#';
      this.twitterUrl = cachedEmpresa.twitter || '#';
      this.linkedinUrl = cachedEmpresa.linkedin || '#';

      console.log('✅ Footer: RESUMEN FINAL - Variables del componente:', {
        nombre: this.empresaNombre,
        telefono: this.empresaTelefono,
        email: this.empresaEmail,
        direccion: this.empresaDireccion,
        horario: this.empresaHorario, // 🔥 INCLUIR EN RESUMEN
        redes: {
          facebook: this.facebookUrl,
          instagram: this.instagramUrl,
          twitter: this.twitterUrl,
          linkedin: this.linkedinUrl
        }
      });

      // 🔥 PROCESAR LOGO
      if (cachedEmpresa.logoDataUrl) {
        this.empresaLogo = cachedEmpresa.logoDataUrl;
        this.imageLoadedFromCache = true;
        this.fallbackUsed = false;
        console.log('🖼️ Footer: Logo cargado INMEDIATAMENTE desde caché persistente');
        return; // 🔥 SALIR AQUÍ - YA TENEMOS TODO
      } else if (cachedEmpresa.logo) {
        // Si es URL de imagen, verificar si está cacheada
        if (this.isImageUrl(cachedEmpresa.logo)) {
          const cachedImage = this.cacheService.getCachedImage(cachedEmpresa.logo);
          if (cachedImage) {
            this.empresaLogo = cachedImage;
            this.imageLoadedFromCache = true;
            console.log('🖼️ Footer: Imagen del logo cargada desde caché persistente');
            return; // 🔥 SALIR AQUÍ - YA TENEMOS TODO
          } else {
            this.empresaLogo = cachedEmpresa.logo;
          }
        } else {
          // Es icono
          this.empresaLogo = cachedEmpresa.logo;
          return; // 🔥 SALIR AQUÍ - YA TENEMOS TODO
        }
      }
    }

    // Si no hay caché, cargar desde API
    console.log('🔄 Footer: No hay caché persistente, cargando desde API...');
    this.loadEmpresaFromAPI();
}
  /**
   * 🔄 CARGAR EMPRESA DESDE API (USANDO CONFIGURACIÓN)
   */
  private async loadEmpresaFromAPI(): Promise<void> {
    try {
      console.log('🌐 Footer: Cargando datos de empresa desde API...');

      // 🔥 USAR MÉTODO SIMPLIFICADO QUE USA CONFIGURACIÓN INTERNA
      const empresa = await this.empresaService.getEmpresaPrincipal()
        .pipe(
          timeout(3000),
          catchError(() => this.empresaService.getFirstActive()),
          takeUntil(this.destroy$)
        )
        .toPromise();

      if (empresa) {
        console.log('📊 Footer: Empresa encontrada en API:', empresa);

        // Actualizar datos básicos (IGUAL QUE NAVBAR)
        this.empresaNombre = empresa.nombre || this.configService.getEmpresaNombreFallback();
        this.fallbackUsed = false;

        // 🔥 MAPEAR CAMPOS ADICIONALES PARA FOOTER
        this.mapearCamposAdicionales(empresa);

        // 🔥 PROCESAR LOGO (IGUAL QUE NAVBAR)
        if (this.isImageUrl(empresa.logo)) {
          console.log('🖼️ Footer: Procesando logo de imagen:', empresa.logo);

          // Verificar si ya está cacheada
          const cachedImage = this.cacheService.getCachedImage(empresa.logo);
          if (cachedImage) {
            console.log('✅ Footer: Imagen ya estaba cacheada');
            this.empresaLogo = cachedImage;
            this.imageLoadedFromCache = true;

            // Actualizar caché de empresa con imagen
            this.updateEmpresaCache(empresa, cachedImage);
          } else {
            console.log('🔄 Footer: Descargando y cacheando imagen...');
            // Mostrar icono mientras descarga
            this.empresaLogo = 'fas fa-building';

            // Descargar y cachear
            this.cacheService.cacheImage(empresa.logo)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (cachedImageUrl) => {
                  console.log('✅ Footer: Imagen descargada y cacheada');
                  this.empresaLogo = cachedImageUrl;
                  this.imageLoadedFromCache = true;

                  // Actualizar caché de empresa con imagen
                  this.updateEmpresaCache(empresa, cachedImageUrl);
                },
                error: (error) => {
                  console.warn('⚠️ Footer: Error al cachear imagen:', error);
                  this.empresaLogo = 'fas fa-building';
                  this.fallbackUsed = true;
                }
              });
          }
        } else {
          // Es icono, usar directamente
          this.empresaLogo = empresa.logo || 'fas fa-building';
          this.updateEmpresaCache(empresa, null);
        }
      } else {
        console.log('⚠️ Footer: No se encontró empresa, manteniendo valores por defecto');
        this.fallbackUsed = true;
        this.empresaNombre = this.configService.getEmpresaNombreFallback();
        this.empresaLogo = this.configService.getEmpresaIconoFallback();
      }
    } catch (error) {
      console.warn('⚠️ Footer: Error al cargar empresa desde API:', error);
      this.fallbackUsed = true;
      this.empresaNombre = this.configService.getEmpresaNombreFallback();
      this.empresaLogo = this.configService.getEmpresaIconoFallback();
    }
  }

  /**
   * 🔥 APLICAR COLORES DESDE CACHÉ SOLO SI ES NECESARIO
   */
  private applyColorsFromCacheIfNeeded(cachedEmpresa: any): void {
    // Solo aplicar si hay colores definidos en caché y no se han aplicado aún
    if (cachedEmpresa.colorPrimary) {
      console.log('🎨 Footer: Aplicando colores desde caché');

      const colorsFromCache = {
        'color-primary': cachedEmpresa.colorPrimary,
        'color-primary-dark': cachedEmpresa.colorPrimaryDark,
        'color-primary-light': cachedEmpresa.colorPrimaryLight,
        'color-primary-rgb': cachedEmpresa.colorPrimaryRgb
      };

      // Verificar si los colores actuales son diferentes
      const currentColors = this.themeService.getCurrentColors();
      if (currentColors.primary !== cachedEmpresa.colorPrimary) {
        this.themeService.applyColorsFromEmpresa(colorsFromCache);
      }
    }
  }

  /**
   * 🔥 MAPEAR CAMPOS ADICIONALES PARA FOOTER (AÑADIR HORARIO)
   */
  private mapearCamposAdicionales(empresa: any): void {
    console.log('📊 Footer: Mapeando campos adicionales desde API:', empresa);

    // 🔥 USAR NOMBRES EXACTOS QUE APARECEN EN EL LOG (MINÚSCULAS CON ACENTOS)
    this.empresaTelefono = empresa['teléfono'] ||        // 🔥 MINÚSCULA CON ACENTO (REAL)
                          empresa['Teléfono'] ||         // Mayúscula con acento
                          empresa.Telefono ||            // Mayúscula sin acento
                          empresa.telefono ||            // Minúscula sin acento
                          '+34 612 345 789';

    console.log('📞 Footer: Teléfono mapeado desde API:', this.empresaTelefono);

    this.empresaEmail = empresa.email ||                 // email directo
                       empresa.web ||                    // web como email
                       empresa.Web ||                    // Web con mayúscula
                       empresa.Email ||                  // Email con mayúscula
                       'www.inmotable.com';

    console.log('📧 Footer: Email/Web mapeado desde API:', this.empresaEmail);

    this.empresaDireccion = empresa['dirección'] ||      // 🔥 MINÚSCULA CON ACENTO (REAL)
                           empresa['Dirección'] ||       // Mayúscula con acento
                           empresa.Direccion ||          // Mayúscula sin acento
                           empresa.direccion ||          // Minúscula sin acento
                           'Madrid, España';

    console.log('📍 Footer: Dirección mapeada desde API:', this.empresaDireccion);

    // 🔥 MAPEAR HORARIO DESDE API
    this.empresaHorario = empresa['Horario'] ||          // Mayúscula (nombre de campo en Airtable)
                         empresa.horario ||              // Minúscula
                         empresa['horario'] ||           // Minúscula con corchetes
                         'Lunes a Viernes: 10:00 a 14:00 h - 17:00 a 20:00 h';

    console.log('🕐 Footer: Horario mapeado desde API:', this.empresaHorario);

    // Redes sociales (estos ya funcionan)
    this.facebookUrl = empresa.Facebook || empresa.facebook || '#';
    this.instagramUrl = empresa.Instagram || empresa.instagram || '#';
    this.twitterUrl = empresa.Twitter || empresa.twitter || '#';
    this.linkedinUrl = empresa.LinkedIn || empresa.linkedin || '#';

    console.log('✅ Footer: TODOS los campos mapeados desde API:', {
      telefono: this.empresaTelefono,
      email: this.empresaEmail,
      direccion: this.empresaDireccion,
      horario: this.empresaHorario, // 🔥 INCLUIR HORARIO EN LOGS
      redes: {
        facebook: this.facebookUrl,
        instagram: this.instagramUrl,
        twitter: this.twitterUrl,
        linkedin: this.linkedinUrl
      }
    });
  }

  /**
   * 🔄 ACTUALIZAR CACHÉ DE EMPRESA (INCLUIR HORARIO)
   */
  private updateEmpresaCache(empresa: Empresa, logoDataUrl: string | null): void {
    const cacheData: any = {
      id: empresa.id,
      nombre: empresa.nombre,
      logo: empresa.logo,
      estado: empresa.estado,
      logoDataUrl: logoDataUrl || undefined,

      // 🔥 USAR NOMBRES EXACTOS QUE APARECEN EN LOS LOGS
      telefono: (empresa as any)['teléfono'] ||          // MINÚSCULA CON ACENTO
               (empresa as any)['Teléfono'] ||           // MAYÚSCULA CON ACENTO
               (empresa as any).telefono,                // MINÚSCULA SIN ACENTO

      email: (empresa as any).email || (empresa as any).Email,

      direccion: (empresa as any)['dirección'] ||        // MINÚSCULA CON ACENTO
                (empresa as any)['Dirección'] ||         // MAYÚSCULA CON ACENTO
                (empresa as any).direccion,              // MINÚSCULA SIN ACENTO

      web: (empresa as any).Web || (empresa as any).web,

      // 🔥 INCLUIR HORARIO EN CACHÉ
      horario: (empresa as any)['Horario'] ||            // MAYÚSCULA (AIRTABLE)
              (empresa as any).horario ||                // MINÚSCULA
              (empresa as any)['horario'],               // MINÚSCULA CON CORCHETES

      // Redes sociales
      facebook: (empresa as any).Facebook || (empresa as any).facebook,
      instagram: (empresa as any).Instagram || (empresa as any).instagram,
      twitter: (empresa as any).Twitter || (empresa as any).twitter,
      linkedin: (empresa as any).LinkedIn || (empresa as any).linkedin,

      // Otros campos
      idEmpresa: (empresa as any)['ID Empresa'] || (empresa as any).idEmpresa
    };

    console.log('💾 Footer: Caché de empresa actualizado con campos corregidos (incluye horario):', cacheData);
    this.cacheService.setEmpresa(cacheData);
  }

  /**
   * 🖼️ CARGAR IMAGEN DEL LOGO
   */
  private loadLogoImage(logoUrl: string): void {
    console.log('🖼️ Footer: Cargando imagen del logo:', logoUrl);

    // Verificar caché primero
    const cachedImage = this.cacheService.getCachedImage(logoUrl);
    if (cachedImage) {
      console.log('✅ Footer: Logo encontrado en caché');
      this.empresaLogo = cachedImage;
      this.imageLoadedFromCache = true;
      return;
    }

    // Si no está en caché, cachear
    this.cacheService.cacheImage(logoUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cachedImageUrl: any) => {
          console.log('✅ Footer: Logo cacheado exitosamente');
          this.empresaLogo = cachedImageUrl;
          this.imageLoadedFromCache = true;
        },
        error: (error: any) => {
          console.warn('⚠️ Footer: Error al cachear logo:', error);
          this.empresaLogo = 'fas fa-building';
          this.logoImageError = true;
        }
      });
  }

  /**
   * 🔄 VERIFICAR SI ES URL DE IMAGEN
   */
  private isImageUrl(url: string): boolean {
    if (!url) return false;
    return url.startsWith('http') || url.startsWith('data:image') || url.startsWith('blob:');
  }

  /**
   * 🏠 OBTENER LOGO DE LA EMPRESA
   */
  getEmpresaLogo(): string {
    if (this.logoImageError) {
      return 'fas fa-building';
    }

    if (this.empresaLogo && (this.empresaLogo.startsWith('http') || this.empresaLogo.startsWith('data:image'))) {
      return this.empresaLogo;
    }

    return this.empresaLogo || 'fas fa-building';
  }

  /**
   * 🏢 VERIFICAR SI EL LOGO ES UNA IMAGEN
   */
  isLogoImage(): boolean {
    if (this.logoImageError) return false;
    return !!(this.empresaLogo && typeof this.empresaLogo === 'string' &&
      (this.empresaLogo.startsWith('http') || this.empresaLogo.startsWith('data:image')));
  }

  /**
   * 🏢 VERIFICAR SI EL LOGO ES UN ICONO
   */
  isLogoIcon(): boolean {
    return !this.isLogoImage();
  }

  /**
   * 🖼️ MANEJAR ERROR DE CARGA DE IMAGEN
   */
  onLogoImageError(event: any): void {
    console.warn('❌ Footer: Error al cargar imagen del logo:', this.empresaLogo);
    this.logoImageError = true;

    if (event && event.target) {
      event.target.style.display = 'none';
    }
  }

  /**
   * 🔥 MANEJAR CARGA EXITOSA DE IMAGEN
   */
  onLogoImageLoad(): void {
    console.log('✅ Footer: Imagen del logo cargada exitosamente');
    this.logoImageError = false;
  }

  /**
   * 🔗 NAVEGAR A REDES SOCIALES CON URLs REALES
   */
  navigateToSocial(platform: string, url: string): void {
    console.log(`🔗 Footer: Navegando a ${platform}:`, url);

    if (url && url !== '#') {
      let finalUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        finalUrl = 'https://' + url;
      }

      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.log(`⚠️ Footer: No hay URL configurada para ${platform}`);
    }
  }

  /**
   * 📧 SUSCRIBIRSE AL NEWSLETTER
   */
  subscribeNewsletter(email: string): void {
    console.log('📧 Footer: Suscripción al newsletter:', email);
    // TODO: Implementar lógica de suscripción
  }

  /**
   * 🔥 AÑADIR MÉTODO DE DEBUG ESPECÍFICO
   */
  private debugCacheFields(cachedEmpresa: any): void {
    console.log('🔍 Footer: DEBUG - Analizando campos del caché:');
    console.log('  📞 Teléfono disponible en:', {
      'telefono': cachedEmpresa.telefono
    });

    console.log('  📧 Email/Web disponible en:', {
      'email': cachedEmpresa.email,
      'web': cachedEmpresa.web
    });

    console.log('  📍 Dirección disponible en:', {
      'direccion': cachedEmpresa.direccion
    });

    console.log('  🌐 Redes sociales disponibles en:', {
      'facebook': cachedEmpresa.facebook,
      'instagram': cachedEmpresa.instagram,
      'twitter': cachedEmpresa.twitter,
      'linkedin': cachedEmpresa.linkedin
    });
  }
}
