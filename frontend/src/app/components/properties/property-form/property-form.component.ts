import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PropiedadesService } from '../../../services/propiedades.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-property-form',
  templateUrl: './property-form.component.html',
  styleUrls: ['./property-form.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class PropertyFormComponent implements OnInit {
  property = {
    titulo: '',
    descripcion: '',
    precio: 0,
    estado: 'Disponible',
  };
  editing = false;
  id: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropiedadesService
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.editing = true;
      this.propertyService.getProperty(this.id).subscribe((resp) => {
        if (resp && resp.fields) {
          this.property = {
            titulo: resp.fields['Título'] || '',
            descripcion: resp.fields['Descripción'] || '',
            precio: resp.fields['Precio'] || 0,
            estado: resp.fields['Estado'] || 'Disponible',
          };
        }
      });
    }
  }

  onSubmit() {
    if (this.editing && this.id) {
      this.propertyService.updateProperty(this.id, this.property).subscribe(
        () => {
          alert('Propiedad actualizada correctamente.');
          this.router.navigate(['/propiedades']);
        },
        (error) => {
          alert('Error al actualizar la propiedad.');
          console.error(error);
        }
      );
    } else {
      this.propertyService.createProperty(this.property).subscribe(
        () => {
          alert('Propiedad añadida correctamente.');
          this.router.navigate(['/propiedades']);
        },
        (error) => {
          alert('Error al añadir la propiedad.');
          console.error(error);
        }
      );
    }
  }
  /*onSubmit() {
    if (this.editing && this.id) {
      this.propertyService.updateProperty(this.id, this.property).subscribe(() => {
        this.router.navigate(['/propiedades']);
      });
    } else {
      this.propertyService.createProperty(this.property).subscribe(() => {
        this.router.navigate(['/propiedades']);
      });
    }
  }*/
}
