import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import {
  User,
  AuthResponse,
  LoginData,
  RegisterData,
  ApiResponse
} from '../interfaces/api.interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  // 🔥 OBTENER USUARIO ALMACENADO
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // 🔥 ALMACENAR USUARIO
  private setStoredUser(user: User): void {
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // 🔥 LIMPIAR USUARIO ALMACENADO
  private removeStoredUser(): void {
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  // 🔥 REGISTRO DE USUARIO
  register(userData: RegisterData): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/register', userData)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.apiService.setToken(response.data.token);
            this.setStoredUser(response.data.user);
          }
        }),
        map(response => response.data!),
        catchError(error => {
          console.error('Error en registro:', error);
          throw error;
        })
      );
  }

  // 🔥 LOGIN
  login(credentials: LoginData): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/login', credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.apiService.setToken(response.data.token);
            this.setStoredUser(response.data.user);
          }
        }),
        map(response => response.data!),
        catchError(error => {
          console.error('Error en login:', error);
          throw error;
        })
      );
  }

  // 🔥 LOGOUT
  logout(): Observable<any> {
    return this.apiService.post('auth/logout', {})
      .pipe(
        tap(() => {
          this.apiService.removeToken();
          this.removeStoredUser();
          this.router.navigate(['/login']);
        }),
        catchError(error => {
          // Limpiar datos locales aunque falle la request
          this.apiService.removeToken();
          this.removeStoredUser();
          this.router.navigate(['/login']);
          throw error;
        })
      );
  }

  // 🔥 OBTENER USUARIO ACTUAL
  getCurrentUser(): Observable<User> {
    return this.apiService.get<{ user: User; airtable_data: any }>('auth/user')
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.setStoredUser(response.data.user);
          }
        }),
        map(response => response.data!.user),
        catchError(error => {
          if (error.status === 401) {
            this.forceLogout();
          }
          throw error;
        })
      );
  }

  // 🔥 SINCRONIZAR CON AIRTABLE
  syncWithAirtable(): Observable<any> {
    return this.apiService.post('auth/sync', {});
  }

  // 🔥 FORZAR LOGOUT (cuando token expira)
  forceLogout(): void {
    this.apiService.removeToken();
    this.removeStoredUser();
    this.router.navigate(['/login']);
  }

  // 🔥 VERIFICAR SI ESTÁ AUTENTICADO
  get isAuthenticated(): boolean {
    return this.apiService.isAuthenticated && !!this.currentUserSubject.value;
  }

  // 🔥 OBTENER USUARIO ACTUAL (SINCRÓNICO)
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // 🔥 VERIFICAR ROL
  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user ? user.role === role : false;
  }

  // 🔥 VERIFICAR MÚLTIPLES ROLES
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserValue;
    return user ? roles.includes(user.role) : false;
  }

  // 🔥 VERIFICAR SI ES ADMIN
  get isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // 🔥 VERIFICAR SI ES AGENTE
  get isAgent(): boolean {
    return this.hasRole('agente');
  }

  // 🔥 VERIFICAR SI ES CLIENTE
  get isClient(): boolean {
    return this.hasRole('cliente');
  }

  // 🔥 VERIFICAR SI PUEDE GESTIONAR PROPIEDADES
  canManageProperties(): boolean {
    return this.hasAnyRole(['admin', 'agente']);
  }

  // 🔥 VERIFICAR SI PUEDE GESTIONAR USUARIOS
  canManageUsers(): boolean {
    return this.isAdmin;
  }

  // 🔥 VERIFICAR SI PUEDE VER TODAS LAS CITAS
  canViewAllCitas(): boolean {
    return this.hasAnyRole(['admin', 'agente']);
  }
}
