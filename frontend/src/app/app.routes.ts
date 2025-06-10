import { Routes } from '@angular/router';

export const routes: Routes = [
  // Ruta pública: Home y propiedades
  {
    path: '',
    loadComponent: () => import('./components/home/home.component')
      .then(c => c.HomeComponent),
    title: 'Inicio - InmoTable'
  },

  // Propiedades
  {
    path: 'propiedades',
    loadComponent: () => import('./components/properties/property-list/property-list.component')
      .then(c => c.PropertyListComponent),
    title: 'Propiedades - InmoTable'
  },
  {
    path: 'propiedades/:id',
    loadComponent: () => import('./components/properties/property-detail/property-detail.component')
      .then(c => c.PropertyDetailComponent)
  },

  // Contacto
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

  // Gestión de entidades
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
    loadComponent: () => import('./components/appointments/appointment-form/appointment-form.component')
      .then(c => c.AppointmentFormComponent),
    title: 'Formulario de Cita - InmoTable'
  },
  {
    path: 'calendario',
    loadComponent: () => import('./components/appointments/appointment-calendar/appointment-calendar.component')
      .then(c => c.AppointmentCalendarComponent)
  },

  // Mis propiedades interes
  {
    path: 'mis-propiedades-interes',
    loadComponent: () => import('./components/properties/property-list-interested/property-list-interested.component')
      .then(c => c.PropertyListInterestedComponent)
  },

  // Autenticación
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(r => r.authRoutes)
  },

  // 🏠 RUTA HOME ALTERNATIVA
  {
    path: 'inicio',
    redirectTo: '',
    pathMatch: 'full'
  },

  // Página no encontrada
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
