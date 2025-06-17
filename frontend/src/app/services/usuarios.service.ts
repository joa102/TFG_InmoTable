import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService, User } from './auth.service';
import { ApiResponse } from '../interfaces/api.interfaces';

export interface UsuarioUpdateData {
  email: string;
  password: string;
  nombre: string;
  telefono: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  /**
   * 🔄 Actualizar usuario actual en Airtable
   */
  updateCurrentUser(userData: UsuarioUpdateData): Observable<User> {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    // 🔥 USAR EL recordId DEL USUARIO PARA ACTUALIZAR EN AIRTABLE
    const endpoint = `usuarios/${currentUser.recordId}`;
    
    console.log('🔄 Actualizando usuario en Airtable:', {
      recordId: currentUser.recordId,
      userData
    });

    return this.apiService.put<User>(endpoint, userData)
      .pipe(
        map((response: ApiResponse<User>) => {
          if (response.success && response.data) {
            // 🔥 ACTUALIZAR EL USUARIO EN EL AUTHSERVICE
            const updatedUser: User = {
              ...currentUser,
              email: userData.email,
              password: userData.password,
              nombre: userData.nombre,
              telefono: userData.telefono,
              ultimoLogin: new Date().toISOString()
            };

            // 🔥 ACTUALIZAR EN LOCALSTORAGE Y AUTHSERVICE
            this.updateUserInAuthService(updatedUser);

            return updatedUser;
          } else {
            throw new Error(response.message || 'Error al actualizar usuario');
          }
        }),
        catchError(error => {
          console.error('❌ Error al actualizar usuario:', error);
          throw error;
        })
      );
  }

  /**
   * 🔄 Actualizar usuario en AuthService
   */
  private updateUserInAuthService(updatedUser: User): void {
    // 🔥 ACTUALIZAR EN LOCALSTORAGE
    localStorage.setItem('fake_user', JSON.stringify(updatedUser));
    
    // 🔥 NOTIFICAR AL AUTHSERVICE (si tuviera un método público)
    console.log('✅ Usuario actualizado en AuthService:', updatedUser);
  }

  /**
   * 📧 Obtener usuario por email
   */
  getUserByEmail(email: string): Observable<User | null> {
    return this.apiService.get<User[]>(`usuarios?email=${encodeURIComponent(email)}`)
      .pipe(
        map((response: ApiResponse<User[]>) => {
          if (response.success && response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        }),
        catchError(error => {
          console.error('❌ Error al buscar usuario por email:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * 🆔 Obtener usuario por recordId
   */
  getUserByRecordId(recordId: string): Observable<User | null> {
    return this.apiService.get<User>(`usuarios/${recordId}`)
      .pipe(
        map((response: ApiResponse<User>) => {
          if (response.success && response.data) {
            return response.data;
          }
          return null;
        }),
        catchError(error => {
          console.error('❌ Error al obtener usuario por recordId:', error);
          return throwError(() => error);
        })
      );
  }
}
