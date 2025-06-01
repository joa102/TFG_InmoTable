import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// 🔥 IMPORTAR SERVICIOS
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { PropiedadesService } from './services/propiedades.service';
import { ClientesService } from './services/clientes.service';
import { AgentesService } from './services/agentes.service';
import { CitasService } from './services/citas.service';

// 🔥 IMPORTAR COMPONENTES EXISTENTES
import { PropertyListComponent } from './properties/property-list/property-list.component';
import { PropertyFormComponent } from './properties/property-form/property-form.component';
import { PropertyDetailComponent } from './properties/property-detail/property-detail.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

// 🔥 IMPORTAR RUTAS STANDALONE
import { routes } from './app.routes';

@NgModule({
  declarations: [
    AppComponent,
    PropertyListComponent,
    PropertyDetailComponent,
    DashboardComponent
    // ...otros componentes existentes
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes, {
      enableTracing: false, // Solo para desarrollo
      scrollPositionRestoration: 'top'
    })
  ],
  providers: [
    // 🔥 REGISTRAR TODOS LOS SERVICIOS
    ApiService,
    AuthService,
    PropiedadesService,
    ClientesService,
    AgentesService,
    CitasService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
