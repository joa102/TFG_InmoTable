import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryRgb: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  // 🔥 COLORES POR DEFECTO (LOS ACTUALES)
  private readonly DEFAULT_COLORS: ThemeColors = {
    primary: '#0d6efd',
    primaryDark: '#0a58ca',
    primaryLight: '#6ea8fe',
    primaryRgb: '13, 110, 253'
  };

  private currentTheme$ = new BehaviorSubject<ThemeColors>(this.DEFAULT_COLORS);

  constructor() {
    console.log('🎨 ThemeService inicializado con colores por defecto');
    this.loadColorsFromLocalStorage();
  }

  /**
   * 🎨 APLICAR COLORES DINÁMICOS AL CSS
   */
  applyColors(colors: Partial<ThemeColors>): void {
    console.log('🎨 Aplicando colores dinámicos:', colors);

    const finalColors: ThemeColors = {
      ...this.DEFAULT_COLORS,
      ...colors
    };

    // 🔥 APLICAR AL CSS ROOT
    const root = document.documentElement;
    
    if (finalColors.primary) {
      root.style.setProperty('--color-primary', finalColors.primary);
      console.log('✅ Color primary aplicado:', finalColors.primary);
    }
    
    if (finalColors.primaryDark) {
      root.style.setProperty('--color-primary-dark', finalColors.primaryDark);
      console.log('✅ Color primary-dark aplicado:', finalColors.primaryDark);
    }
    
    if (finalColors.primaryLight) {
      root.style.setProperty('--color-primary-light', finalColors.primaryLight);
      console.log('✅ Color primary-light aplicado:', finalColors.primaryLight);
    }
    
    if (finalColors.primaryRgb) {
      root.style.setProperty('--color-primary-rgb', finalColors.primaryRgb);
      console.log('✅ Color primary-rgb aplicado:', finalColors.primaryRgb);
    }

    // 🔥 RECALCULAR GRADIENTES AUTOMÁTICAMENTE
    const gradientPrimary = `linear-gradient(135deg, ${finalColors.primary} 0%, ${finalColors.primaryDark} 100%)`;
    root.style.setProperty('--gradient-primary', gradientPrimary);
    console.log('✅ Gradiente primary recalculado:', gradientPrimary);

    // 🔥 GUARDAR EN LOCALSTORAGE PARA PERSISTENCIA
    this.saveColorsToLocalStorage(finalColors);

    // 🔥 EMITIR CAMBIO
    this.currentTheme$.next(finalColors);

    console.log('🎨 Tema aplicado completamente:', finalColors);
  }

  /**
   * 🎨 APLICAR COLORES DESDE EMPRESA
   */
  applyColorsFromEmpresa(empresa: any): void {
    console.log('🏢 Aplicando colores desde empresa:', empresa);

    const colors: Partial<ThemeColors> = {};

    // 🔥 MAPEAR CAMPOS DE AIRTABLE
    if (empresa['color-primary']) {
      colors.primary = empresa['color-primary'];
    }
    if (empresa['color-primary-dark']) {
      colors.primaryDark = empresa['color-primary-dark'];
    }
    if (empresa['color-primary-light']) {
      colors.primaryLight = empresa['color-primary-light'];
    }
    if (empresa['color-primary-rgb']) {
      colors.primaryRgb = empresa['color-primary-rgb'];
    }

    // Solo aplicar si hay al menos un color
    if (Object.keys(colors).length > 0) {
      console.log('🎨 Colores encontrados en empresa, aplicando:', colors);
      this.applyColors(colors);
    } else {
      console.log('⚠️ No se encontraron colores en empresa, usando por defecto');
    }
  }

  /**
   * 🔄 RESETEAR A COLORES POR DEFECTO
   */
  resetToDefault(): void {
    console.log('🔄 Reseteando a colores por defecto');
    this.applyColors(this.DEFAULT_COLORS);
    localStorage.removeItem('inmotable_theme_colors');
  }

  /**
   * 📊 OBTENER COLORES ACTUALES
   */
  getCurrentColors(): ThemeColors {
    return this.currentTheme$.value;
  }

  /**
   * 📊 OBSERVABLE DE CAMBIOS DE TEMA
   */
  getThemeChanges() {
    return this.currentTheme$.asObservable();
  }

  /**
   * 💾 GUARDAR COLORES EN LOCALSTORAGE
   */
  private saveColorsToLocalStorage(colors: ThemeColors): void {
    try {
      localStorage.setItem('inmotable_theme_colors', JSON.stringify(colors));
      console.log('💾 Colores guardados en localStorage');
    } catch (error) {
      console.warn('⚠️ Error al guardar colores en localStorage:', error);
    }
  }

  /**
   * 📂 CARGAR COLORES DESDE LOCALSTORAGE
   */
  private loadColorsFromLocalStorage(): void {
    try {
      const savedColors = localStorage.getItem('inmotable_theme_colors');
      if (savedColors) {
        const colors: ThemeColors = JSON.parse(savedColors);
        console.log('📂 Colores cargados desde localStorage:', colors);
        this.applyColors(colors);
      }
    } catch (error) {
      console.warn('⚠️ Error al cargar colores desde localStorage:', error);
    }
  }

  /**
   * 🔍 VALIDAR COLOR HEX
   */
  private isValidHexColor(color: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  /**
   * 🔍 VALIDAR COLOR RGB
   */
  private isValidRgbString(rgb: string): boolean {
    const rgbRegex = /^\d{1,3},\s?\d{1,3},\s?\d{1,3}$/;
    return rgbRegex.test(rgb);
  }

  /**
   * 🎨 CONVERTIR HEX A RGB STRING
   */
  hexToRgbString(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `${r}, ${g}, ${b}`;
    }
    return '13, 110, 253'; // Default
  }

  /**
   * 🎨 GENERAR COLOR OSCURO AUTOMÁTICAMENTE
   */
  generateDarkColor(hexColor: string, percent: number = 20): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
    if (result) {
      const r = Math.max(0, parseInt(result[1], 16) - Math.floor(255 * percent / 100));
      const g = Math.max(0, parseInt(result[2], 16) - Math.floor(255 * percent / 100));
      const b = Math.max(0, parseInt(result[3], 16) - Math.floor(255 * percent / 100));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return hexColor;
  }

  /**
   * 🎨 GENERAR COLOR CLARO AUTOMÁTICAMENTE
   */
  generateLightColor(hexColor: string, percent: number = 30): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
    if (result) {
      const r = Math.min(255, parseInt(result[1], 16) + Math.floor(255 * percent / 100));
      const g = Math.min(255, parseInt(result[2], 16) + Math.floor(255 * percent / 100));
      const b = Math.min(255, parseInt(result[3], 16) + Math.floor(255 * percent / 100));
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    return hexColor;
  }
}
