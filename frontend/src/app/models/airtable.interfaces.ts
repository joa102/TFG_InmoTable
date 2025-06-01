// ✅ MANTENER TODO LO QUE YA FUNCIONABA
export interface AirtableResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

// ✅ INTERFACES PARA ATTACHMENTS DE AIRTABLE
export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  thumbnails?: {
    small: {
      url: string;
      width: number;
      height: number;
    };
    large: {
      url: string;
      width: number;
      height: number;
    };
    full: {
      url: string;
      width: number;
      height: number;
    };
  };
}

// ✅ CAMPOS DE UNA PROPIEDAD EN AIRTABLE
export interface PropiedadFields {
  'Título': string;
  'Descripción': string;
  'Precio': number;
  'Tipo': string;
  'Estado': string;
  'Dirección': string;
  'Superficie': number;
  'Habitaciones': number;
  'Baños': number;
  'Año Construcción': number;
  'Imágenes': AirtableAttachment[];
  'Fecha de Registro': string;
  'Agente Responsable': string[];
  'Número de visitas': number;
  'Coordenadas (Lat, Lng)': string;

  // ✅ AGREGAR SOLO LOS CAMPOS ENERGÉTICOS (SIN ROMPER NADA)
  'Clasificación Energética'?: string;
  'Consumo Energía'?: number;
  'Consumo CO2'?: number;
  'Consumo de Energía'?: number;
  'Consumo CO₂'?: number;
  'Emisiones CO2'?: number;
  'Rating Energético'?: string;
  'Eficiencia Energética'?: string;
}

// ✅ MANTENER LA DEFINICIÓN ORIGINAL
export type Propiedad = AirtableRecord<PropiedadFields>;

// ✅ FILTROS PARA BÚSQUEDA (FUTURO USO)
export interface PropertyFilters {
  tipo?: string;
  precioMin?: number;
  precioMax?: number;
  habitaciones?: number;
  estado?: string;
  superficie?: number;
  // ✅ AGREGAR LOS CAMPOS QUE USA EL SERVICE
  zona?: string;
  superficieMin?: number;
  superficieMax?: number;
  banos?: number;
}

// ✅ OPCIONES DE ORDENACIÓN (FUTURO USO)
export interface PropertySort {
  field: keyof PropiedadFields;
  direction: 'asc' | 'desc';
}

// ✅ RESPUESTA DE LISTA DE PROPIEDADES
export interface PropertyListResponse {
  success: boolean;
  data: Propiedad[];
  total: number;
  message?: string;
}

export interface PropertyDetailResponse {
  success: boolean;
  data: Propiedad;
  message?: string;
}
