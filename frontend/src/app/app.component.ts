import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule
  ],
  template: `
    <div class="app-container">
      <!-- 🔝 HEADER/NAVBAR aquí si tienes -->

      <!-- 📄 CONTENIDO PRINCIPAL -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- 🔻 FOOTER aquí si tienes -->
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'TFGJOA102 - Sistema Inmobiliario';
}
