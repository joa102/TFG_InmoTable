import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment'; // ✅ IMPORTAR ENVIRONMENT
import {
  Propiedad,
  PropiedadFields,
  PropertyListResponse,
  PropertyDetailResponse,
  AirtableResponse,
  PropertyFilters
} from '../models/airtable.interfaces';

@Injectable({
  providedIn: 'root'
})
export class PropiedadesService {

  // ✅ USAR VARIABLES DE ENVIRONMENT
  private readonly airtableApiUrl = environment.airtable.apiUrl;
  private readonly baseId = environment.airtable.baseId;
  private readonly tableName = environment.airtable.tables.propiedades;
  private readonly apiKey = environment.airtable.apiKey;

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });
  }

  constructor(private http: HttpClient) {
    // console.log('🔧 Airtable Service Config:', {
    //   baseId: this.airtableConfig.baseId,
    //   tableName: this.airtableConfig.tableName,
    //   apiKeyPresent: !!this.airtableConfig.apiKey,
    //   environment: 'DEV'
    // });
  }

  /**
   * Obtener todas las propiedades con filtros opcionales
   */
  getAll(filters?: PropertyFilters): Observable<PropertyListResponse> {
    // Si hay filtros, usar el método original (sin paginación para mantener compatibilidad)
    if (filters && this.hasActiveFilters(filters)) {
      return this.getAllWithFilters(filters);
    }

    // Sin filtros, obtener TODAS las propiedades con paginación
    return this.getAllRecordsRecursive().pipe(
      map(allRecords => ({
        success: true,
        data: allRecords,
        total: allRecords.length
      })),
      catchError(error => {
        console.error('Error al obtener todas las propiedades:', error);
        return of({
          success: false,
          data: [],
          total: 0,
          message: 'Error al cargar las propiedades'
        });
      })
    );
  }

  /**
   * ✅ MÉTODO AUXILIAR - Verificar si hay filtros activos
   */
  private hasActiveFilters(filters: PropertyFilters): boolean {
    return !!(filters.tipo || filters.estado || filters.precioMin || filters.precioMax ||
              filters.zona || filters.habitaciones || filters.superficieMin ||
              filters.superficieMax || filters.banos);
  }

  /**
   * ✅ MÉTODO AUXILIAR - getAll con filtros (método original)
   */
  private getAllWithFilters(filters: PropertyFilters): Observable<PropertyListResponse> {
    let url = `${this.airtableApiUrl}/${this.baseId}/${this.tableName}`;

    const params: string[] = [];
    const filterFormulas: string[] = [];

    if (filters.tipo) {
      filterFormulas.push(`{Tipo} = "${filters.tipo}"`);
    }

    if (filters.estado) {
      filterFormulas.push(`{Estado} = "${filters.estado}"`);
    }

    if (filters.precioMin) {
      filterFormulas.push(`{Precio} >= ${filters.precioMin}`);
    }

    if (filters.precioMax) {
      filterFormulas.push(`{Precio} <= ${filters.precioMax}`);
    }

    if (filters.zona) {
      filterFormulas.push(`FIND("${filters.zona}", {Dirección}) > 0`);
    }

    if (filters.habitaciones) {
      filterFormulas.push(`{Habitaciones} >= ${filters.habitaciones}`);
    }

    if (filters.superficieMin) {
      filterFormulas.push(`{Superficie} >= ${filters.superficieMin}`);
    }

    if (filters.superficieMax) {
      filterFormulas.push(`{Superficie} <= ${filters.superficieMax}`);
    }

    if (filters.banos) {
      filterFormulas.push(`{Baños} >= ${filters.banos}`);
    }

    if (filterFormulas.length > 0) {
      const formula = filterFormulas.length === 1
        ? filterFormulas[0]
        : `AND(${filterFormulas.join(', ')})`;
      params.push(`filterByFormula=${encodeURIComponent(formula)}`);
    }

    params.push('sort[0][field]=Fecha de Registro');
    params.push('sort[0][direction]=desc');

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<AirtableResponse<PropiedadFields>>(url, { headers: this.headers })
      .pipe(
        map(response => ({
          success: true,
          data: response.records.map(record => ({
            id: record.id,
            fields: record.fields,
            createdTime: record.createdTime
          })) as Propiedad[],
          total: response.records.length
        })),
        catchError(error => {
          console.error('Error al obtener propiedades:', error);
          return of({
            success: false,
            data: [],
            total: 0,
            message: 'Error al cargar las propiedades'
          });
        })
      );
  }

  /**
   * ✅ MÉTODO RECURSIVO PARA OBTENER TODOS LOS REGISTROS
   */
  private getAllRecordsRecursive(offset?: string, accumulatedRecords: Propiedad[] = []): Observable<Propiedad[]> {
    let url = `${this.airtableApiUrl}/${this.baseId}/${this.tableName}?sort[0][field]=Fecha de Registro&sort[0][direction]=desc&pageSize=100`;

    if (offset) {
      url += `&offset=${offset}`;
    }

    return this.http.get<AirtableResponse<PropiedadFields>>(url, { headers: this.headers }).pipe(
      switchMap(response => {
        const newRecords = response.records.map(record => ({
          id: record.id,
          fields: record.fields,
          createdTime: record.createdTime
        })) as Propiedad[];

        const allRecords = [...accumulatedRecords, ...newRecords];

        // Si hay más páginas, continuar recursivamente
        if (response.offset) {
          return this.getAllRecordsRecursive(response.offset, allRecords);
        }

        // Si no hay más páginas, devolver todos los registros
        return of(allRecords);
      })
    );
  }

  /**
   * Obtener una propiedad específica por ID
   */
  getById(id: string): Observable<PropertyDetailResponse> {
    const url = `${this.airtableApiUrl}/${this.baseId}/${this.tableName}/${id}`;

    return this.http.get<Propiedad>(url, { headers: this.headers })
      .pipe(
        map(property => ({
          success: true,
          data: property
        })),
        catchError(error => {
          console.error('❌ Error al obtener propiedad:', error);
          return of({
            success: false,
            data: {} as Propiedad,
            message: 'Propiedad no encontrada'
          });
        })
      );
  }

  /**
   * Buscar propiedades por término
   */
  search(searchTerm: string): Observable<PropertyListResponse> {
    const url = `${this.airtableApiUrl}/${this.baseId}/${this.tableName}`;

    const searchFormula = `OR(
      FIND("${searchTerm}", UPPER({Título})) > 0,
      FIND("${searchTerm}", UPPER({Descripción})) > 0,
      FIND("${searchTerm}", UPPER({Dirección})) > 0,
      FIND("${searchTerm}", UPPER({Tipo})) > 0
    )`;

    const params = [
      `filterByFormula=${encodeURIComponent(searchFormula)}`,
      'sort[0][field]=Fecha de Registro',
      'sort[0][direction]=desc'
    ];

    const searchUrl = `${url}?${params.join('&')}`;

    // ✅ ARREGLAR EL TIPO CORRECTO
    return this.http.get<AirtableResponse<PropiedadFields>>(searchUrl, { headers: this.headers })
      .pipe(
        map(response => ({
          success: true,
          data: response.records.map(record => ({
            id: record.id,
            fields: record.fields,
            createdTime: record.createdTime
          })) as Propiedad[], // ✅ CAST CORRECTO
          total: response.records.length
        })),
        catchError(error => {
          console.error('Error en búsqueda:', error);
          return of({
            success: false,
            data: [],
            total: 0,
            message: 'Error en la búsqueda'
          });
        })
      );
  }

  /**
   * Obtener propiedades por tipo
   */
  getByType(tipo: string): Observable<PropertyListResponse> {
    const url = `${this.airtableApiUrl}/${this.baseId}/${this.tableName}`;

    const params = [
      `filterByFormula={Tipo} = "${tipo}"`,
      'sort[0][field]=Fecha de Registro',
      'sort[0][direction]=desc'
    ];

    const typeUrl = `${url}?${params.join('&')}`;

    // ✅ ARREGLAR EL TIPO CORRECTO
    return this.http.get<AirtableResponse<PropiedadFields>>(typeUrl, { headers: this.headers })
      .pipe(
        map(response => ({
          success: true,
          data: response.records.map(record => ({
            id: record.id,
            fields: record.fields,
            createdTime: record.createdTime
          })) as Propiedad[], // ✅ CAST CORRECTO
          total: response.records.length
        })),
        catchError(error => {
          console.error('Error al obtener propiedades por tipo:', error);
          return of({
            success: false,
            data: [],
            total: 0,
            message: 'Error al cargar propiedades por tipo'
          });
        })
      );
  }

  /**
   * Obtener propiedades destacadas
   */
  getFeatured(limit: number = 6): Observable<PropertyListResponse> {
    const url = `${this.airtableApiUrl}/${this.baseId}/${this.tableName}?pageSize=${limit}&sort[0][field]=Número de visitas&sort[0][direction]=desc`;

    return this.http.get<AirtableResponse<PropiedadFields>>(url, { headers: this.headers })
      .pipe(
        map(response => ({
          success: true,
          data: response.records || [],
          total: response.records?.length || 0
        })),
        catchError(error => {
          console.error('Error al obtener propiedades destacadas:', error);
          return of({
            success: false,
            data: [],
            total: 0,
            message: 'Error al cargar propiedades destacadas'
          });
        })
      );
  }

  /**
   * Formatear precio para mostrar
   */
  formatPrice(precio: number | undefined): string {
    if (!precio) return 'Precio a consultar';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio);
  }

  /**
   * Obtener tipos únicos de propiedades para filtros
   */
  getPropertyTypes(): Observable<string[]> {
    return this.getAll().pipe(
      map(response => {
        if (response.success && response.data) {
          const tipos = response.data
            .map(p => p.fields['Tipo'])
            .filter((tipo, index, array) => tipo && array.indexOf(tipo) === index)
            .sort();
          return tipos;
        }
        return [];
      })
    );
  }
}
