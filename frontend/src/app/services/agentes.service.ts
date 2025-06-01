import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Agente,
  AgenteFormData,
  AgenteEstadisticas,
  Cliente,
  BusquedaFiltros,
  ApiResponse,
  ApiResponseWithStats
} from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AgentesService {

  constructor(private apiService: ApiService) {}

  // 🔒 LISTAR AGENTES (REQUIERE AUTH)
  getAll(filtros?: any): Observable<ApiResponseWithStats<Agente>> {
    return this.apiService.getWithStats<Agente>('agentes', filtros);
  }

  // 🔒 OBTENER AGENTE POR ID (REQUIERE AUTH)
  getById(id: string): Observable<Agente> {
    return this.apiService.get<Agente>(`agentes/${id}`)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al obtener agente:', error);
          throw error;
        })
      );
  }

  // 🔒 CREAR AGENTE (REQUIERE AUTH - ADMIN)
  create(agenteData: AgenteFormData): Observable<Agente> {
    return this.apiService.post<Agente>('agentes', agenteData)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al crear agente:', error);
          throw error;
        })
      );
  }

  // 🔒 ACTUALIZAR AGENTE (REQUIERE AUTH)
  update(id: string, agenteData: Partial<AgenteFormData>): Observable<Agente> {
    return this.apiService.put<Agente>(`agentes/${id}`, agenteData)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al actualizar agente:', error);
          throw error;
        })
      );
  }

  // 🔒 ELIMINAR AGENTE (REQUIERE AUTH - ADMIN)
  delete(id: string): Observable<boolean> {
    return this.apiService.delete(`agentes/${id}`)
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error al eliminar agente:', error);
          throw error;
        })
      );
  }

  // 🔒 BUSCAR AGENTES (REQUIERE AUTH)
  buscar(filtros: BusquedaFiltros): Observable<ApiResponseWithStats<Agente>> {
    return this.apiService.getWithStats<Agente>('agentes/buscar', filtros);
  }

  // 🔒 OBTENER CLIENTES DEL AGENTE (REQUIERE AUTH)
  getClientes(agenteId: string): Observable<Cliente[]> {
    return this.apiService.getWithStats<Cliente>(`agentes/${agenteId}/clientes`)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error al obtener clientes del agente:', error);
          throw error;
        })
      );
  }

  // 🔒 ASIGNAR CLIENTE A AGENTE (REQUIERE AUTH)
  asignarCliente(agenteId: string, clienteId: string): Observable<boolean> {
    return this.apiService.post(`agentes/${agenteId}/asignar-cliente`, { cliente_id: clienteId })
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error al asignar cliente:', error);
          throw error;
        })
      );
  }

  // 🔒 QUITAR CLIENTE DE AGENTE (REQUIERE AUTH)
  quitarCliente(agenteId: string, clienteId: string): Observable<boolean> {
    return this.apiService.post(`agentes/${agenteId}/quitar-cliente`, { cliente_id: clienteId })
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error al quitar cliente:', error);
          throw error;
        })
      );
  }

  // 🔒 OBTENER ESTADÍSTICAS DEL AGENTE (REQUIERE AUTH)
  getEstadisticas(agenteId: string): Observable<AgenteEstadisticas> {
    return this.apiService.get<AgenteEstadisticas>(`agentes/${agenteId}/estadisticas`)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al obtener estadísticas del agente:', error);
          throw error;
        })
      );
  }

  // 🔥 FILTRAR AGENTES POR ESTADO
  filtrarPorEstado(estado: string): Observable<ApiResponseWithStats<Agente>> {
    return this.getAll({ estado });
  }

  // 🔥 FILTRAR AGENTES POR ZONA
  filtrarPorZona(zona: string): Observable<ApiResponseWithStats<Agente>> {
    return this.getAll({ zona });
  }

  // 🔥 OBTENER AGENTES ACTIVOS
  getAgentesActivos(): Observable<Agente[]> {
    return this.filtrarPorEstado('Activo')
      .pipe(
        map(response => response.data || [])
      );
  }

  // 🔥 FORMATEAR AGENTE PARA MOSTRAR
  formatearAgente(agente: Agente): any {
    const fields = agente.fields;

    return {
      id: agente.id,
      id_agente: fields['ID Agente'],
      nombre: fields.Nombre,
      email: fields.Email,
      telefono: fields.Teléfono,
      zona_asignada: fields['Zona asignada'],
      estado: fields.Estado,
      estadisticas: agente.estadisticas || {
        total_clientes: 0,
        total_citas: 0,
        citas_pendientes: 0,
        citas_confirmadas: 0,
        citas_realizadas: 0,
        citas_canceladas: 0,
        clientes_activos: 0
      }
    };
  }

  // 🔥 VALIDAR DATOS DE AGENTE
  validarDatosAgente(datos: AgenteFormData): string[] {
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

    if (!datos.zona_asignada || datos.zona_asignada.trim().length < 3) {
      errores.push('La zona asignada debe tener al menos 3 caracteres');
    }

    return errores;
  }

  // 🔥 OBTENER ZONAS ÚNICAS
  getZonasUnicas(agentes: Agente[]): string[] {
    const zonas = agentes
      .map(a => a.fields['Zona asignada'])
      .filter(Boolean);
    return [...new Set(zonas)].sort();
  }

  // 🔥 OBTENER ESTADÍSTICAS GENERALES
  obtenerEstadisticasGenerales(agentes: Agente[]): any {
    const total = agentes.length;
    const activos = agentes.filter(a => a.fields.Estado === 'Activo').length;
    const inactivos = agentes.filter(a => a.fields.Estado === 'Inactivo').length;
    const vacaciones = agentes.filter(a => a.fields.Estado === 'Vacaciones').length;
    const suspendidos = agentes.filter(a => a.fields.Estado === 'Suspendido').length;

    // Estadísticas de rendimiento (si están disponibles)
    const conEstadisticas = agentes.filter(a => a.estadisticas);
    let totalClientes = 0;
    let totalCitas = 0;

    conEstadisticas.forEach(agente => {
      if (agente.estadisticas) {
        totalClientes += agente.estadisticas.total_clientes;
        totalCitas += agente.estadisticas.total_citas;
      }
    });

    const promedioClientesPorAgente = activos > 0 ? Math.round(totalClientes / activos) : 0;
    const promedioCitasPorAgente = activos > 0 ? Math.round(totalCitas / activos) : 0;

    return {
      total,
      activos,
      inactivos,
      vacaciones,
      suspendidos,
      total_clientes: totalClientes,
      total_citas: totalCitas,
      promedio_clientes_por_agente: promedioClientesPorAgente,
      promedio_citas_por_agente: promedioCitasPorAgente,
      porcentaje_activos: total > 0 ? Math.round((activos / total) * 100) : 0
    };
  }

  // 🔥 RANKING DE AGENTES POR RENDIMIENTO
  getRankingPorRendimiento(agentes: Agente[]): any[] {
    return agentes
      .filter(a => a.estadisticas && a.fields.Estado === 'Activo')
      .map(agente => {
        const stats = agente.estadisticas!;
        const rendimiento = stats.citas_realizadas + (stats.total_clientes * 0.5);

        return {
          ...this.formatearAgente(agente),
          rendimiento,
          eficiencia_citas: stats.total_citas > 0 ?
            Math.round((stats.citas_realizadas / stats.total_citas) * 100) : 0
        };
      })
      .sort((a, b) => b.rendimiento - a.rendimiento);
  }

  // 🔥 OBTENER AGENTE CON MENOS CARGA
  getAgenteMenosCarga(agentes: Agente[]): Agente | null {
    const agentesActivos = agentes.filter(a =>
      a.fields.Estado === 'Activo' && a.estadisticas
    );

    if (agentesActivos.length === 0) return null;

    return agentesActivos.reduce((menor, actual) => {
      const cargaMenor = menor.estadisticas?.total_clientes || 0;
      const cargaActual = actual.estadisticas?.total_clientes || 0;
      return cargaActual < cargaMenor ? actual : menor;
    });
  }

  // 🔥 EXPORTAR AGENTES A CSV
  exportarCSV(agentes: Agente[]): string {
    const headers = [
      'ID Agente', 'Nombre', 'Email', 'Teléfono',
      'Zona Asignada', 'Estado', 'Total Clientes', 'Total Citas'
    ];

    const rows = agentes.map(agente => {
      const formatted = this.formatearAgente(agente);
      return [
        formatted.id_agente || '',
        formatted.nombre,
        formatted.email,
        formatted.telefono,
        formatted.zona_asignada,
        formatted.estado,
        formatted.estadisticas.total_clientes.toString(),
        formatted.estadisticas.total_citas.toString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // 🔥 DESCARGAR CSV
  descargarCSV(agentes: Agente[], filename: string = 'agentes.csv'): void {
    const csvContent = this.exportarCSV(agentes);
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
}
