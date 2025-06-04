import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// 🔥 IMPORTAR SERVICIOS Y TIPOS
import { PropiedadesService } from '../../services/propiedades.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  // 📊 ESTADO DEL COMPONENTE
  loading = true;
  error: string | null = null;
  logoutLoading = false;

  // 🔐 USUARIO AUTENTICADO
  currentUser: User | null = null;
  isAdmin = false;
  isAgent = false;
  isClient = false;

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

  private destroy$ = new Subject<void>();

  constructor(
    private propiedadesService: PropiedadesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeUserData();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 🔐 Inicializar datos del usuario
   */
  private initializeUserData(): void {
    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.isAdmin = this.authService.isAdmin;
        this.isAgent = this.authService.isAgent;
        this.isClient = this.authService.isClient;

        console.log('👤 Usuario actual en Dashboard:', {
          usuario: user?.nombre,
          email: user?.email,
          rol: user?.rol,
          recordId: user?.recordId,
          ultimoLogin: user?.ultimoLogin
        });
      });
  }

  /**
   * 🚪 Cerrar sesión
   */
  logout(): void {
    if (this.logoutLoading) return;

    this.logoutLoading = true;
    console.log('🚪 Iniciando logout desde Dashboard...');

    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Logout exitoso:', response);
          // El AuthService ya maneja la redirección
        },
        error: (error) => {
          console.error('❌ Error en logout:', error);
          this.logoutLoading = false;
        }
      });
  }

  /**
   * 📊 Cargar datos del dashboard
   */
  private async loadDashboardData(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;

      console.log('📊 Cargando datos del dashboard para:', this.currentUser?.nombre);

      // 🔄 Cargar propiedades reales
      await this.loadPropertiesData();

      // 📊 Cargar datos simulados
      this.loadMockData();

    } catch (error) {
      console.error('❌ Error al cargar datos del dashboard:', error);
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
      console.log('🏠 Cargando propiedades...');
      
      this.propiedadesService.getAll().subscribe({
        next: (response) => {
          if (response?.success && response.data) {
            this.totalPropiedades = response.data.length;
            console.log('✅ Propiedades cargadas:', this.totalPropiedades);

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
          console.warn('⚠️ Error al cargar propiedades, usando datos mock:', error);
          this.loadMockPropertiesData();
        }
      });
    } catch (error) {
      console.warn('⚠️ Error al cargar propiedades, usando datos mock:', error);
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

    console.log('📊 Propiedades por tipo procesadas:', this.propiedadesPorTipo);
  }

  /**
   * 🏠 Datos simulados de propiedades
   */
  private loadMockPropertiesData(): void {
    console.log('🎭 Cargando datos mock de propiedades...');
    
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
    console.log('🎭 Cargando datos mock generales...');

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

    console.log('✅ Datos mock cargados correctamente');
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
    console.log('🔗 Navegando a propiedad:', propertyId);
    this.router.navigate(['/propiedades', propertyId]);
  }

  /**
   * 🔄 Recargar datos
   */
  refreshData(): void {
    console.log('🔄 Recargando datos del dashboard...');
    this.loadDashboardData();
  }

  /**
   * ⏰ Formatear tiempo desde último login
   */
  getTimeSinceLastLogin(): string {
    if (!this.currentUser?.ultimoLogin) {
      return 'Primer inicio de sesión';
    }

    const lastLogin = new Date(this.currentUser.ultimoLogin);
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Hace menos de 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  }

  /**
   * 🎨 Obtener clase CSS del rol
   */
  getRoleClass(): string {
    switch (this.currentUser?.rol) {
      case 'admin': return 'text-danger';
      case 'agente': return 'text-success';
      case 'cliente': return 'text-info';
      default: return 'text-secondary';
    }
  }

  /**
   * 🏷️ Obtener etiqueta del rol
   */
  getRoleLabel(): string {
    switch (this.currentUser?.rol) {
      case 'admin': return 'Administrador';
      case 'agente': return 'Agente Inmobiliario';
      case 'cliente': return 'Cliente';
      default: return 'Usuario';
    }
  }
}
