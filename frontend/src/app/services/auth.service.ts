import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Router } from '@angular/router';

// 🔥 INTERFACES SIMPLES PARA LOGIN FALSO
export interface User {
  id: number;
  email: string;
  password: string;
  rol: 'admin' | 'agente' | 'cliente';
  estado: 'Activo' | 'Inactivo';
  nombre: string;
  telefono: string;
  clientes?: string[];
  agentes?: string[];
  fechaRegistro: string;
  ultimoLogin?: string;
  recordId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // 🔥 USUARIOS DE PRUEBA (Definirás los datos después)
  private readonly USUARIOS_PRUEBA: User[] = [
    {
      id: 1,
      email: 'admin@inmobiliaria.com',
      password: 'admin123',
      rol: 'admin',
      estado: 'Activo',
      nombre: 'Administrador del Sistema',
      telefono: '+34900000001',
      clientes: [],
      agentes: [],
      fechaRegistro: '2024-01-01T10:00:00.000Z',
      ultimoLogin: undefined,
      recordId: 'recADMIN001'
    },
    {
      id: 2,
      email: 'agente@inmobiliaria.com',
      password: 'agente123',
      rol: 'agente',
      estado: 'Activo',
      nombre: 'Juan Carlos Agente',
      telefono: '+34900000002',
      clientes: ['recCLI001', 'recCLI002'],
      agentes: [],
      fechaRegistro: '2024-01-15T10:00:00.000Z',
      ultimoLogin: undefined,
      recordId: 'recAGE001'
    },
    {
      id: 3,
      email: 'cliente@inmobiliaria.com',
      password: 'cliente123',
      rol: 'cliente',
      estado: 'Activo',
      nombre: 'María López Cliente',
      telefono: '+34900000003',
      clientes: [],
      agentes: ['recAGE001'],
      fechaRegistro: '2024-02-01T10:00:00.000Z',
      ultimoLogin: undefined,
      recordId: 'recCLI001'
    }
  ];

  // 🔥 ESTADO DE LA APLICACIÓN
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());

  constructor(private router: Router) {
    console.log('🔥 AuthService inicializado con', this.USUARIOS_PRUEBA.length, 'usuarios de prueba');
  }

  // 🔥 LOGIN FALSO CON SIMULACIÓN DE DELAY
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    console.log('🔐 Intentando login falso con:', credentials.email);

    // Simular delay de red
    return of(null).pipe(
      delay(1000), // 1 segundo de "carga"
      map(() => {
        // Buscar usuario
        const usuario = this.USUARIOS_PRUEBA.find(u => 
          u.email === credentials.email && u.password === credentials.password
        );

        if (!usuario) {
          throw new Error('Credenciales incorrectas');
        }

        if (usuario.estado !== 'Activo') {
          throw new Error('Usuario inactivo');
        }

        // Actualizar último login
        usuario.ultimoLogin = new Date().toISOString();

        // Generar token falso
        const token = this.generateFakeToken(usuario);

        // Guardar en memoria/localStorage
        this.setStoredUser(usuario);
        this.setStoredToken(token);

        const response: AuthResponse = {
          success: true,
          message: 'Login exitoso',
          user: usuario,
          token: token
        };

        console.log('✅ Login falso exitoso:', response);
        return response;
      })
    );
  }

  // 🔥 LOGOUT
  logout(): Observable<any> {
    console.log('🚪 Cerrando sesión...');
    
    return of(null).pipe(
      delay(500),
      map(() => {
        this.clearStoredUser();
        this.clearStoredToken();
        this.router.navigate(['/login']);
        return { success: true, message: 'Sesión cerrada' };
      })
    );
  }

  // 🔥 OBTENER USUARIO ACTUAL
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  // 🔥 VERIFICAR SI ESTÁ AUTENTICADO
  get isAuthenticated(): boolean {
    return !!this.currentUserSubject.value && !!this.tokenSubject.value;
  }

  // 🔥 OBTENER USUARIO ACTUAL (SINCRÓNICO)
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // 🔥 VERIFICACIONES DE ROL
  get isAdmin(): boolean {
    return this.currentUserValue?.rol === 'admin';
  }

  get isAgent(): boolean {
    return this.currentUserValue?.rol === 'agente';
  }

  get isClient(): boolean {
    return this.currentUserValue?.rol === 'cliente';
  }

  hasRole(role: string): boolean {
    return this.currentUserValue?.rol === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this.currentUserValue?.rol;
    return userRole ? roles.includes(userRole) : false;
  }

  // 🔥 MÉTODOS DE STORAGE
  private setStoredUser(user: User): void {
    localStorage.setItem('fake_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getStoredUser(): User | null {
    const userData = localStorage.getItem('fake_user');
    return userData ? JSON.parse(userData) : null;
  }

  private clearStoredUser(): void {
    localStorage.removeItem('fake_user');
    this.currentUserSubject.next(null);
  }

  private setStoredToken(token: string): void {
    localStorage.setItem('fake_token', token);
    this.tokenSubject.next(token);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem('fake_token');
  }

  private clearStoredToken(): void {
    localStorage.removeItem('fake_token');
    this.tokenSubject.next(null);
  }

  // 🔥 GENERAR TOKEN FALSO
  private generateFakeToken(user: User): string {
    const payload = {
      user_id: user.id,
      email: user.email,
      role: user.rol,
      exp: Date.now() + (24 * 60 * 60 * 1000), // 24 horas
      iat: Date.now()
    };
    
    // Token base64 falso (solo para demo)
    return 'fake_jwt_' + btoa(JSON.stringify(payload));
  }

  // 🔥 OBTENER TODOS LOS USUARIOS (PARA ADMIN)
  getAllUsers(): User[] {
    return this.isAdmin ? [...this.USUARIOS_PRUEBA] : [];
  }

  // 🔥 BUSCAR USUARIO POR EMAIL
  getUserByEmail(email: string): User | undefined {
    return this.USUARIOS_PRUEBA.find(u => u.email === email);
  }

  // 🔥 ACTUALIZAR ÚLTIMO LOGIN (SIMULADO)
  updateLastLogin(userId: number): void {
    const user = this.USUARIOS_PRUEBA.find(u => u.id === userId);
    if (user) {
      user.ultimoLogin = new Date().toISOString();
      if (this.currentUserValue?.id === userId) {
        this.setStoredUser(user);
      }
    }
  }
}
