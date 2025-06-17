import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, User } from '../../../services/auth.service';
import { UsuariosService, UsuarioUpdateData } from '../../../services/usuarios.service'; // 🔥 AÑADIR IMPORT

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnDestroy {

  // 🔥 FORMULARIO Y ESTADOS
  userForm!: FormGroup;
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  // 🔥 DATOS DEL USUARIO
  currentUser: User | null = null;
  originalUser: User | null = null;

  // 🔥 CONTROL DE CAMBIOS
  hasChanges = false;
  showPassword = false;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private usuariosService: UsuariosService // 🔥 AÑADIR SERVICIO
  ) {}

  ngOnInit(): void {
    this.checkAuthentication();
    this.initializeForm();
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * 🔐 Verificar autenticación
   */
  private checkAuthentication(): void {
    if (!this.authService.isAuthenticated) {
      console.warn('⚠️ Usuario no autenticado, redirigiendo al login');
      this.router.navigate(['/auth/login']);
      return;
    }
  }

  /**
   * 📝 Inicializar formulario
   */
  private initializeForm(): void {
    this.userForm = this.formBuilder.group({
      // 🔥 CAMPOS EDITABLES
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      telefono: ['', [Validators.required, Validators.pattern(/^[+]?[0-9\s\-()]+$/)]]
    });

    // 🔥 DETECTAR CAMBIOS EN EL FORMULARIO
    this.userForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasChanges = this.checkFormChanges();
        this.clearMessages();
      });
  }

  /**
   * 👤 Cargar datos del usuario
   */
  private loadUserData(): void {
    this.loading = true;

    this.authService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User | null) => {
          if (user) {
            this.currentUser = user;
            this.originalUser = { ...user }; // Copia para comparar cambios
            this.populateForm(user);
            console.log('✅ Datos del usuario cargados:', user);
          } else {
            this.error = 'No se pudo cargar la información del usuario';
            console.error('❌ No hay usuario disponible');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar usuario:', error);
          this.error = 'Error al cargar los datos del usuario';
          this.loading = false;
        }
      });
  }

  /**
   * 📋 Poblar formulario con datos del usuario
   */
  private populateForm(user: User): void {
    this.userForm.patchValue({
      email: user.email,
      password: user.password,
      nombre: user.nombre,
      telefono: user.telefono
    });

    // Marcar el formulario como pristine después de cargar datos
    this.userForm.markAsPristine();
    this.hasChanges = false;
  }

  /**
   * 🔄 Verificar si hay cambios en el formulario
   */
  private checkFormChanges(): boolean {
    if (!this.originalUser) return false;

    const formValues = this.userForm.value;

    return (
      formValues.email !== this.originalUser.email ||
      formValues.password !== this.originalUser.password ||
      formValues.nombre !== this.originalUser.nombre ||
      formValues.telefono !== this.originalUser.telefono
    );
  }

  /**
   * 💾 Guardar cambios - VERSIÓN REAL CON AIRTABLE
   */
  onSubmit(): void {
    this.clearMessages();

    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      this.error = 'Por favor, corrige los errores en el formulario';
      return;
    }

    if (!this.hasChanges) {
      this.success = 'No hay cambios para guardar';
      return;
    }

    this.saving = true;

    // 🔥 PREPARAR DATOS PARA ENVIAR AL BACKEND
    const formValues = this.userForm.value;
    const userData: UsuarioUpdateData = {
      email: formValues.email,
      password: formValues.password,
      nombre: formValues.nombre,
      telefono: formValues.telefono
    };

    console.log('💾 Guardando cambios en Airtable:', userData);

    // 🔥 LLAMADA REAL AL BACKEND
    this.usuariosService.updateCurrentUser(userData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          // 🔥 ACTUALIZAR REFERENCIAS LOCALES
          this.currentUser = updatedUser;
          this.originalUser = { ...updatedUser };
          this.hasChanges = false;
          this.userForm.markAsPristine();

          this.success = '✅ Perfil actualizado correctamente en Airtable';
          console.log('✅ Usuario actualizado en Airtable:', updatedUser);

          this.saving = false;
        },
        error: (error) => {
          console.error('❌ Error al guardar en Airtable:', error);

          // 🔥 MOSTRAR ERROR ESPECÍFICO
          if (error.status === 409) {
            this.error = 'El email ya está siendo usado por otro usuario';
          } else if (error.status === 422) {
            this.error = 'Datos inválidos. Revisa los campos del formulario';
          } else {
            this.error = error.message || 'Error al guardar los cambios. Inténtalo de nuevo.';
          }

          this.saving = false;
        }
      });
  }

  /**
   * ↩️ Descartar cambios
   */
  discardChanges(): void {
    if (this.originalUser) {
      this.populateForm(this.originalUser);
      this.clearMessages();
      this.success = 'Cambios descartados';
    }
  }

  /**
   * 🔄 Recargar datos
   */
  reloadData(): void {
    this.loadUserData();
    this.clearMessages();
  }

  /**
   * 🔙 Volver atrás
   */
  goBack(): void {
    if (this.hasChanges) {
      const confirmLeave = confirm('¿Estás seguro de que quieres salir sin guardar los cambios?');
      if (!confirmLeave) return;
    }

    this.router.navigate(['/dashboard']);
  }

  /**
   * 👁️ Toggle mostrar/ocultar contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // ===============================
  // 🔧 MÉTODOS AUXILIARES
  // ===============================

  /**
   * ✅ Verificar si un campo es inválido
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * ✅ Verificar si un campo es válido
   */
  isFieldValid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  /**
   * ❌ Obtener error de un campo
   */
  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);

    if (field?.errors?.['required']) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }

    if (field?.errors?.['email']) {
      return 'Ingresa un email válido';
    }

    if (field?.errors?.['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${minLength} caracteres`;
    }

    if (field?.errors?.['pattern']) {
      return 'Formato de teléfono inválido';
    }

    return '';
  }

  /**
   * 🏷️ Obtener etiqueta del campo
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'El email',
      password: 'La contraseña',
      nombre: 'El nombre',
      telefono: 'El teléfono'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * 🔴 Marcar todos los campos como touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
      }
    });
  }

  /**
   * 🧹 Limpiar mensajes
   */
  private clearMessages(): void {
    this.error = null;
    this.success = null;
  }

  /**
   * 🏷️ Obtener etiqueta del rol
   */
  getRoleLabel(): string {
    if (!this.currentUser?.rol) return 'Usuario';

    const roleLabels: { [key: string]: string } = {
      'admin': 'Administrador',
      'agente': 'Agente Inmobiliario',
      'cliente': 'Cliente'
    };

    return roleLabels[this.currentUser.rol] || this.currentUser.rol;
  }

  /**
   * 🎨 Obtener clase CSS del rol
   */
  getRoleClass(): string {
    if (!this.currentUser?.rol) return 'secondary';

    const roleClasses: { [key: string]: string } = {
      'admin': 'danger',
      'agente': 'success',
      'cliente': 'primary'
    };

    return roleClasses[this.currentUser.rol] || 'secondary';
  }

  /**
   * 📅 Formatear fecha
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'No disponible';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  /**
   * 🔍 Obtener información para debug
   */
  getDebugInfo(): string {
    return `
👤 Usuario: ${this.currentUser?.nombre}
📧 Email: ${this.currentUser?.email}
🏷️ Rol: ${this.currentUser?.rol}
🆔 ID: ${this.currentUser?.id}
📝 Cambios: ${this.hasChanges ? 'Sí' : 'No'}
✅ Válido: ${this.userForm.valid ? 'Sí' : 'No'}
    `;
  }
}
