import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// 🔥 IMPORTAR SERVICIO CORRECTO
import { PropiedadesService } from '../../services/propiedades.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  // 📊 ESTADO DEL COMPONENTE
  loading = true;
  error: string | null = null;

  // 📈 ESTADÍSTICAS
  totalPropiedades = 0;
  totalClientes = 0;
  totalCitas = 0;
  totalAgentes = 0;

  // 📊 DATOS PARA GRÁFICOS
  citasPorEstado: Array<{label: string, value: number, color: string}> = [];
  propiedadesPorTipo: Array<{label: string, value: number, color: string}> = [];

  // 📋 LISTAS
  citasProximas: any[] = [];
  propiedadesDestacadas: any[] = [];

  // 🔐 PERMISOS (simulados por ahora)
  isAdmin = true;
  isAgent = false;
  isClient = false;

  constructor(
    private propiedadesService: PropiedadesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * 📊 Cargar datos del dashboard
   */
  private async loadDashboardData(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      // 🔄 Cargar propiedades reales
      await this.loadPropertiesData();

      // 📊 Cargar datos simulados
      this.loadMockData();

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      this.error = 'Error al cargar los datos del dashboard';
    } finally {
      this.loading = false;
    }
  }

  /**
   * 🏠 Cargar datos de propiedades
   */
  private async loadPropertiesData(): Promise<void> {
    try {
      // 🔥 USAR MÉTODO CORRECTO
      this.propiedadesService.getAll().subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            this.totalPropiedades = response.data.length;

            // 🏠 Procesar propiedades destacadas
            this.propiedadesDestacadas = response.data
              .slice(0, 4)
              .map((p: any) => ({
                id: p.id,
                fields: {
                  'Titulo': p.fields['Título'] || p.fields['Titulo'] || 'Sin titulo',
                  'Precio': p.fields['Precio'] || 0,
                  'Descripcion': p.fields['Descripción'] || p.fields['Descripcion'] || 'Sin descripcion',
                  'Superficie': p.fields['Superficie'] || 0
                }
              }));

            // 📊 Procesar por tipo
            this.processPropiedadesPorTipo(response.data);
          }
        },
        error: (error) => {
          console.error('Error al cargar propiedades:', error);
          this.loadMockPropertiesData();
        }
      });
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      this.loadMockPropertiesData();
    }
  }

  /**
   * 📊 Procesar propiedades por tipo
   */
  private processPropiedadesPorTipo(propiedades: any[]): void {
    const tipos: {[key: string]: number} = {};

    propiedades.forEach((propiedad: any) => {
      const tipo = propiedad.fields['Tipo'] || 'Otros';
      tipos[tipo] = (tipos[tipo] || 0) + 1;
    });

    const colores = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    this.propiedadesPorTipo = Object.entries(tipos)
      .map(([tipo, cantidad], index) => ({
        label: tipo,
        value: cantidad,
        color: colores[index % colores.length]
      }));
  }

  /**
   * 🏠 Datos simulados de propiedades
   */
  private loadMockPropertiesData(): void {
    this.totalPropiedades = 12;

    this.propiedadesDestacadas = [
      {
        id: '1',
        fields: {
          'Titulo': 'Casa moderna en centro',
          'Precio': 250000,
          'Descripcion': 'Hermosa casa con 3 habitaciones',
          'Superficie': 120
        }
      },
      {
        id: '2',
        fields: {
          'Titulo': 'Apartamento vista al mar',
          'Precio': 180000,
          'Descripcion': 'Apartamento con vista panoramica',
          'Superficie': 85
        }
      }
    ];

    this.propiedadesPorTipo = [
      { label: 'Casa', value: 5, color: '#3b82f6' },
      { label: 'Apartamento', value: 4, color: '#ef4444' },
      { label: 'Local', value: 3, color: '#10b981' }
    ];
  }

  /**
   * 📊 Cargar datos simulados
   */
  private loadMockData(): void {
    // 👥 Clientes
    this.totalClientes = 45;

    // 📅 Citas
    this.totalCitas = 23;
    this.citasPorEstado = [
      { label: 'Pendientes', value: 12, color: '#f59e0b' },
      { label: 'Confirmadas', value: 8, color: '#10b981' },
      { label: 'Realizadas', value: 15, color: '#3b82f6' },
      { label: 'Canceladas', value: 3, color: '#ef4444' }
    ];

    // 🏢 Agentes
    this.totalAgentes = 8;

    // 📅 Citas próximas
    this.citasProximas = [
      {
        id: '1',
        fields: {
          'Fecha y Hora': new Date(Date.now() + 86400000).toISOString(),
          'Estado': 'Confirmada'
        }
      },
      {
        id: '2',
        fields: {
          'Fecha y Hora': new Date(Date.now() + 172800000).toISOString(),
          'Estado': 'Pendiente'
        }
      }
    ];
  }

  /**
   * 🎨 Obtener clase CSS para badge
   */
  getEstadoBadgeClass(estado: string): string {
    if (!estado) return 'secondary';

    switch (estado.toLowerCase()) {
      case 'confirmada':
      case 'realizada':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'cancelada':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * 🔗 Navegar a propiedad
   */
  navigateToProperty(propertyId: string): void {
    this.router.navigate(['/propiedades', propertyId]);
  }

  /**
   * 🔄 Recargar datos
   */
  refreshData(): void {
    this.loadDashboardData();
  }
}
