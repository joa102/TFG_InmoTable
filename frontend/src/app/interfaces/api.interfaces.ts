// 🔥 RESPUESTA ESTÁNDAR DE LA API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any;
  error?: string;
}

// 🔥 RESPUESTA CON PAGINACIÓN
export interface ApiResponseWithStats<T> {
  success: boolean;
  message?: string;
  data: T[];
  estadisticas?: {
    total: number;
    filtros_aplicados?: any;
    disponibles?: number;
  };
  total?: number;
  errors?: any;
  error?: string;
}

// 🔥 USUARIO AUTENTICADO
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'cliente' | 'agente' | 'admin';
  airtable_id?: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// 🔥 RESPUESTA DE AUTENTICACIÓN
export interface AuthResponse {
  user: User;
  token: string;
  token_type: string;
  airtable_usuario_id?: string;
  airtable_cliente_id?: string;
}

// 🔥 DATOS DE REGISTRO
export interface RegisterData {
  nombre: string;
  email: string;
  password: string;
  password_confirmation: string;
  telefono: string;
}

// 🔥 DATOS DE LOGIN
export interface LoginData {
  email: string;
  password: string;
}

// 🔥 CAMPOS DE AIRTABLE (BASE)
export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: any;
}

// 🔥 PROPIEDAD
export interface Propiedad extends AirtableRecord {
  fields: {
    'ID Propiedad'?: string;
    'Título': string;
    'Descripción': string;
    'Precio': number;
    'Precio m2'?: number;
    'Tipo': 'Casa' | 'Apartamento' | 'Local' | 'Oficina' | 'Terreno';
    'Estado': 'Disponible' | 'Reservada' | 'Vendida' | 'Retirada';
    'Superficie': number;
    'Habitaciones'?: number;
    'Baños'?: number;
    'Dirección': string;
    'Coordenadas (Lat, Lng)'?: string;
    'Año Construcción'?: number;
    'Estado de Conservación'?: 'Excelente' | 'Bueno' | 'Regular' | 'A reformar';
    'Clasificación Energética'?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
    'Imágenes'?: string[];
    'Número de visitas'?: number;
    'Fecha de Registro'?: string;
    'Fecha de Venta'?: string;
  };
}

// 🔥 DATOS PARA CREAR/ACTUALIZAR PROPIEDAD
export interface PropiedadFormData {
  titulo: string;
  descripcion: string;
  precio: number;
  tipo: 'Casa' | 'Apartamento' | 'Local' | 'Oficina' | 'Terreno';
  superficie: number;
  habitaciones?: number;
  banos?: number;
  direccion: string;
  coordenadas?: string;
  año_construccion?: number;
  estado_conservacion?: 'Excelente' | 'Bueno' | 'Regular' | 'A reformar';
  clasificacion_energetica?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  imagenes?: string[];
  estado?: 'Disponible' | 'Reservada' | 'Vendida' | 'Retirada';
}

// 🔥 FILTROS DE BÚSQUEDA DE PROPIEDADES
export interface PropiedadesFiltros {
  tipo?: string;
  zona?: string;
  precio_min?: number;
  precio_max?: number;
  habitaciones?: number;
  superficie_min?: number;
  estado?: string;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// 🔥 CLIENTE
export interface Cliente extends AirtableRecord {
  fields: {
    'Nombre': string;
    'Email': string;
    'Teléfono': string;
    'Fecha de Registro'?: string;
    'Comentarios'?: string;
    'Estado'?: 'Activo' | 'Inactivo' | 'Suspendido';
    'Agente'?: string[];
    'InteresPropiedades'?: string[];
  };
}

// 🔥 DATOS PARA CREAR/ACTUALIZAR CLIENTE
export interface ClienteFormData {
  nombre: string;
  telefono: string;
  email: string;
  comentarios?: string;
  estado?: 'Activo' | 'Inactivo' | 'Suspendido';
  agente_id?: string;
}

// 🔥 AGENTE
export interface Agente extends AirtableRecord {
  fields: {
    'ID Agente'?: string;
    'Nombre': string;
    'Email': string;
    'Teléfono': string;
    'Zona asignada': string;
    'Estado': 'Activo' | 'Inactivo' | 'Vacaciones' | 'Suspendido';
  };
  estadisticas?: AgenteEstadisticas;
}

// 🔥 ESTADÍSTICAS DEL AGENTE
export interface AgenteEstadisticas {
  total_clientes: number;
  total_citas: number;
  citas_pendientes: number;
  citas_confirmadas: number;
  citas_realizadas: number;
  citas_canceladas: number;
  clientes_activos: number;
}

// 🔥 DATOS PARA CREAR/ACTUALIZAR AGENTE
export interface AgenteFormData {
  nombre: string;
  email: string;
  telefono: string;
  zona_asignada: string;
  estado?: 'Activo' | 'Inactivo' | 'Vacaciones' | 'Suspendido';
}

// 🔥 CITA
export interface Cita extends AirtableRecord {
  fields: {
    'Propiedad': string[];
    'Cliente': string[];
    'Fecha y Hora': string;
    'Estado': 'Pendiente' | 'Confirmada' | 'Realizada' | 'Cancelada';
    'Comentarios'?: string;
  };
}

// 🔥 DATOS PARA CREAR/ACTUALIZAR CITA
export interface CitaFormData {
  propiedad_id: string;
  cliente_id: string;
  fecha_hora: string;
  comentarios?: string;
  estado?: 'Pendiente' | 'Confirmada' | 'Realizada' | 'Cancelada';
}

// 🔥 SOLICITUD DE CITA PÚBLICA
export interface SolicitudCitaData {
  propiedad_id: string;
  nombre: string;
  email: string;
  telefono: string;
  fecha_preferida: string;
  mensaje?: string;
}

// 🔥 MENSAJE DE CONTACTO
export interface ContactoData {
  nombre: string;
  email: string;
  telefono?: string;
  mensaje: string;
  propiedad_id?: string;
}

// 🔥 OPCIONES DE BÚSQUEDA
export interface BusquedaFiltros {
  termino: string;
  campo?: 'nombre' | 'email' | 'telefono' | 'zona' | 'todos';
}

// 🔥 TIPOS DE ORDENAMIENTO
export type OrdenCampo = 'Nombre' | 'Fecha de Registro' | 'Precio' | 'Superficie' | 'Número de visitas';
export type OrdenDireccion = 'asc' | 'desc';

// 🔥 CONFIGURACIÓN DE PAGINACIÓN
export interface PaginacionConfig {
  page: number;
  per_page: number;
  total?: number;
  last_page?: number;
}

// 🔥 ESTADO DE CARGA
export interface LoadingState {
  loading: boolean;
  error?: string | null;
  success?: boolean;
}
