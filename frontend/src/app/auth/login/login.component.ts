import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2><i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión</h2>
          <p>Accede a tu cuenta del sistema inmobiliario</p>
        </div>

        <!-- ✅ ALERTA DE ERROR -->
        <div *ngIf="error" class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error }}
          <button type="button" class="btn-close" (click)="clearError()" aria-label="Close"></button>
        </div>

        <!-- ✅ ALERTA DE ÉXITO -->
        <div *ngIf="success" class="alert alert-success alert-dismissible fade show" role="alert">
          <i class="fas fa-check-circle me-2"></i>
          {{ success }}
        </div>

        <!-- ✅ FORMULARIO REACTIVO FUNCIONAL -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" novalidate>

          <!-- Email -->
          <div class="mb-3">
            <label for="email" class="form-label">
              <i class="fas fa-envelope me-2"></i>Email
            </label>
            <input
              type="email"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('email')"
              [class.is-valid]="isFieldValid('email')"
              id="email"
              formControlName="email"
              placeholder="tu@email.com"
              autocomplete="email"
            />
            <div *ngIf="isFieldInvalid('email')" class="invalid-feedback">
              {{ getFieldError('email') }}
            </div>
          </div>

          <!-- Contraseña -->
          <div class="mb-3">
            <label for="password" class="form-label">
              <i class="fas fa-lock me-2"></i>Contraseña
            </label>
            <input
              type="password"
              class="form-control"
              [class.is-invalid]="isFieldInvalid('password')"
              [class.is-valid]="isFieldValid('password')"
              id="password"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <div *ngIf="isFieldInvalid('password')" class="invalid-feedback">
              {{ getFieldError('password') }}
            </div>
          </div>

          <!-- Recordarme -->
          <div class="mb-3 form-check">
            <input
              type="checkbox"
              class="form-check-input"
              id="remember"
              formControlName="remember"
            />
            <label class="form-check-label" for="remember">
              Recordarme
            </label>
          </div>

          <!-- Botón de envío -->
          <button
            type="submit"
            class="btn btn-primary w-100 mb-3"
            [disabled]="loading || loginForm.invalid"
          >
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            <i *ngIf="!loading" class="fas fa-sign-in-alt me-2"></i>
            {{ loading ? 'Iniciando sesión...' : 'Entrar' }}
          </button>
        </form>

        <!-- Footer -->
        <div class="login-footer">
          <p class="text-center mb-2">
            <a href="#" class="text-decoration-none" (click)="onForgotPassword($event)">¿Olvidaste tu contraseña?</a>
          </p>
          <p class="text-center">
            ¿No tienes cuenta?
            <a routerLink="/auth/register" class="text-decoration-none fw-bold">Regístrate aquí</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;
      animation: slideUp 0.5s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header h2 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .login-header p {
      color: #6c757d;
      margin-bottom: 0;
      font-size: 0.95rem;
    }

    .form-label {
      color: #2c3e50;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .form-control {
      border-radius: 8px;
      border: 2px solid #e9ecef;
      padding: 0.75rem;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
      outline: none;
    }

    .form-control.is-valid {
      border-color: #28a745;
    }

    .form-control.is-invalid {
      border-color: #dc3545;
    }

    .form-control:disabled {
      background-color: #f8f9fa;
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 8px;
      padding: 0.75rem;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      transform: none;
    }

    .login-footer a {
      color: #667eea;
      transition: color 0.3s ease;
    }

    .login-footer a:hover {
      color: #764ba2;
    }

    .alert {
      border-radius: 8px;
      border: none;
    }

    .spinner-border-sm {
      width: 1rem;
      height: 1rem;
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  returnUrl = '/dashboard';

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['admin@inmobiliaria.com', [Validators.required, Validators.email]],
      password: ['admin123', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  onSubmit(): void {
    console.log('🔐 Formulario enviado');
    this.clearMessages();

    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      this.error = 'Por favor, corrige los errores en el formulario';
      return;
    }

    this.loading = true;

    // ✅ DESHABILITAR FORMULARIO DURANTE LOADING (forma correcta)
    this.toggleFormState(false);

    const credentials = {
      email: this.loginForm.get('email')?.value.trim(),
      password: this.loginForm.get('password')?.value
    };

    console.log('🔐 Intentando login con:', { email: credentials.email });

    this.authService.login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Login exitoso:', response);
          this.success = 'Login exitoso. Redirigiendo...';
          this.loading = false;

          // Pequeño delay para mostrar el mensaje de éxito
          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 1000);
        },
        error: (error) => {
          console.error('❌ Error en login:', error);
          this.loading = false;

          // ✅ REHABILITAR FORMULARIO EN CASO DE ERROR
          this.toggleFormState(true);

          this.error = this.getErrorMessage(error);
        }
      });
  }

  /**
   * ✅ MÉTODO PARA HABILITAR/DESHABILITAR FORMULARIO (forma correcta)
   */
  private toggleFormState(enabled: boolean): void {
    if (enabled) {
      this.loginForm.get('email')?.enable();
      this.loginForm.get('password')?.enable();
      this.loginForm.get('remember')?.enable();
    } else {
      this.loginForm.get('email')?.disable();
      this.loginForm.get('password')?.disable();
      this.loginForm.get('remember')?.disable();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
      }
    });
  }

  private getErrorMessage(error: any): string {
    switch (error.status) {
      case 401:
        return 'Email o contraseña incorrectos';
      case 400:
        return 'Datos inválidos. Verifica tu email y contraseña';
      case 419:
        return 'Sesión expirada. Recarga la página e intenta nuevamente';
      case 422:
        return 'Datos de validación incorrectos';
      case 500:
        return 'Error del servidor. Intenta más tarde';
      case 0:
        return 'No se puede conectar al servidor. Verifica tu conexión';
      default:
        return error.error?.message ||
               error.message ||
               'Error al iniciar sesión. Intenta nuevamente';
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (field?.errors?.['required']) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }

    if (field?.errors?.['email']) {
      return 'Ingresa un email válido';
    }

    if (field?.errors?.['minlength']) {
      const requiredLength = field.errors['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${requiredLength} caracteres`;
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'El email',
      password: 'La contraseña'
    };
    return labels[fieldName] || fieldName;
  }

  clearError(): void {
    this.error = null;
  }

  clearMessages(): void {
    this.error = null;
    this.success = null;
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    alert('Funcionalidad de recuperar contraseña pendiente de implementar');
  }
}
