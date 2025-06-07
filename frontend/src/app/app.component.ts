import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    FooterComponent // ✅ SOLO AQUÍ
  ],
  template: `
    <div class="app-container">
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
