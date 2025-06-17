import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component'; // 🔥 AÑADIR NAVBAR

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    NavbarComponent, // 🔥 AÑADIR NAVBAR AQUÍ
    FooterComponent
  ],
  template: `
    <div class="app-container">
      <!-- 🔥 NAVBAR GLOBAL -->
      <app-navbar></app-navbar>

      <!-- 📄 CONTENIDO PRINCIPAL -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- 🔥 FOOTER GLOBAL -->
      <app-footer></app-footer>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'TFGJOA102 - Sistema Inmobiliario';
}
