import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface EnergyRatingData {
  rating: string;
  consumoEnergia?: number;
  consumoCO2?: number;
}

@Component({
  selector: 'app-energy-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="energy-rating-container">
      <h6 class="energy-title">
        <i class="fas fa-leaf me-2"></i>
        Clasificación energética
      </h6>

      <div class="energy-chart">
        <!-- Escala de letras A-G -->
        <div class="energy-scale">
          <div *ngFor="let level of energyLevels"
               class="energy-level"
               [class]="'level-' + level.letter.toLowerCase()"
               [class.active]="level.letter === currentRating">
            <div class="energy-arrow">
              <span class="energy-letter">{{ level.letter }}</span>
              <span class="energy-label">{{ level.label }}</span>
            </div>
          </div>
        </div>

        <!-- Información de consumo -->
        <div class="energy-consumption" *ngIf="showConsumption && hasConsumptionData()">
          <h6 class="consumption-title">
            <i class="fas fa-chart-bar me-2"></i>
            Datos de consumo
          </h6>

          <!-- CONSUMO DE ENERGÍA -->
          <div class="consumption-item" *ngIf="data.consumoEnergia">
            <span class="consumption-label">
              <i class="fas fa-bolt me-2 text-warning"></i>
              Consumo de Energía
            </span>
            <span class="consumption-value">{{ data.consumoEnergia }} kWh/m² Año</span>
          </div>

          <!-- CONSUMO KG CO₂ -->
          <div class="consumption-item" *ngIf="data.consumoCO2">
            <span class="consumption-label">
              <i class="fas fa-globe me-2 text-success"></i>
              Consumo Kg CO<sub>2</sub>
            </span>
            <span class="consumption-value">{{ data.consumoCO2 }} kg/m² Año</span>
          </div>
        </div>
      </div>

      <!-- Indicador activo -->
      <div class="current-rating" *ngIf="currentRating">
        <div class="rating-badge" [class]="'badge-' + currentRating.toLowerCase()">
          <strong>{{ currentRating }}</strong>
          <span *ngIf="getRatingDescription(currentRating)">
            {{ getRatingDescription(currentRating) }}
          </span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./energy-rating.component.scss']
})
export class EnergyRatingComponent {
  @Input() data: EnergyRatingData = { rating: 'E' };
  @Input() showConsumption = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  energyLevels = [
    { letter: 'A', label: 'Muy eficiente', color: '#00a651' },
    { letter: 'B', label: 'Eficiente', color: '#4cb748' },
    { letter: 'C', label: 'Bastante eficiente', color: '#8bc441' },
    { letter: 'D', label: 'Poco eficiente', color: '#f9ec31' },
    { letter: 'E', label: 'Menos eficiente', color: '#f39c12' },
    { letter: 'F', label: 'Ineficiente', color: '#e67e22' },
    { letter: 'G', label: 'Muy ineficiente', color: '#e74c3c' }
  ];

  get currentRating(): string {
    return this.data.rating?.toUpperCase() || 'E';
  }

  getRatingDescription(rating: string): string {
    const level = this.energyLevels.find(l => l.letter === rating);
    return level?.label || '';
  }

  hasConsumptionData(): boolean {
    return !!(this.data.consumoEnergia || this.data.consumoCO2);
  }
}
