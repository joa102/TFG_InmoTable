import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PropertyListComponent } from './property-list/property-list.component';
import { PropertyFormComponent } from './property-form/property-form.component';
import { PropertyDetailComponent } from './property-detail/property-detail.component';



@NgModule({
  declarations: [
    //PropertyListComponent,
    //PropertyFormComponent,
    //PropertyDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PropertyListComponent,
    PropertyFormComponent,
    PropertyDetailComponent
  ]
})
export class PropertiesModule { }
