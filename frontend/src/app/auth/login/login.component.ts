import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2><i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión</h2>
          <p>Accede a tu cuenta del sistema inmobiliario</p>
        </div>

        <form class="login-form">
          <div class="mb-3">
            <label for="email" class="form-label">
              <i class="fas fa-envelope me-2"></i>Email
            </label>
            <input type="email" class="form-control" id="email" placeholder="tu@email.com" required>
          </div>

          <div class="mb-3">
            <label for="password" class="form-label">
              <i class="fas fa-lock me-2"></i>Contraseña
            </label>
            <input type="password" class="form-control" id="password" placeholder="••••••••" required>
          </div>

          <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="remember">
            <label class="form-check-label" for="remember">
              Recordarme
            </label>
          </div>

          <button type="submit" class="btn btn-primary w-100 mb-3">
            <i class="fas fa-sign-in-alt me-2"></i>Entrar
          </button>
        </form>

        <div class="login-footer">
          <p class="text-center mb-2">
            <a href="#" class="text-decoration-none">¿Olvidaste tu contraseña?</a>
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
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header h2 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .login-header p {
      color: #6c757d;
      margin-bottom: 0;
    }

    .form-label {
      color: #2c3e50;
      font-weight: 500;
    }

    .form-control {
      border-radius: 8px;
      border: 2px solid #e9ecef;
      padding: 0.75rem;
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

    .login-footer a {
      color: #667eea;
    }

    .login-footer a:hover {
      color: #764ba2;
    }
  `]
})
export class LoginComponent {}
