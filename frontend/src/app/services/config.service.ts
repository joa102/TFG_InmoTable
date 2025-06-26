import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  // 🔥 CONFIGURACIÓN CENTRALIZADA DE EMPRESA
  private readonly empresaConfig = environment.empresa;

  constructor() {
    console.log('⚙️ ConfigService inicializado con configuración:', this.empresaConfig);
  }

  /**
   * 🏢 OBTENER NOMBRE DE EMPRESA DESDE CONFIGURACIÓN
   */
  getEmpresaNombre(): string {
    return this.empresaConfig.nombre;
  }

  /**
   * 🏢 OBTENER NOMBRE DE FALLBACK
   */
  getEmpresaNombreFallback(): string {
    return this.empresaConfig.nombreFallback;
  }

  /**
   * 🎨 OBTENER ICONO DE FALLBACK
   */
  getEmpresaIconoFallback(): string {
    return this.empresaConfig.idFallback;
  }

  /**
   * 📋 OBTENER CONFIGURACIÓN COMPLETA DE EMPRESA
   */
  getEmpresaConfig() {
    return { ...this.empresaConfig };
  }

  /**
   * 🗂️ OBTENER NOMBRE DE TABLA DE AIRTABLE
   */
  getAirtableTableName(tabla: keyof typeof environment.airtable.tables): string {
    return environment.airtable.tables[tabla];
  }

  /**
   * 🔍 VERIFICAR SI ES ENTORNO DE PRODUCCIÓN
   */
  isProduction(): boolean {
    return environment.production;
  }

  /**
   * 📱 OBTENER NOMBRE DE LA APP
   */
  getAppName(): string {
    return environment.appName;
  }

  /**
   * 🔢 OBTENER VERSIÓN DE LA APP
   */
  getAppVersion(): string {
    return environment.version;
  }

  /**
   * 🌐 OBTENER URL DE API
   */
  getApiUrl(): string {
    return environment.apiUrl;
  }

  /**
   * ⏱️ OBTENER TIMEOUT DE API
   */
  getApiTimeout(): number {
    return environment.apiTimeout;
  }

  /**
   * 🔧 DEBUG: MOSTRAR TODA LA CONFIGURACIÓN
   */
  logConfiguration(): void {
    if (!this.isProduction()) {
      console.group('⚙️ CONFIGURACIÓN DE LA APLICACIÓN');
      console.log('🏢 Empresa:', this.getEmpresaConfig());
      console.log('🗂️ Tablas Airtable:', environment.airtable.tables);
      console.log('🌐 API URL:', this.getApiUrl());
      console.log('📱 App:', this.getAppName(), 'v' + this.getAppVersion());
      console.log('🔧 Entorno:', this.isProduction() ? 'PRODUCCIÓN' : 'DESARROLLO');
      console.groupEnd();
    }
  }

  /**
   * 🔥 DETECTAR SI LA CONFIGURACIÓN CAMBIÓ
   */
  hasConfigurationChanged(): boolean {
    const currentConfig = this.getEmpresaNombre();
    const lastKnownConfig = localStorage.getItem('inmotable_last_config');
    
    if (lastKnownConfig !== currentConfig) {
      localStorage.setItem('inmotable_last_config', currentConfig);
      return true;
    }
    
    return false;
  }
}