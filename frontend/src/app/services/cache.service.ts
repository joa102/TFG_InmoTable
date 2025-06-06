import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface EmpresaCacheData {
  id: string;
  nombre: string;
  logo: string;
  estado: string;
  logoBlob?: Blob;
  logoDataUrl?: string; // 🔥 Imagen como base64 para persistir
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 1000 * 60 * 30; // 30 minutos
  private readonly EMPRESA_TTL = 1000 * 60 * 60 * 24; // 24 horas para empresas
  private readonly IMAGE_TTL = 1000 * 60 * 60 * 24 * 30; // 🔥 30 DÍAS para imágenes

  constructor() {
    console.log('🗂️ CacheService inicializado con persistencia');
    this.loadFromLocalStorage();
    this.cleanupExpiredItems();

    // Limpiar caché cada hora
    setInterval(() => {
      this.cleanupExpiredItems();
    }, 1000 * 60 * 60);
  }

  /**
   * 🔥 CARGAR DATOS DESDE LOCALSTORAGE AL INICIALIZAR
   */
  private loadFromLocalStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('inmotable_cache_'));

      console.log(`📂 Cargando ${cacheKeys.length} elementos del localStorage`);

      cacheKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            const cacheKey = key.replace('inmotable_cache_', '');
            this.cache.set(cacheKey, parsed);
          }
        } catch (error) {
          console.warn(`⚠️ Error al cargar ${key} del localStorage:`, error);
          localStorage.removeItem(key);
        }
      });

      console.log(`✅ ${this.cache.size} elementos cargados del localStorage`);
    } catch (error) {
      console.error('❌ Error al cargar caché desde localStorage:', error);
    }
  }

  /**
   * 🔥 GUARDAR EN LOCALSTORAGE
   */
  private saveToLocalStorage(key: string, item: CacheItem<any>): void {
    try {
      const storageKey = `inmotable_cache_${key}`;
      localStorage.setItem(storageKey, JSON.stringify(item));
      console.log(`💾 Guardado en localStorage: ${key}`);
    } catch (error) {
      console.warn(`⚠️ Error al guardar ${key} en localStorage:`, error);
      // Si falla, al menos mantener en memoria
    }
  }

  /**
   * 💾 Guardar elemento en caché (CON PERSISTENCIA)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.DEFAULT_TTL);

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt
    };

    this.cache.set(key, item);

    // 🔥 GUARDAR EN LOCALSTORAGE PARA PERSISTENCIA
    this.saveToLocalStorage(key, item);

    console.log(`💾 Guardado en caché persistente: ${key} (expira en ${Math.round((ttl || this.DEFAULT_TTL) / 1000 / 60)} min)`);
  }

  /**
   * 📋 Obtener elemento del caché
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      console.log(`📋 No encontrado en caché: ${key}`);
      return null;
    }

    if (Date.now() > item.expiresAt) {
      console.log(`⏰ Expirado en caché: ${key}`);
      this.delete(key);
      return null;
    }

    console.log(`✅ Obtenido del caché persistente: ${key}`);
    return item.data as T;
  }

  /**
   * 🗑️ Eliminar elemento del caché
   */
  delete(key: string): void {
    this.cache.delete(key);

    // 🔥 ELIMINAR TAMBIÉN DE LOCALSTORAGE
    try {
      localStorage.removeItem(`inmotable_cache_${key}`);
      console.log(`🗑️ Eliminado del caché persistente: ${key}`);
    } catch (error) {
      console.warn(`⚠️ Error al eliminar ${key} del localStorage:`, error);
    }
  }

  /**
   * 🧹 Limpiar elementos expirados
   */
  private cleanupExpiredItems(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.delete(key); // Usa delete() para limpiar también localStorage
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Limpieza de caché persistente: ${removedCount} elementos expirados eliminados`);
    }
  }

  /**
   * 🏢 Guardar datos de empresa en caché PERSISTENTE
   */
  setEmpresa(empresa: EmpresaCacheData): void {
    const key = `empresa_${empresa.id}`;
    const keyByName = `empresa_name_${empresa.nombre}`;

    this.set(key, empresa, this.EMPRESA_TTL);
    this.set(keyByName, empresa, this.EMPRESA_TTL);
  }

  /**
   * 🏢 Obtener empresa por ID del caché
   */
  getEmpresa(id: string): EmpresaCacheData | null {
    const key = `empresa_${id}`;
    return this.get<EmpresaCacheData>(key);
  }

  /**
   * 🏢 Obtener empresa por nombre del caché
   */
  getEmpresaByName(nombre: string): EmpresaCacheData | null {
    const key = `empresa_name_${nombre}`;
    return this.get<EmpresaCacheData>(key);
  }

  /**
   * 🔥 VERIFICAR SI IMAGEN YA ESTÁ CACHEADA
   */
  isImageCached(url: string): boolean {
    const key = `image_${this.hashUrl(url)}`;
    const cached = this.get<string>(key);
    return !!cached;
  }

  /**
   * 🔥 OBTENER IMAGEN CACHEADA INMEDIATAMENTE
   */
  getCachedImage(url: string): string | null {
    const key = `image_${this.hashUrl(url)}`;
    return this.get<string>(key);
  }

  /**
   * 🖼️ Descargar y cachear imagen PERSISTENTE
   */
  cacheImage(url: string): Observable<string> {
    const key = `image_${this.hashUrl(url)}`;

    // 🔥 VERIFICAR PRIMERO EN CACHÉ PERSISTENTE
    const cachedDataUrl = this.get<string>(key);
    if (cachedDataUrl) {
      console.log('🖼️ Imagen obtenida del caché persistente:', url);
      return of(cachedDataUrl);
    }

    console.log('🔄 Descargando imagen para caché persistente:', url);

    // Descargar imagen y convertir a Data URL para persistir
    return new Observable<string>(observer => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Crear canvas para convertir a Data URL
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          ctx?.drawImage(img, 0, 0);

          // 🔥 CONVERTIR A DATA URL CON BUENA CALIDAD PERO OPTIMIZADO
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // 85% calidad para balance tamaño/calidad

          // 🔥 GUARDAR EN CACHÉ PERSISTENTE (30 DÍAS)
          this.set(key, dataUrl, this.IMAGE_TTL);

          console.log('✅ Imagen descargada y cacheada persistentemente:', url);
          observer.next(dataUrl);
          observer.complete();
        } catch (error) {
          console.error('❌ Error al procesar imagen:', error);
          observer.error(error);
        }
      };

      img.onerror = (error) => {
        console.error('❌ Error al cargar imagen:', error);
        observer.error(error);
      };

      img.src = url;
    }).pipe(
      catchError(error => {
        console.error('❌ Error en cacheImage:', error);
        // Si falla, retornar la URL original
        return of(url);
      })
    );
  }

  /**
   * 🔗 Generar hash simple de URL
   */
  private hashUrl(url: string): string {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 📊 Obtener estadísticas del caché
   */
  getCacheStats(): { size: number; keys: string[]; localStorage: number } {
    const localStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('inmotable_cache_'));

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      localStorage: localStorageKeys.length
    };
  }

  /**
   * 🧹 Limpiar todo el caché (MEMORIA + LOCALSTORAGE)
   */
  clear(): void {
    const size = this.cache.size;

    // Limpiar memoria
    this.cache.clear();

    // 🔥 LIMPIAR LOCALSTORAGE
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('inmotable_cache_'));
      cacheKeys.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 Caché completamente limpiado: ${size} elementos de memoria + ${cacheKeys.length} de localStorage`);
    } catch (error) {
      console.error('❌ Error al limpiar localStorage:', error);
    }
  }

  /**
   * 🧹 Limpiar solo caché de empresas
   */
  clearEmpresaCache(): void {
    const keys = Array.from(this.cache.keys());
    const empresaKeys = keys.filter(key => key.startsWith('empresa_'));

    empresaKeys.forEach(key => this.delete(key)); // delete() limpia memoria + localStorage
    console.log(`🧹 Caché de empresas limpiado: ${empresaKeys.length} elementos eliminados`);
  }

  /**
   * 🧹 Limpiar solo caché de imágenes
   */
  clearImageCache(): void {
    const keys = Array.from(this.cache.keys());
    const imageKeys = keys.filter(key => key.startsWith('image_'));

    imageKeys.forEach(key => this.delete(key)); // delete() limpia memoria + localStorage
    console.log(`🧹 Caché de imágenes limpiado: ${imageKeys.length} elementos eliminados`);
  }

  /**
   * 🔥 VERIFICAR TAMAÑO DEL LOCALSTORAGE
   */
  getLocalStorageSize(): { used: string; keys: number } {
    try {
      let total = 0;
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('inmotable_cache_'));

      cacheKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          total += value.length;
        }
      });

      return {
        used: `${(total / 1024 / 1024).toFixed(2)} MB`,
        keys: cacheKeys.length
      };
    } catch (error) {
      return { used: 'Error', keys: 0 };
    }
  }
}
