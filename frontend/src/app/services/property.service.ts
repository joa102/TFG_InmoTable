import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

interface PropertyDetail {
  id: string;
  fields: {
    [key: string]: any;
  };
}

interface PropertyListResponse {
  success: boolean;
  data: PropertyDetail[];
  total: number;
  message?: string;
}

interface PropertyDetailResponse {
  success: boolean;
  data: PropertyDetail;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private readonly airtableApiUrl = 'https://api.airtable.com/v0';
  private readonly baseId = 'apphK1kfstMHhCctk';
  private readonly tableName = 'Propiedades';
  private readonly apiKey = 'patqhUQGjbKmPsGK3.c9f9fb0c76db5fd3fec8a5f94c5a0e7e57e61d74b23f8e0b3f55e5a5a1c6e6be';

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });
  }

  constructor(private http: HttpClient) {}

  /**
   * Obtener todas las propiedades
   */
  getAllProperties(): Observable<PropertyListResponse> {
    const url = `${this.airtableApiUrl}/${this.baseId}/${this.tableName}?sort[0][field]=Fecha de Registro&sort[0][direction]=desc&pageSize=100`;

    return this.http.get<any>(url, { headers: this.headers })
      .pipe(
        map(response => ({
          success: true,
          data: response.records || [],
          total: response.records?.length || 0
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
   * Obtener una propiedad específica por ID
   */
  getPropertyById(id: string): Observable<PropertyDetailResponse> {
    const url = `${this.airtableApiUrl}/${this.baseId}/${this.tableName}/${id}`;

    return this.http.get<PropertyDetail>(url, { headers: this.headers })
      .pipe(
        map(property => ({
          success: true,
          data: property
        })),
        catchError(error => {
          console.error('Error al obtener propiedad:', error);
          return of({
            success: false,
            data: {} as PropertyDetail,
            message: 'Propiedad no encontrada'
          });
        })
      );
  }

  /**
   * Buscar propiedades por texto
   */
  searchProperties(searchText: string): Observable<PropertyListResponse> {
    const filterFormula = `OR(
      FIND("${searchText}", {Título}) > 0,
      FIND("${searchText}", {Descripción}) > 0,
      FIND("${searchText}", {Dirección}) > 0,
      FIND("${searchText}", {Tipo}) > 0
    )`;

    const url = `${this.airtableApiUrl}/${this.baseId}/${this.tableName}?filterByFormula=${encodeURIComponent(filterFormula)}`;

    return this.http.get<any>(url, { headers: this.headers })
      .pipe(
        map(response => ({
          success: true,
          data: response.records || [],
          total: response.records?.length || 0
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
   * Obtener coordenadas de una propiedad
   */
  getPropertyCoordinates(property: PropertyDetail): { lat: number; lng: number } {
    const coordenadas = property.fields['Coordenadas (Lat, Lng)'];
    if (coordenadas) {
      try {
        const [lat, lng] = coordenadas.split(',').map((coord: string) => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      } catch (error) {
        console.warn('Error al parsear coordenadas:', error);
      }
    }

    // Coordenadas por defecto (Madrid centro)
    return { lat: 40.4168, lng: -3.7038 };
  }
}
