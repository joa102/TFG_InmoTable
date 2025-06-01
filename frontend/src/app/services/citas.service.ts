// filepath: frontend/src/app/services/citas.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  Cita,
  CitaFormData,
  SolicitudCitaData,
  ApiResponse,
  ApiResponseWithStats
} from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root'
})
export class CitasService {

  constructor(private apiService: ApiService) {}

  // 🔒 LISTAR CITAS (REQUIERE AUTH)
  getAll(filtros?: any): Observable<ApiResponseWithStats<Cita>> {
    return this.apiService.getWithStats<Cita>('citas', filtros);
  }

  // 🔒 OBTENER CITA POR ID (REQUIERE AUTH)
  getById(id: string): Observable<Cita> {
    return this.apiService.get<Cita>(`citas/${id}`)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al obtener cita:', error);
          throw error;
        })
      );
  }

  // 🔒 CREAR CITA (REQUIERE AUTH)
  create(citaData: CitaFormData): Observable<Cita> {
    return this.apiService.post<Cita>('citas', citaData)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al crear cita:', error);
          throw error;
        })
      );
  }

  // 🔒 ACTUALIZAR CITA (REQUIERE AUTH)
  update(id: string, citaData: Partial<CitaFormData>): Observable<Cita> {
    return this.apiService.put<Cita>(`citas/${id}`, citaData)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al actualizar cita:', error);
          throw error;
        })
      );
  }

  // 🔒 ELIMINAR CITA (REQUIERE AUTH)
  delete(id: string): Observable<boolean> {
    return this.apiService.delete(`citas/${id}`)
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error al eliminar cita:', error);
          throw error;
        })
      );
  }

  // 🔒 CONFIRMAR CITA (REQUIERE AUTH)
  confirmar(id: string): Observable<Cita> {
    return this.apiService.post<Cita>(`citas/${id}/confirmar`, {})
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al confirmar cita:', error);
          throw error;
        })
      );
  }

  // 🔒 CANCELAR CITA (REQUIERE AUTH)
  cancelar(id: string, motivo?: string): Observable<Cita> {
    const data = motivo ? { motivo } : {};
    return this.apiService.post<Cita>(`citas/${id}/cancelar`, data)
      .pipe(
        map(response => response.data!),
        catchError(error => {
          console.error('Error al cancelar cita:', error);
          throw error;
        })
      );
  }

  // 🔥 SOLICITAR CITA (PÚBLICO)
  solicitarCita(solicitudData: SolicitudCitaData): Observable<boolean> {
    return this.apiService.post('solicitar-cita', solicitudData)
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Error al solicitar cita:', error);
          throw error;
        })
      );
  }

  // 🔒 MIS CITAS (REQUIERE AUTH - CLIENTE)
  getMisCitas(): Observable<Cita[]> {
    return this.apiService.getWithStats<Cita>('mis-citas')
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error al obtener mis citas:', error);
          throw error;
        })
      );
  }

  // 🔥 FILTRAR CITAS POR ESTADO
  filtrarPorEstado(estado: string): Observable<ApiResponseWithStats<Cita>> {
    return this.getAll({ estado });
  }

  // 🔥 FILTRAR CITAS POR FECHA
  filtrarPorFecha(fechaInicio: string, fechaFin: string): Observable<ApiResponseWithStats<Cita>> {
    return this.getAll({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin
    });
  }

  // 🔥 FILTRAR CITAS POR CLIENTE
  filtrarPorCliente(clienteId: string): Observable<ApiResponseWithStats<Cita>> {
    return this.getAll({ cliente_id: clienteId });
  }

  // 🔥 FILTRAR CITAS POR PROPIEDAD
  filtrarPorPropiedad(propiedadId: string): Observable<ApiResponseWithStats<Cita>> {
    return this.getAll({ propiedad_id: propiedadId });
  }

  // 🔥 OBTENER CITAS DEL DÍA
  getCitasDelDia(fecha?: string): Observable<Cita[]> {
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];
    return this.filtrarPorFecha(fechaConsulta, fechaConsulta)
      .pipe(
        map(response => response.data || [])
      );
  }

  // 🔥 OBTENER CITAS DE LA SEMANA
  getCitasDeLaSemana(): Observable<Cita[]> {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    return this.filtrarPorFecha(
      inicioSemana.toISOString().split('T')[0],
      finSemana.toISOString().split('T')[0]
    ).pipe(
      map(response => response.data || [])
    );
  }

  // 🔥 FORMATEAR CITA PARA MOSTRAR
  formatearCita(cita: Cita): any {
    const fields = cita.fields;

    return {
      id: cita.id,
      propiedad_id: fields.Propiedad ? fields.Propiedad[0] : null,
      cliente_id: fields.Cliente ? fields.Cliente[0] : null,
      fecha_hora: fields['Fecha y Hora'],
      fecha_formateada: this.apiService.formatDateForDisplay(fields['Fecha y Hora']),
      estado: fields.Estado,
      comentarios: fields.Comentarios || '',
      es_hoy: this.esHoy(fields['Fecha y Hora']),
      es_pasada: this.esPasada(fields['Fecha y Hora']),
      es_proxima: this.esProxima(fields['Fecha y Hora'])
    };
  }

  // 🔥 VALIDAR DATOS DE CITA
  validarDatosCita(datos: CitaFormData): string[] {
    const errores: string[] = [];

    if (!datos.propiedad_id) {
      errores.push('Debe seleccionar una propiedad');
    }

    if (!datos.cliente_id) {
      errores.push('Debe seleccionar un cliente');
    }

    if (!datos.fecha_hora) {
      errores.push('Debe seleccionar fecha y hora');
    } else {
      const fechaCita = new Date(datos.fecha_hora);
      const ahora = new Date();

      if (fechaCita <= ahora) {
        errores.push('La fecha debe ser posterior a la actual');
      }

      // Verificar horario laboral (8:00 - 20:00)
      const hora = fechaCita.getHours();
      if (hora < 8 || hora > 20) {
        errores.push('Las citas solo pueden programarse entre 8:00 y 20:00');
      }

      // Verificar que no sea domingo
      if (fechaCita.getDay() === 0) {
        errores.push('No se pueden programar citas los domingos');
      }
    }

    if (datos.comentarios && datos.comentarios.length > 500) {
      errores.push('Los comentarios no pueden superar los 500 caracteres');
    }

    return errores;
  }

  // 🔥 VALIDAR SOLICITUD DE CITA PÚBLICA
  validarSolicitudCita(datos: SolicitudCitaData): string[] {
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

    if (!datos.fecha_preferida) {
      errores.push('Debe indicar una fecha preferida');
    } else {
      const fechaPreferida = new Date(datos.fecha_preferida);
      const ahora = new Date();

      if (fechaPreferida <= ahora) {
        errores.push('La fecha preferida debe ser posterior a la actual');
      }
    }

    if (datos.mensaje && datos.mensaje.length > 1000) {
      errores.push('El mensaje no puede superar los 1000 caracteres');
    }

    return errores;
  }

  // 🔥 OBTENER ESTADÍSTICAS DE CITAS
  obtenerEstadisticas(citas: Cita[]): any {
    const total = citas.length;
    const pendientes = citas.filter(c => c.fields.Estado === 'Pendiente').length;
    const confirmadas = citas.filter(c => c.fields.Estado === 'Confirmada').length;
    const realizadas = citas.filter(c => c.fields.Estado === 'Realizada').length;
    const canceladas = citas.filter(c => c.fields.Estado === 'Cancelada').length;

    // Citas por día de la semana
    const citasPorDia: { [key: string]: number } = {
      'Lunes': 0, 'Martes': 0, 'Miércoles': 0,
      'Jueves': 0, 'Viernes': 0, 'Sábado': 0
    };

    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    citas.forEach(cita => {
      const fecha = new Date(cita.fields['Fecha y Hora']);
      const dia = diasSemana[fecha.getDay()];
      if (dia !== 'Domingo') {
        citasPorDia[dia]++;
      }
    });

    // Tasa de conversión
    const tasaConfirmacion = total > 0 ? Math.round(((confirmadas + realizadas) / total) * 100) : 0;
    const tasaCancelacion = total > 0 ? Math.round((canceladas / total) * 100) : 0;

    return {
      total,
      pendientes,
      confirmadas,
      realizadas,
      canceladas,
      tasa_confirmacion: tasaConfirmacion,
      tasa_cancelacion: tasaCancelacion,
      citas_por_dia: citasPorDia,
      promedio_por_dia: total > 0 ? Math.round(total / 7) : 0
    };
  }

  // 🔥 UTILIDADES DE FECHAS
  private esHoy(fechaHora: string): boolean {
    const fecha = new Date(fechaHora);
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  }

  private esPasada(fechaHora: string): boolean {
    const fecha = new Date(fechaHora);
    const ahora = new Date();
    return fecha < ahora;
  }

  private esProxima(fechaHora: string): boolean {
    const fecha = new Date(fechaHora);
    const ahora = new Date();
    const unDia = 24 * 60 * 60 * 1000; // milliseconds en un día
    return fecha > ahora && fecha < new Date(ahora.getTime() + unDia);
  }

  // 🔥 OBTENER HORARIOS DISPONIBLES
  getHorariosDisponibles(fecha: string): string[] {
    const horarios: string[] = [];

    // Generar horarios de 8:00 a 20:00 cada hora
    for (let hora = 8; hora <= 20; hora++) {
      horarios.push(`${hora.toString().padStart(2, '0')}:00`);
      if (hora < 20) {
        horarios.push(`${hora.toString().padStart(2, '0')}:30`);
      }
    }

    return horarios;
  }

  // 🔥 EXPORTAR CITAS A CSV
  exportarCSV(citas: Cita[]): string {
    const headers = [
      'Fecha y Hora', 'Estado', 'Cliente ID', 'Propiedad ID', 'Comentarios'
    ];

    const rows = citas.map(cita => {
      const formatted = this.formatearCita(cita);
      return [
        formatted.fecha_formateada,
        formatted.estado,
        formatted.cliente_id || '',
        formatted.propiedad_id || '',
        formatted.comentarios
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // 🔥 DESCARGAR CSV
  descargarCSV(citas: Cita[], filename: string = 'citas.csv'): void {
    const csvContent = this.exportarCSV(citas);
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
