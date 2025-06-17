import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {
  Cliente,
  ClienteFormData,
  Propiedad,
  BusquedaFiltros,
  ApiResponse,
  ApiResponseWithStats
} from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  // 🔒 LISTAR CLIENTES (REQUIERE AUTH)
  getAll(filtros?: any): Observable<ApiResponseWithStats<Cliente>> {
    return this.apiService.getWithStats<Cliente>('clientes', filtros);
  }

  // 🔒 OBTENER CLIENTE POR ID (REQUIERE AUTH)
  getById(id: string): Observable<Cliente> {
    return this.apiService.get<Cliente>(`clientes/${id}`)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al obtener cliente:', error);
          throw error;
        })
      );
  }

  // 🔒 CREAR CLIENTE (REQUIERE AUTH)
  create(clienteData: ClienteFormData): Observable<Cliente> {
    return this.apiService.post<Cliente>('clientes', clienteData)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al crear cliente:', error);
          throw error;
        })
      );
  }

  // 🔒 ACTUALIZAR CLIENTE (REQUIERE AUTH)
  update(id: string, clienteData: Partial<ClienteFormData>): Observable<Cliente> {
    return this.apiService.put<Cliente>(`clientes/${id}`, clienteData)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al actualizar cliente:', error);
          throw error;
        })
      );
  }

  // 🔒 ELIMINAR CLIENTE (REQUIERE AUTH)
  delete(id: string): Observable<boolean> {
    return this.apiService.delete(`clientes/${id}`)
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error al eliminar cliente:', error);
          throw error;
        })
      );
  }

  // 🔒 BUSCAR CLIENTES (REQUIERE AUTH)
  buscar(filtros: BusquedaFiltros): Observable<ApiResponseWithStats<Cliente>> {
    return this.apiService.getWithStats<Cliente>('clientes/buscar', filtros);
  }

  // 🔒 OBTENER PROPIEDADES DE INTERÉS (REQUIERE AUTH)
  getPropiedadesInteres(clienteId: string): Observable<Propiedad[]> {
    return this.apiService.getWithStats<Propiedad>(`clientes/${clienteId}/propiedades-interes`)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error al obtener propiedades de interés:', error);
          throw error;
        })
      );
  }

  // 🔒 AGREGAR PROPIEDAD A INTERÉS (REQUIERE AUTH)
  agregarPropiedadInteres(clienteId: string, propiedadId: string): Observable<boolean> {
    return this.apiService.post(`clientes/${clienteId}/agregar-interes/${propiedadId}`, {})
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error al agregar propiedad a interés:', error);
          throw error;
        })
      );
  }

  // 🔒 QUITAR PROPIEDAD DE INTERÉS (REQUIERE AUTH)
  quitarPropiedadInteres(clienteId: string, propiedadId: string): Observable<boolean> {
    return this.apiService.delete(`clientes/${clienteId}/quitar-interes/${propiedadId}`)
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error al quitar propiedad de interés:', error);
          throw error;
        })
      );
  }

  // 🔥 MIS PROPIEDADES DE INTERÉS - CORREGIDO CON TIPOS EXPLÍCITOS
  getMisPropiedadesInteres(): Observable<Propiedad[]> {
    // 🔥 OBTENER EMAIL DEL USUARIO ACTUAL DESDE LOCALSTORAGE
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      console.warn('⚠️ No hay usuario logueado');
      return throwError(() => new Error('Usuario no autenticado'));
    }

    // 🔥 CONSTRUIR URL CON QUERY PARAMETER MANUALMENTE
    const endpoint = `mis-propiedades-interes?email=${encodeURIComponent(currentUser.email)}`;
    
    console.log('📧 Consultando propiedades de interés para:', currentUser.email);
    
    return this.apiService.get<Propiedad[]>(endpoint)
      .pipe(
        map((response: ApiResponse<Propiedad[]>) => {
          // 🔥 MANEJO SEGURO DE LA RESPUESTA
          if (response && response.data) {
            return Array.isArray(response.data) ? response.data : [];
          }
          return [];
        }),
        catchError(error => {
          console.error('❌ Error al obtener propiedades de interés:', error);
          throw error;
        })
      );
  }

  // 🔥 FILTRAR CLIENTES POR ESTADO
  filtrarPorEstado(estado: string): Observable<ApiResponseWithStats<Cliente>> {
    return this.getAll({ estado });
  }

  // 🔥 FILTRAR CLIENTES POR AGENTE
  filtrarPorAgente(agenteId: string): Observable<ApiResponseWithStats<Cliente>> {
    return this.getAll({ agente_id: agenteId });
  }

  // 🔥 FORMATEAR CLIENTE PARA MOSTRAR
  formatearCliente(cliente: Cliente): any {
    const fields = cliente.fields;

    return {
      id: cliente.id,
      nombre: fields.Nombre,
      email: fields.Email,
      telefono: fields.Teléfono,
      estado: fields.Estado || 'Activo',
      fecha_registro: fields['Fecha de Registro'] ? this.apiService.formatDateForDisplay(fields['Fecha de Registro']) : null,
      comentarios: fields.Comentarios || '',
      agente_id: fields.Agente ? fields.Agente[0] : null,
      propiedades_interes: fields.InteresPropiedades || []
    };
  }

  // 🔥 VALIDAR DATOS DE CLIENTE
  validarDatosCliente(datos: ClienteFormData): string[] {
    const errores: string[] = [];

    if (!datos.nombre || datos.nombre.trim().length < 2) {
      errores.push('El nombre debe tener al menos 2 caracteres');
    }

    if (!datos.email || !this.apiService.isValidEmail(datos.email)) {
      errores.push('El email no es válido');
    }

    if (!datos.telefono || datos.telefono.trim().length < 9) {
      errores.push('El teléfono debe tener al menos 9 caracteres');
    }

    if (datos.comentarios && datos.comentarios.length > 1000) {
      errores.push('Los comentarios no pueden superar los 1000 caracteres');
    }

    return errores;
  }

  // 🔥 OBTENER ESTADÍSTICAS DE CLIENTES
  obtenerEstadisticas(clientes: Cliente[]): any {
    const total = clientes.length;
    const activos = clientes.filter(c => c.fields.Estado === 'Activo').length;
    const inactivos = clientes.filter(c => c.fields.Estado === 'Inactivo').length;
    const suspendidos = clientes.filter(c => c.fields.Estado === 'Suspendido').length;

    // Clientes con propiedades de interés
    const conInteres = clientes.filter(c =>
      c.fields.InteresPropiedades && c.fields.InteresPropiedades.length > 0
    ).length;

    // Clientes con agente asignado
    const conAgente = clientes.filter(c =>
      c.fields.Agente && c.fields.Agente.length > 0
    ).length;

    return {
      total,
      activos,
      inactivos,
      suspendidos,
      sin_agente: total - conAgente,
      con_interes: conInteres,
      sin_interes: total - conInteres,
      porcentaje_activos: total > 0 ? Math.round((activos / total) * 100) : 0
    };
  }

  // 🔥 EXPORTAR CLIENTES A CSV
  exportarCSV(clientes: Cliente[]): string {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Estado', 'Fecha Registro'];
    const rows = clientes.map(cliente => {
      const formatted = this.formatearCliente(cliente);
      return [
        formatted.nombre,
        formatted.email,
        formatted.telefono,
        formatted.estado,
        formatted.fecha_registro || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // 🔥 DESCARGAR CSV
  descargarCSV(clientes: Cliente[], filename: string = 'clientes.csv'): void {
    const csvContent = this.exportarCSV(clientes);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // 🔥 NUEVOS MÉTODOS PARA GESTIÓN DE INTERÉS
  
  /**
   * 🔥 AGREGAR PROPIEDAD A INTERÉS DEL USUARIO LOGUEADO
   */
  agregarInteresUsuario(propiedadId: string): Observable<any> {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const payload = {
      email: currentUser.email,
      propiedad_id: propiedadId
    };

    console.log('❤️ Agregando propiedad a favoritos:', payload);

    return this.apiService.post('agregar-interes', payload)
      .pipe(
        map(response => response.data || response),
        catchError(error => {
          console.error('❌ Error al agregar a favoritos:', error);
          throw error;
        })
      );
  }

  /**
   * 🔥 QUITAR PROPIEDAD DE INTERÉS DEL USUARIO LOGUEADO
   */
  quitarInteresUsuario(propiedadId: string): Observable<any> {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    // 🔥 USAR QUERY PARAMS EN LA URL EN LUGAR DE PARÁMETROS DE OBJETO
    const endpoint = `quitar-interes?email=${encodeURIComponent(currentUser.email)}&propiedad_id=${encodeURIComponent(propiedadId)}`;

    console.log('💔 Quitando propiedad de favoritos:', { email: currentUser.email, propiedadId });

    return this.apiService.delete(endpoint) // 🔥 CORREGIDO: Solo un parámetro
      .pipe(
        map(response => response.data || response),
        catchError(error => {
          console.error('❌ Error al quitar de favoritos:', error);
          throw error;
        })
      );
  }

  /**
   * 🔥 VERIFICAR SI UNA PROPIEDAD ESTÁ EN INTERÉS DEL USUARIO LOGUEADO
   */
  verificarInteresUsuario(propiedadId: string): Observable<boolean> {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      return of(false);
    }

    // 🔥 USAR QUERY PARAMS EN LA URL
    const endpoint = `verificar-interes?email=${encodeURIComponent(currentUser.email)}&propiedad_id=${encodeURIComponent(propiedadId)}`;

    return this.apiService.get(endpoint)
      .pipe(
        map(response => {
          // 🔥 TIPADO SEGURO PARA EVITAR ERROR
          const data = response.data as any;
          return data?.es_favorito || false;
        }),
        catchError(error => {
          console.error('❌ Error al verificar favorito:', error);
          return of(false);
        })
      );
  }

  /**
   * 🔥 TOGGLE INTERÉS (AGREGAR O QUITAR SEGÚN ESTADO ACTUAL)
   */
  toggleInteresUsuario(propiedadId: string): Observable<{ accion: 'agregada' | 'quitada', mensaje: string }> {
    return this.verificarInteresUsuario(propiedadId).pipe(
      switchMap(esFavorito => {
        if (esFavorito) {
          // Ya es favorito, quitarlo
          return this.quitarInteresUsuario(propiedadId).pipe(
            map(() => ({
              accion: 'quitada' as const,
              mensaje: 'Propiedad quitada de favoritos'
            }))
          );
        } else {
          // No es favorito, agregarlo
          return this.agregarInteresUsuario(propiedadId).pipe(
            map(() => ({
              accion: 'agregada' as const,
              mensaje: 'Propiedad agregada a favoritos'
            }))
          );
        }
      })
    );
  }
}
