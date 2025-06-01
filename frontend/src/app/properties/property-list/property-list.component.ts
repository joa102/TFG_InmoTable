import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// 🔥 IMPORTAR ANGULAR MATERIAL
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// 🔥 IMPORTAR SERVICIOS
import { PropiedadesService } from '../../services/propiedades.service';
import { AuthService } from '../../services/auth.service';

// 🔥 INTERFACES
interface Propiedad {
  id: string;
  fields: {[key: string]: any};
}

interface PropiedadesFiltros {
  tipo?: string;
  zona?: string;
  precio_min?: number;
  precio_max?: number;
  habitaciones?: number;
  estado?: string;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

interface LoadingState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.scss']
})
export class PropertyListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new BehaviorSubject<string>('');

  // 📊 ESTADO DEL COMPONENTE
  loadingState: LoadingState = { loading: true, error: null, success: false };
  propiedades: Propiedad[] = [];
  propiedadesOriginales: Propiedad[] = [];
  propiedadesFiltradas: Propiedad[] = [];
  estadisticas: any = null;

  // 🔍 FILTROS Y BÚSQUEDA - SIN URL
  filtros: PropiedadesFiltros = {};
  terminoBusqueda = '';
  mostrarFiltros = false;

  // 📋 OPCIONES DE FILTROS
  tiposDisponibles: string[] = [];
  zonasDisponibles: string[] = [];

  // 🔥 Precios vacíos por defecto
  precioMin: number | null = null;
  precioMax: number | null = null;
  rangoPrecios = { min: 0, max: 1000000 };

  // 📄 PAGINACIÓN Y ORDENAMIENTO
  paginaActual = 1;
  elementosPorPagina = 12;
  totalElementos = 0;
  ordenActual = { campo: 'Precio', direccion: 'desc' as 'asc' | 'desc' };

  // 🎨 VISTA
  vistaActual: 'grid' | 'list' = 'grid';

  constructor(
    private propiedadesService: PropiedadesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadProperties();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 🔍 CONFIGURAR BÚSQUEDA CON DEBOUNCE
  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(termino => {
      this.filtros.search = termino;
      this.aplicarFiltrosLocales();
    });
  }

  // 📊 CARGAR PROPIEDADES (SIN FILTROS)
  loadProperties(): void {
    this.loadingState = { loading: true, error: null, success: false };

    // 🔥 CARGAR TODAS las propiedades sin filtros del servidor
    this.propiedadesService.getAll({})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.propiedadesOriginales = response.data || [];
            this.propiedades = [...this.propiedadesOriginales];
            this.estadisticas = response.estadisticas;

            this.setupFilterOptions();
            this.aplicarFiltrosLocales(); // Aplicar filtros localmente
            this.loadingState = { loading: false, error: null, success: true };
          } else {
            this.handleError('Error al cargar las propiedades');
          }
        },
        error: (error: any) => {
          console.error('Error al cargar propiedades:', error);
          this.handleError('Error de conexión al cargar las propiedades');
        }
      });
  }

  // ⚙️ CONFIGURAR OPCIONES DE FILTROS
  private setupFilterOptions(): void {
    if (this.propiedadesOriginales.length > 0) {
      // Tipos únicos
      const tipos = new Set<string>();
      this.propiedadesOriginales.forEach(p => {
        const tipo = p.fields['Tipo'];
        if (tipo) tipos.add(tipo);
      });
      this.tiposDisponibles = Array.from(tipos);

      // Zonas únicas
      const zonas = new Set<string>();
      this.propiedadesOriginales.forEach(p => {
        const zona = p.fields['Zona'] || p.fields['Ubicación'];
        if (zona) zonas.add(zona);
      });
      this.zonasDisponibles = Array.from(zonas);

      // Calcular rango de precios
      const precios = this.propiedadesOriginales
        .map(p => p.fields['Precio'])
        .filter(p => p && !isNaN(p))
        .map(p => Number(p));

      if (precios.length > 0) {
        this.rangoPrecios = {
          min: Math.min(...precios),
          max: Math.max(...precios)
        };
      }
    }
  }

  // 🔥 NUEVO: Aplicar filtros localmente (sin URL)
  private aplicarFiltrosLocales(): void {
    let propiedadesFiltradas = [...this.propiedadesOriginales];

    // Filtro por búsqueda
    if (this.filtros.search && this.filtros.search.trim()) {
      const termino = this.filtros.search.toLowerCase().trim();
      propiedadesFiltradas = propiedadesFiltradas.filter(p => {
        const titulo = (p.fields['Título'] || p.fields['Titulo'] || '').toLowerCase();
        const descripcion = (p.fields['Descripción'] || p.fields['Descripcion'] || '').toLowerCase();
        const ubicacion = (p.fields['Ubicación'] || p.fields['Zona'] || '').toLowerCase();

        return titulo.includes(termino) ||
               descripcion.includes(termino) ||
               ubicacion.includes(termino);
      });
    }

    // Filtro por tipo
    if (this.filtros.tipo && this.filtros.tipo.trim()) {
      propiedadesFiltradas = propiedadesFiltradas.filter(p =>
        p.fields['Tipo'] === this.filtros.tipo
      );
    }

    // Filtro por zona
    if (this.filtros.zona && this.filtros.zona.trim()) {
      propiedadesFiltradas = propiedadesFiltradas.filter(p =>
        (p.fields['Zona'] || p.fields['Ubicación']) === this.filtros.zona
      );
    }

    // Filtro por habitaciones
    if (this.filtros.habitaciones) {
      propiedadesFiltradas = propiedadesFiltradas.filter(p => {
        const habitaciones = p.fields['Habitaciones'] || p.fields['Dormitorios'];
        return habitaciones && Number(habitaciones) >= this.filtros.habitaciones!;
      });
    }

    // Filtro por precio mínimo
    if (this.filtros.precio_min !== undefined && this.filtros.precio_min !== null) {
      propiedadesFiltradas = propiedadesFiltradas.filter(p => {
        const precio = Number(p.fields['Precio']);
        return precio && precio >= this.filtros.precio_min!;
      });
    }

    // Filtro por precio máximo
    if (this.filtros.precio_max !== undefined && this.filtros.precio_max !== null) {
      propiedadesFiltradas = propiedadesFiltradas.filter(p => {
        const precio = Number(p.fields['Precio']);
        return precio && precio <= this.filtros.precio_max!;
      });
    }

    // Aplicar ordenamiento
    if (this.filtros.sort_by) {
      propiedadesFiltradas.sort((a, b) => {
        let valorA = a.fields[this.filtros.sort_by!];
        let valorB = b.fields[this.filtros.sort_by!];

        // Convertir a números si es precio
        if (this.filtros.sort_by === 'Precio') {
          valorA = Number(valorA) || 0;
          valorB = Number(valorB) || 0;
        }

        if (this.filtros.sort_direction === 'asc') {
          return valorA > valorB ? 1 : -1;
        } else {
          return valorA < valorB ? 1 : -1;
        }
      });
    }

    this.propiedades = propiedadesFiltradas;
    this.totalElementos = this.propiedades.length;
    this.paginaActual = 1; // Resetear paginación
  }

  // 🔄 MÉTODOS DE FILTRADO (SIN URL)
  onSearchChange(termino: string): void {
    this.terminoBusqueda = termino;
    this.searchSubject.next(termino);
  }

  aplicarFiltros(): void {
    // 🔥 Solo aplicar filtros localmente, SIN modificar URL
    this.aplicarFiltrosLocales();
  }

  // 🔥 LIMPIAR FILTROS COMPLETAMENTE
  limpiarFiltros(): void {
    this.filtros = {};
    this.terminoBusqueda = '';
    this.precioMin = null;
    this.precioMax = null;
    this.searchSubject.next('');

    // 🔥 NO modificar URL, solo limpiar filtros locales
    this.aplicarFiltrosLocales();
  }

  // 🏷️ FILTROS ESPECÍFICOS
  filtrarPorTipo(tipo: string): void {
    this.filtros.tipo = tipo;
    this.aplicarFiltros();
  }

  filtrarPorZona(zona: string): void {
    this.filtros.zona = zona;
    this.aplicarFiltros();
  }

  // 🔥 FILTRAR POR PRECIO
  filtrarPorPrecio(): void {
    if (this.precioMin !== null && !isNaN(this.precioMin) && this.precioMin >= 0) {
      this.filtros.precio_min = this.precioMin;
    } else {
      delete this.filtros.precio_min;
    }

    if (this.precioMax !== null && !isNaN(this.precioMax) && this.precioMax > 0) {
      this.filtros.precio_max = this.precioMax;
    } else {
      delete this.filtros.precio_max;
    }

    this.aplicarFiltros();
  }

  // 📊 ORDENAMIENTO
  ordenarPor(campo: string): void {
    if (this.ordenActual.campo === campo) {
      this.ordenActual.direccion = this.ordenActual.direccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenActual.campo = campo;
      this.ordenActual.direccion = 'desc';
    }

    this.filtros.sort_by = campo;
    this.filtros.sort_direction = this.ordenActual.direccion;
    this.aplicarFiltros();
  }

  // 🎨 VISTA
  cambiarVista(vista: 'grid' | 'list'): void {
    this.vistaActual = vista;
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  // 🔗 NAVEGACIÓN
  verDetalle(propiedad: Propiedad): void {
    this.router.navigate(['/propiedades', propiedad.id]);
  }

  editarPropiedad(propiedad: Propiedad): void {
    if (this.canEditProperties) {
      this.router.navigate(['/propiedades', propiedad.id, 'editar']);
    }
  }

  nuevaPropiedad(): void {
    if (this.canEditProperties) {
      this.router.navigate(['/propiedades/nueva']);
    }
  }

  goToCreate(): void {
    if (this.canEditProperties) {
      this.router.navigate(['/propiedades/crear']);
    }
  }

  // 💖 ACCIONES
  solicitarCita(propiedad: Propiedad): void {
    this.router.navigate(['/citas/solicitar'], {
      queryParams: { propiedad_id: propiedad.id }
    });
  }

  contactarPropiedad(propiedad: Propiedad): void {
    this.router.navigate(['/contacto'], {
      queryParams: { propiedad_id: propiedad.id }
    });
  }

  // 🛠️ UTILIDADES
  private handleError(message: string): void {
    this.loadingState = { loading: false, error: message, success: false };
  }

  formatearPropiedad(propiedad: Propiedad): any {
    return {
      titulo: propiedad.fields['Título'] || propiedad.fields['Titulo'] || 'Sin título',
      precio: this.formatPrice(propiedad.fields['Precio']),
      direccion: propiedad.fields['Dirección'] || propiedad.fields['Direccion'] || propiedad.fields['Ubicación'] || 'Sin dirección',
      habitaciones: propiedad.fields['Habitaciones'] || propiedad.fields['Dormitorios'],
      banos: propiedad.fields['Baños'] || propiedad.fields['Banos'],
      superficie: propiedad.fields['Superficie'] || 0
    };
  }

  private formatPrice(precio: any): string {
    if (!precio || isNaN(precio)) return 'Consultar precio';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(precio));
  }

  // 🔐 PERMISOS
  get canEditProperties(): boolean {
    return this.authService.isAuthenticated &&
           (this.authService.hasRole('admin') || this.authService.hasRole('agent'));
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated;
  }

  // 📄 PAGINACIÓN
  get propiedadesPaginadas(): Propiedad[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.propiedades.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.propiedades.length / this.elementosPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // 📊 GETTERS
  get hayResultados(): boolean {
    return this.propiedades.length > 0;
  }

  get hayFiltrosActivos(): boolean {
    return Object.values(this.filtros).some(valor =>
      valor !== undefined && valor !== null && valor !== ''
    ) || this.precioMin !== null || this.precioMax !== null;
  }

  get mensajeResultados(): string {
    if (this.loadingState.loading) return 'Cargando propiedades...';
    if (this.loadingState.error) return this.loadingState.error;
    if (!this.hayResultados) {
      return this.hayFiltrosActivos ?
        'No se encontraron propiedades con los filtros aplicados' :
        'No hay propiedades disponibles';
    }
    return `Se encontraron ${this.propiedades.length} propiedades`;
  }
}
