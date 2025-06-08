import { Routes } from '@angular/router';

export const routes: Routes = [
  // Ruta pública: Home y propiedades
  {
    path: '',
    loadComponent: () => import('./components/properties/property-list/property-list.component')
      .then(c => c.PropertyListComponent)
  },
  {
    path: 'propiedades',
    loadComponent: () => import('./components/properties/property-list/property-list.component')
      .then(c => c.PropertyListComponent)
  },
  {
    path: 'propiedades/:id',
    loadComponent: () => import('./components/properties/property-detail/property-detail.component')
      .then(c => c.PropertyDetailComponent)
  },

  // 🔥 AÑADIR RUTA DE CONTACTO
  {
    path: 'contacto',
    loadComponent: () => import('./shared/components/contact/contact.component')
      .then(c => c.ContactComponent),
    title: 'Contacto - InmoTable'
  },

  // Dashboard (área protegida)
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component')
      .then(c => c.DashboardComponent)
  },

  // Gestión de entidades - RUTAS CORREGIDAS 🔥
  {
    path: 'clientes',
    loadComponent: () => import('./components/clients/client-list/client-list.component')
      .then(c => c.ClientListComponent)
  },
  {
    path: 'agentes',
    loadComponent: () => import('./components/agents/agent-list/agent-list.component')
      .then(c => c.AgentListComponent)
  },
  {
    path: 'citas',
    loadComponent: () => import('./components/appointments/appointment-form/appointment-form.component') // 🔥 CAMBIAR PATH
      .then(c => c.AppointmentFormComponent), // 🔥 CAMBIAR NOMBRE DE CLASE
    title: 'Formulario de Cita - InmoTable' // 🔥 ACTUALIZAR TÍTULO
  },
  {
    path: 'calendario',
    loadComponent: () => import('./components/appointments/appointment-calendar/appointment-calendar.component')
      .then(c => c.AppointmentCalendarComponent)
  },

  // Autenticación
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(r => r.authRoutes)
  },

  // Página no encontrada - RUTA CORREGIDA 🔥
  {
    path: '404',
    loadComponent: () => import('./shared/components/not-found/not-found.component')
      .then(c => c.NotFoundComponent)
  },
  {
    path: '**',
    redirectTo: '404'
  }
];
