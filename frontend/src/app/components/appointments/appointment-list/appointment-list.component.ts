import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss'
})
export class AppointmentListComponent implements OnInit, OnDestroy {

  // 🔥 PROPIEDADES PARA MANEJAR LA URL DEL IFRAME
  airtableBaseUrl = 'https://airtable.com/embed/apphONbM2nnoZThgr/pagtZbDsnocCqMAzm/form';
  iframeUrl: SafeResourceUrl = '';
  propertyRecordId: string | null = null;
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.propertyRecordId = params['propertyRecordId'] || null;
        this.buildIframeUrl();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Construir URL del iframe con parámetros
   */
  private buildIframeUrl(): void {
    let url = this.airtableBaseUrl;
    const params = new URLSearchParams();

    // Agregar ID de propiedad si existe
    if (this.propertyRecordId) {
      params.append('prefill_Propiedad', this.propertyRecordId);
      params.append('hide_Propiedad', 'true');
    }

    // Parámetros adicionales
    params.append('prefill_Cliente', 'recDmY1oJL8wNTO9q');
    params.append('hide_Cliente', 'true');
    params.append('hide_Estado', 'true');

    // Construir URL final
    if (params.toString()) {
      url += '?' + params.toString();
    }

    // Sanitizar URL para Angular
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.loading = false;
  }

  /**
   * Volver a propiedades
   */
  goBack(): void {
    this.router.navigate(['/propiedades']);
  }

  /**
   * Ir a una propiedad específica
   */
  goToProperty(): void {
    if (this.propertyRecordId) {
      // Aquí deberías tener el ID real de la propiedad, no el record ID
      // Por ahora navegamos a la lista
      this.router.navigate(['/propiedades']);
    }
  }
}

/*import { Component } from '@angular/core';

@Component({
  selector: 'app-appointment-list',
  imports: [],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.scss'
})
export class AppointmentListComponent {

}*/


/*import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="fas fa-calendar-alt me-2"></i>Lista de Citas</h2>
            <button class="btn btn-primary">
              <i class="fas fa-plus me-2"></i>Nueva Cita
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
export class AppointmentListComponent {}*/
