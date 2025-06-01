export interface PropertyFilters {
  searchText?: string;
  precioMin?: number;
  precioMax?: number;
  tipo?: string;
  ubicacion?: string;
  superficieMin?: number;
  superficieMax?: number;
  habitaciones?: number;
  banos?: number;
  clasificacionEnergetica?: string;
  estado?: string;
}

export interface PropertySort {
  field: 'Precio' | 'Superficie' | 'Fecha de Registro' | 'Habitaciones';
  direction: 'asc' | 'desc';
}

export interface PropertyViewMode {
  mode: 'grid' | 'list';
  itemsPerPage: number;
}

export interface PropertyListState {
  filters: PropertyFilters;
  sort: PropertySort;
  viewMode: PropertyViewMode;
  currentPage: number;
  totalItems: number;
}