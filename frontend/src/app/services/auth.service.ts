import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

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
  recordIdCliente: string;
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
      email: 'admin@inmotable.com',
      password: 'admin123',
      rol: 'admin',
      estado: 'Activo',
      nombre: 'Administrador del Sistema',
      telefono: '+34900000001',
      clientes: [],
      agentes: [],
      fechaRegistro: '2024-01-01T10:00:00.000Z',
      ultimoLogin: undefined,
      recordId: 'recZqPUvF8iL6vr8t',
      recordIdCliente: 'rectky7CqkrJSVGbg'
    },
    {
      id: 2,
      email: 'luísbilbao-vara@inmotable.com',
      password: 'agente123',
      rol: 'agente',
      estado: 'Activo',
      nombre: 'Luís Bilbao-Vara',
      telefono: '634929311',
      clientes: [],
      agentes: ['6'],
      fechaRegistro: '2024-01-15T10:00:00.000Z',
      ultimoLogin: undefined,
      recordId: 'rectky7CqkrJSVGbg',
      recordIdCliente: 'rectky7CqkrJSVGbg'
    },
    {
      id: 56,
      email: 'mireiabayona@fajardo-tamarit.es',
      password: 'cliente123',
      rol: 'cliente',
      estado: 'Activo',
      nombre: 'Héctor Núñez Ferrán',
      telefono: '619015987',
      clientes: ['45'],
      agentes: [],
      fechaRegistro: '2024-02-01T10:00:00.000Z',
      ultimoLogin: undefined,
      recordId: 'recn081eZJuWJ1pti',
      recordIdCliente: 'recXNz6ABzdQ04Bre'
    },
    {
      id: 215,
      email: 'joa102@inlumine.ual.es',
      password: '123456',
      rol: 'cliente',
      estado: 'Activo',
      nombre: 'Juan Diego Ortega Aranda',
      telefono: '612345789',
      clientes: ['204'],
      agentes: [],
      fechaRegistro: '2025-06-25T10:00:00.000Z',
      ultimoLogin: undefined,
      recordId: 'recpRKo2NI3fiIg6b',
      recordIdCliente: 'recrq9z2GFijDLWIe'
    }
  ];

  // 🔥 ESTADO DE LA APLICACIÓN
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());

  constructor(private router: Router, private apiService: ApiService,) {
    console.log('🔥 AuthService inicializado con', this.USUARIOS_PRUEBA.length, 'usuarios de prueba');
  }

  // 🔒 CREAR CLIENTE (REQUIERE AUTH)
  login2(credentials: LoginCredentials): Observable<any> {
  console.log(credentials);

  return this.apiService.post<any>('login', credentials)
    .pipe(
      map((res: any) => {
        console.log('📦 Respuesta completa:', res);

        // 🔥 NO HAGAS ESTO: const user: User = res.user;
        // El servidor envía propiedades con mayúsculas que no coinciden con la interfaz

        const rawUser = res.user; // Datos sin tipear del servidor
        console.log('👤 Usuario crudo del servidor:', rawUser);
        console.log('🔍 Estado del servidor:', rawUser.Estado); // Esto SÍ funciona

        // 🔥 MAPEAR CORRECTAMENTE A LA INTERFAZ User
        const user: User = {
          id: rawUser['ID Usuario'] || rawUser.id || rawUser.ID || 0,
          email: rawUser.Email || rawUser.email || '',
          //password: '', // No enviar password
          password: rawUser.password || rawUser.Password || '',
          rol: (rawUser.Rol || rawUser.rol || 'cliente').toLowerCase() as 'admin' | 'agente' | 'cliente',
          estado: rawUser.Estado || rawUser.estado || 'Activo', // 🔥 MAPEO CORRECTO
          nombre: rawUser.Nombre || rawUser.nombre || '',
          telefono: rawUser.Telefono || rawUser.telefono || rawUser.Teléfono || '',
          clientes: rawUser.Clientes || rawUser.clientes || [],
          agentes: rawUser.Agentes || rawUser.agentes || [],
          fechaRegistro: rawUser['Fecha de Registro'] || rawUser.fechaRegistro || new Date().toISOString(),
          ultimoLogin: new Date().toISOString(),
          recordId: rawUser.RECORD_ID || rawUser.recordId || '',
          recordIdCliente: rawUser.recordIdCliente || ''
        };

        console.log('✅ Usuario mapeado correctamente:', user);
        console.log('🔍 Estado mapeado:', user.estado); // Ahora esto SÍ funciona

        const token: string = res.data?.access_token || res.token || '';
        console.log('🔑 Token extraído:', token ? 'Presente' : 'FALTANTE');

        if (!user.email || !user.nombre) {
          throw new Error('Datos de usuario incompletos');
        }

        if (user.estado !== 'Activo') {
          throw new Error('Usuario inactivo');
        }

        // Guardar usuario mapeado
        this.setStoredUser(user);
        this.setStoredToken(token);

        const authResp: AuthResponse = {
          success: true,
          message: 'Login exitoso',
          user,
          token
        };

        console.log('🎉 Login completado:', authResp);
        return authResp;
      })
    );
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
