import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

type Role = 'Owner' | 'Admin' | 'Viewer';
export interface JwtUser {
  sub?: number;
  username: string;
  role: Role;
  orgId?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenKey = 'sts_token';

  private _user = signal<JwtUser | null>(null);
  user = computed(() => this._user());

  constructor() {
    const tok = this.token;
    if (tok) this._user.set(this.decode(tok));
  }

  login(body: { username: string; password: string }) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, body)
      .pipe(
        tap(res => {
          const token: string =
            res?.access_token ?? res?.accessToken ?? res?.token;
          if (!token) throw new Error('No token returned by /auth/login');
          localStorage.setItem(this.tokenKey, token);
          this._user.set(this.decode(token));
        })
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this._user.set(null);
    this.router.navigateByUrl('/login');
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get isLoggedIn(): boolean {
    return !!this.token && !!this._user();
  }

  hasRole(role: Role): boolean {
    return (this._user()?.role ?? '') === role;
  }

  hasAnyRole(roles: Role[]): boolean {
    const r = this._user()?.role;
    return !!r && roles.includes(r);
  }

  private decode(token: string): JwtUser {
    const payload = token.split('.')[1] ?? '';
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(decodeURIComponent(escape(json)));

    const user: JwtUser = {
      sub: data.sub,
      username: data.username ?? data.user ?? 'user',
      role: (data.role ?? data.roles?.[0] ?? 'Viewer') as Role,
      orgId: data.orgId ?? data.org_id,
    };
    return user;
  }
}
