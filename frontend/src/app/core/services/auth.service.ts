import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User, Role, RegisterStoreDto } from '../models/models';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tenantsUrl = `${environment.apiUrl}/tenants`;
  private readonly TOKEN_KEY = 'wsp_access_token';
  private readonly USER_KEY = 'wsp_user';
  private readonly ORIGINAL_SUPER_TOKEN_KEY = 'wsp_original_super_token';
  private readonly ORIGINAL_SUPER_USER_KEY = 'wsp_original_super_user';
  private readonly IMPERSONATING_STORE_NAME_KEY = 'wsp_impersonating_store_name';
  private readonly IMPERSONATING_STORE_SLUG_KEY = 'wsp_impersonating_store_slug';

  // Signals para estado reactivo del usuario
  currentUser = signal<User | null>(this.getStoredUser());
  isAuthenticated = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === Role.ADMIN || this.currentUser()?.role === Role.SUPER_ADMIN);
  isSuperAdmin = computed(() => this.currentUser()?.role === Role.SUPER_ADMIN);

  // Impersonation State
  isImpersonating = signal<boolean>(!!localStorage.getItem(this.ORIGINAL_SUPER_TOKEN_KEY));
  impersonatedStoreName = signal<string>(localStorage.getItem(this.IMPERSONATING_STORE_NAME_KEY) || '');
  impersonatedStoreSlug = signal<string>(localStorage.getItem(this.IMPERSONATING_STORE_SLUG_KEY) || '');

  constructor(
    private http: HttpClient,
    private router: Router,
    private socketService: SocketService,
  ) {
    // Sincronizar automáticamente la sala de WebSocket con el tenant activo
    effect(() => {
      const user = this.currentUser();
      if (user?.tenantId) {
        this.socketService.joinTenant(user.tenantId);
      }
    });
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.clearImpersonationData();
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      }),
    );
  }

  registerStore(dto: RegisterStoreDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.tenantsUrl}/register`, dto).pipe(
      tap((res) => {
        this.clearImpersonationData();
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      }),
    );
  }

  applyImpersonation(token: string, storeName: string, storeSlug?: string) {
    // Si no estamos ya impersonando, guardar el token y usuario original del Super Admin
    if (!this.isImpersonating()) {
      const currentToken = this.getToken();
      const currentUser = this.currentUser();
      if (currentToken) localStorage.setItem(this.ORIGINAL_SUPER_TOKEN_KEY, currentToken);
      if (currentUser) localStorage.setItem(this.ORIGINAL_SUPER_USER_KEY, JSON.stringify(currentUser));
    }

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.IMPERSONATING_STORE_NAME_KEY, storeName);
    if (storeSlug) {
      localStorage.setItem(this.IMPERSONATING_STORE_SLUG_KEY, storeSlug);
      this.impersonatedStoreSlug.set(storeSlug);
    }
    this.isImpersonating.set(true);
    this.impersonatedStoreName.set(storeName);

    // Decodificar token para extraer usuario de la tienda
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const impersonatedUser: User = {
        id: payload.sub,
        email: payload.email,
        fullName: payload.fullName || `Admin (${storeName})`,
        role: Role.ADMIN,
        tenantId: payload.tenantId,
        tenantSlug: storeSlug || payload.tenantSlug,
        tenantName: storeName,
        isActive: true,
      };
      localStorage.setItem(this.USER_KEY, JSON.stringify(impersonatedUser));
      this.currentUser.set(impersonatedUser);
    } catch {
      // Ignorar error de decodificación
    }

    this.router.navigate(['/dashboard']);
  }

  exitImpersonation() {
    const originalToken = localStorage.getItem(this.ORIGINAL_SUPER_TOKEN_KEY);
    const originalUserStr = localStorage.getItem(this.ORIGINAL_SUPER_USER_KEY);

    if (originalToken && originalUserStr) {
      localStorage.setItem(this.TOKEN_KEY, originalToken);
      localStorage.setItem(this.USER_KEY, originalUserStr);
      try {
        this.currentUser.set(JSON.parse(originalUserStr));
      } catch {
        this.currentUser.set(null);
      }
    }

    this.clearImpersonationData();
    this.router.navigate(['/admin/tenants']);
  }

  logout() {
    this.clearImpersonationData();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private clearImpersonationData() {
    localStorage.removeItem(this.ORIGINAL_SUPER_TOKEN_KEY);
    localStorage.removeItem(this.ORIGINAL_SUPER_USER_KEY);
    localStorage.removeItem(this.IMPERSONATING_STORE_NAME_KEY);
    localStorage.removeItem(this.IMPERSONATING_STORE_SLUG_KEY);
    this.isImpersonating.set(false);
    this.impersonatedStoreName.set('');
    this.impersonatedStoreSlug.set('');
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}
