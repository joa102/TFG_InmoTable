import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="not-found-icon">
          <i class="fas fa-home fa-6x"></i>
        </div>
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>La página que buscas no existe o ha sido movida.</p>
        <div class="not-found-actions">
          <a routerLink="/" class="btn btn-primary btn-lg me-3">
            <i class="fas fa-home me-2"></i>Volver al inicio
          </a>
          <a routerLink="/propiedades" class="btn btn-outline-primary btn-lg">
            <i class="fas fa-search me-2"></i>Ver propiedades
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .not-found-content {
      max-width: 600px;
      padding: 2rem;
    }

    .not-found-icon {
      margin-bottom: 2rem;
      opacity: 0.8;
    }

    .not-found-content h1 {
      font-size: 8rem;
      font-weight: bold;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .not-found-content h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      font-weight: 300;
    }

    .not-found-content p {
      font-size: 1.2rem;
      margin-bottom: 3rem;
      opacity: 0.9;
    }

    .not-found-actions {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .not-found-content h1 {
        font-size: 4rem;
      }

      .not-found-content h2 {
        font-size: 1.8rem;
      }

      .not-found-actions {
        flex-direction: column;
        align-items: center;
      }

      .btn {
        width: 100%;
        max-width: 300px;
      }
    }
  `]
})
export class NotFoundComponent {}
