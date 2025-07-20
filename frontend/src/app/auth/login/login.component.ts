import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService, LoginCredentials } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2><i class="fas fa-sign-in-alt me-2"></i>Iniciar sesión</h2>
          <p>Iniciar sesión en Inmobiliaria</p>
        </div>

        <!-- 🔥 USUARIOS DE PRUEBA -->
        <div class="demo-users mb-4">
          <h6 class="text-muted mb-2">👤 Usuarios de prueba:</h6>
          <div class="demo-user-buttons">
            <!--<button type="button" class="btn btn-outline-primary btn-sm me-2 mb-2" (click)="fillAdmin()">
              Admin
            </button>
            <button type="button" class="btn btn-outline-success btn-sm me-2 mb-2" (click)="fillAgent()">
              Agente
            </button>
            <button type="button" class="btn btn-outline-info btn-sm me-2 mb-2" (click)="fillClient()">
              Cliente
            </button>-->
            <button type="button" class="btn btn-outline-primary btn-sm me-2 mb-2" (click)="fillClient1()">
              Cliente 1
            </button>
            <button type="button" class="btn btn-outline-success btn-sm me-2 mb-2" (click)="fillClient2()">
              Cliente 2
            </button>
            <button type="button" class="btn btn-outline-info btn-sm me-2 mb-2" (click)="fillClient3()">
              Cliente 3
            </button>
          </div>
        </div>

        <!-- ❌ ALERTA DE ERROR -->
        <div *ngIf="error" class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          {{ error }}
          <button type="button" class="btn-close" (click)="clearError()" aria-label="Close"></button>
        </div>

        <!-- ✅ ALERTA DE ÉXITO -->
        <div *ngIf="success" class="alert alert-success fade show" role="alert">
          <i class="fas fa-check-circle me-2"></i>
          {{ success }}
        </div>

        <!-- 📝 FORMULARIO -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>

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
              placeholder="usuario@inmobiliaria.com"
            />
            <div *ngIf="isFieldInvalid('email')" class="invalid-feedback">
              {{ getFieldError('email') }}
            </div>
          </div>

          <!-- Password -->
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
            />
            <div *ngIf="isFieldInvalid('password')" class="invalid-feedback">
              {{ getFieldError('password') }}
            </div>
          </div>

          <!-- Botón Login -->
          <button
            type="submit"
            class="btn btn-primary w-100"
            [disabled]="loading || loginForm.invalid"
          >
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!loading" class="fas fa-sign-in-alt me-2"></i>
            {{ loading ? 'Iniciando sesión...' : 'Entrar' }}
          </button>
        </form>

        <!-- 🔥 SEPARADOR Y REGISTRO -->
        <div class="mt-3">
          <div class="text-center">
            <span class="text-muted">o</span>
          </div>
          <div class="text-center mt-2">
            <span class="text-muted me-2">¿No tienes cuenta?</span>
            <a routerLink="/auth/register" class="text-decoration-none fw-bold">
              Regístrate aquí
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div class="login-footer mt-3">
          <p class="text-center text-muted">
            <small>
              <i class="fas fa-info-circle me-1"></i>
              Al iniciar sesión aceptas nuestras condiciones de uso y políticas de privacidad.
            </small>
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
      padding-top: 6.2rem;
    }

    .login-card {
      background: white;
      padding: 2.5rem;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 450px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .login-header h2 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .demo-users {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .demo-user-buttons {
      display: flex;
      flex-wrap: wrap;
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
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 8px;
      padding: 0.75rem;
      font-weight: 500;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated) {
      //this.router.navigate(['/dashboard']);
      this.router.navigate(['/propiedades']);
    }
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // 🔥 AUTOCOMPLETAR USUARIOS DE PRUEBA
  /*fillAdmin(): void {
    this.loginForm.patchValue({
      email: 'admin@inmotable.com',
      password: 'admin123'
    });
    this.clearMessages();
  }

  fillAgent(): void {
    this.loginForm.patchValue({
      email: 'luísbilbao-vara@inmotable.com',
      password: 'agente123'
    });
    this.clearMessages();
  }

  fillClient(): void {
    this.loginForm.patchValue({
      email: 'mireiabayona@fajardo-tamarit.es',
      password: 'cliente123'
    });
    this.clearMessages();
  }*/

  fillClient1(): void {
    this.loginForm.patchValue({
      email: 'mireiabayona@fajardo-tamarit.es',
      password: 'cliente123'
    });
    this.clearMessages();
  }

  fillClient2(): void {
    this.loginForm.patchValue({
      email: 'coliver@rubio.org',
      password: 'cliente123'
    });
    this.clearMessages();
  }

  fillClient3(): void {
    this.loginForm.patchValue({
      email: 'joa102@inlumine.ual.es',
      password: 'ClientePrueba123@#'
    });
    this.clearMessages();
  }

  // 🔥 ENVIAR FORMULARIO
  onSubmit(): void {
    this.clearMessages();

    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      this.error = 'Por favor, corrige los errores en el formulario';
      return;
    }

    this.loading = true;

    const credentials: LoginCredentials = {
      email: this.loginForm.get('email')?.value.trim(),
      password: this.loginForm.get('password')?.value
    };

    //this.authService.login(credentials)
    this.authService.login2(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.success = 'Login exitoso. Redirigiendo...';
          this.loading = false;

          setTimeout(() => {
            //this.router.navigate(['/dashboard']);
            this.router.navigate(['/propiedades']);
          }, 1000);
        },
        error: (error) => {
          this.loading = false;
          this.error = error.message || 'Error al iniciar sesión';
        }
      });
  }

  // 🔥 VALIDACIONES
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
      return `${this.getFieldLabel(fieldName)} debe tener al menos 6 caracteres`;
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

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
      }
    });
  }

  clearError(): void {
    this.error = null;
  }

  clearMessages(): void {
    this.error = null;
    this.success = null;
  }
}
