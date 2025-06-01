import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

// 🔥 SERVICIOS
import { ApiService } from './app/services/api.service';
import { AuthService } from './app/services/auth.service';
import { PropiedadesService } from './app/services/propiedades.service';
import { ClientesService } from './app/services/clientes.service';
import { AgentesService } from './app/services/agentes.service';
import { CitasService } from './app/services/citas.service';

bootstrapApplication(AppComponent, {
  providers: [
    // 🔥 IMPORTAR MÓDULOS COMO PROVIDERS
    importProvidersFrom(
      HttpClientModule,
      RouterModule.forRoot(routes, {
        enableTracing: false, // Solo para desarrollo
        scrollPositionRestoration: 'top'
      }),
      BrowserAnimationsModule
    ),

    // 🔥 SERVICIOS GLOBALES
    ApiService,
    AuthService,
    PropiedadesService,
    ClientesService,
    AgentesService,
    CitasService
  ]
}).catch(err => console.error(err));
