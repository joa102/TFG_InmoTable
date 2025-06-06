import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ImageService } from './image.service';
import { CacheService, EmpresaCacheData } from './cache.service'; // 🔥 IMPORTAR CACHE SERVICE
import { Empresa, EmpresaFormData, ApiResponse, ApiResponseWithStats } from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  constructor(
    private apiService: ApiService,
    private imageService: ImageService,
    private cacheService: CacheService // 🔥 INYECTAR CACHE SERVICE
  ) {}

  /**
   * 🏢 OBTENER TODAS LAS EMPRESAS (PÚBLICO)
   */
  getAll(filtros?: any): Observable<ApiResponseWithStats<Empresa>> {
    return this.apiService.getWithStats<Empresa>('empresas', filtros);
  }

  /**
   * 🏢 OBTENER EMPRESA POR ID (PÚBLICO)
   */
  getById(id: string): Observable<Empresa> {
    return this.apiService.get<Empresa>(`empresas/${id}`)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al obtener empresa:', error);
          throw error;
        })
      );
  }

  /**
   * 🔍 OBTENER EMPRESA POR NOMBRE CON CACHÉ (PÚBLICO)
   * Este es el método principal que necesitamos para el navbar
   */
  getByName(nombre: string): Observable<Empresa | null> {
    console.log('🔍 Buscando empresa por nombre:', nombre);

    // 🔥 VERIFICAR CACHÉ PRIMERO
    const cachedEmpresa = this.cacheService.getEmpresaByName(nombre);
    if (cachedEmpresa) {
      console.log('✅ Empresa encontrada en caché:', cachedEmpresa);
      return of(this.mapCacheToEmpresa(cachedEmpresa));
    }

    // Si no está en caché, buscar en API
    const filtros = {
      search: nombre,
      filterByFormula: `{Nombre} = '${nombre}'`
    };

    return this.getAll(filtros).pipe(
      switchMap(response => {
        console.log('📊 Respuesta de API:', response);

        if (response.data && response.data.length > 0) {
          const empresa = response.data[0];
          console.log('✅ Empresa encontrada en API:', empresa);

          // 🔥 PROCESAR Y CACHEAR
          return this.processAndCacheEmpresa(empresa);
        } else {
          console.log('⚠️ No se encontró empresa con nombre:', nombre);
          return of(null);
        }
      }),
      catchError(error => {
        console.error('❌ Error al buscar empresa por nombre:', error);
        return of(null);
      })
    );
  }

  /**
   * 🔍 OBTENER PRIMERA EMPRESA ACTIVA CON CACHÉ (FALLBACK)
   */
  getFirstActive(): Observable<Empresa | null> {
    const filtros = {
      filterByFormula: `{Estado} = 'Activo'`,
      maxRecords: 1,
      sort: [{ field: 'Nombre', direction: 'asc' }]
    };

    return this.getAll(filtros).pipe(
      switchMap(response => {
        console.log('🔍 Búsqueda de primera empresa activa');

        if (response.data && response.data.length > 0) {
          const empresa = response.data[0];
          console.log('✅ Primera empresa activa encontrada:', empresa);

          // 🔥 PROCESAR Y CACHEAR
          return this.processAndCacheEmpresa(empresa);
        } else {
          console.log('⚠️ No se encontró ninguna empresa activa');
          return of(null);
        }
      }),
      catchError(error => {
        console.error('❌ Error al buscar primera empresa activa:', error);
        return of(null);
      })
    );
  }

  /**
   * 🔥 PROCESAR EMPRESA Y CACHEAR CON IMAGEN
   */
  private processAndCacheEmpresa(empresa: any): Observable<Empresa> {
    console.log('🔄 Procesando y cacheando empresa:', empresa);

    // Procesar logo con ImageService
    const empresaProcesada = this.processEmpresaLogo(empresa);

    // Si el logo es una URL de imagen, descargar y cachear
    if (empresaProcesada.logo && empresaProcesada.logo.startsWith('http')) {
      console.log('🖼️ Cacheando imagen del logo:', empresaProcesada.logo);

      return this.cacheService.cacheImage(empresaProcesada.logo).pipe(
        map(cachedImageUrl => {
          // Crear datos para caché
          const cacheData: EmpresaCacheData = {
            id: empresaProcesada.id,
            nombre: empresaProcesada.nombre,
            logo: empresaProcesada.logo,
            estado: empresaProcesada.estado,
            logoDataUrl: cachedImageUrl
          };

          // Guardar en caché
          this.cacheService.setEmpresa(cacheData);

          // Retornar empresa con imagen cacheada
          return {
            ...empresaProcesada,
            logo: cachedImageUrl // Usar imagen cacheada
          } as Empresa;
        }),
        catchError(error => {
          console.warn('⚠️ Error al cachear imagen, usando URL original:', error);

          // Si falla el cache de imagen, al menos cachear los datos
          const cacheData: EmpresaCacheData = {
            id: empresaProcesada.id,
            nombre: empresaProcesada.nombre,
            logo: empresaProcesada.logo,
            estado: empresaProcesada.estado
          };

          this.cacheService.setEmpresa(cacheData);
          return of(empresaProcesada as Empresa);
        })
      );
    } else {
      // Si no es imagen, cachear directamente
      const cacheData: EmpresaCacheData = {
        id: empresaProcesada.id,
        nombre: empresaProcesada.nombre,
        logo: empresaProcesada.logo,
        estado: empresaProcesada.estado
      };

      this.cacheService.setEmpresa(cacheData);
      return of(empresaProcesada as Empresa);
    }
  }

  /**
   * 🔄 MAPEAR DATOS DE CACHÉ A EMPRESA
   */
  private mapCacheToEmpresa(cacheData: EmpresaCacheData): Empresa {
    return {
      id: cacheData.id,
      nombre: cacheData.nombre,
      logo: cacheData.logoDataUrl || cacheData.logo, // Usar imagen cacheada si existe
      estado: cacheData.estado
    } as Empresa;
  }

  /**
   * 🖼️ PROCESAR LOGO CON IMAGE SERVICE (SIN CAMBIOS)
   */
  private processEmpresaLogo(empresa: any): any {
    console.log('🖼️ Procesando logo de empresa:', empresa);
    console.log('📎 Logo original:', empresa.logo);

    const empresaProcesada = { ...empresa };

    if (empresa.logo) {
      if (Array.isArray(empresa.logo)) {
        const logoUrl = this.imageService.getFirstImageOrDefault(empresa.logo);
        empresaProcesada.logo = logoUrl;
        console.log('✅ Logo procesado con ImageService (array):', logoUrl);
      }
      else if (typeof empresa.logo === 'string' && empresa.logo.startsWith('http')) {
        empresaProcesada.logo = empresa.logo;
        console.log('✅ Logo es URL directa:', empresa.logo);
      }
      else if (typeof empresa.logo === 'string') {
        empresaProcesada.logo = empresa.logo;
        console.log('✅ Logo es icono:', empresa.logo);
      }
      else {
        empresaProcesada.logo = 'fas fa-home';
        console.warn('⚠️ Logo en formato desconocido, usando fallback');
      }
    } else {
      empresaProcesada.logo = 'fas fa-home';
      console.warn('⚠️ No hay logo, usando fallback');
    }

    console.log('🎯 Logo final procesado:', empresaProcesada.logo);
    return empresaProcesada;
  }

  /**
   * 🧹 LIMPIAR CACHÉ DE EMPRESAS
   */
  clearCache(): void {
    this.cacheService.clearEmpresaCache();
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DE CACHÉ
   */
  getCacheStats() {
    return this.cacheService.getCacheStats();
  }

  /**
   * 🔒 CREAR EMPRESA (REQUIERE AUTH - ADMIN)
   */
  create(empresaData: EmpresaFormData): Observable<Empresa> {
    return this.apiService.post<Empresa>('empresas', empresaData)
      .pipe(
        map(response => response.data!),
        tap(() => {
          // Limpiar caché al crear nueva empresa
          this.clearCache();
        }),
        catchError(error => {
          console.error('Error al crear empresa:', error);
          throw error;
        })
      );
  }

  /**
   * 🔒 ACTUALIZAR EMPRESA (REQUIERE AUTH - ADMIN)
   */
  update(id: string, empresaData: Partial<EmpresaFormData>): Observable<Empresa> {
    return this.apiService.put<Empresa>(`empresas/${id}`, empresaData)
      .pipe(
        map(response => response.data!),
        tap(() => {
          // Limpiar caché al actualizar empresa
          this.clearCache();
        }),
        catchError(error => {
          console.error('Error al actualizar empresa:', error);
          throw error;
        })
      );
  }

  /**
   * 🔒 ELIMINAR EMPRESA (REQUIERE AUTH - ADMIN)
   */
  delete(id: string): Observable<boolean> {
    return this.apiService.delete(`empresas/${id}`)
      .pipe(
        map(response => response.success),
        tap(() => {
          // Limpiar caché al eliminar empresa
          this.clearCache();
        }),
        catchError(error => {
          console.error('Error al eliminar empresa:', error);
          throw error;
        })
      );
  }

  /**
   * 🔍 BUSCAR EMPRESAS (PÚBLICO)
   */
  search(termino: string): Observable<Empresa[]> {
    const filtros = {
      search: termino
    };

    return this.getAll(filtros).pipe(
      map(response => {
        if (response.data) {
          return response.data.map(empresa => this.processEmpresaLogo(empresa));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error al buscar empresas:', error);
        return of([]);
      })
    );
  }
}
