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
import { EmpresaService } from './app/services/empresa.service';
import { ImageService } from './app/services/image.service';
import { CacheService } from './app/services/cache.service'; // 🔥 AÑADIR CACHE SERVICE

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
    CitasService,
    EmpresaService,
    ImageService,
    CacheService // 🔥 AÑADIR CACHE SERVICE
  ]
}).catch(err => console.error(err));
