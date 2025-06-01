import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="fas fa-user-tie me-2"></i>Lista de Agentes</h2>
            <button class="btn btn-primary">
              <i class="fas fa-plus me-2"></i>Nuevo Agente
            </button>
          </div>

          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Funcionalidad en desarrollo...</strong>
            <p class="mb-0">Esta sección estará disponible próximamente.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }

    h2 {
      color: #2c3e50;
      font-weight: 600;
    }

    .alert {
      border-left: 4px solid #17a2b8;
    }
  `]
})
export class AgentListComponent {}
