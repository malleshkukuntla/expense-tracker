import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface User { id: number; name: string; email: string; }
export interface AuthResponse { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private KEY = 'expense_tracker_auth';

  constructor(private http: HttpClient, private router: Router) {}

  get token(): string | null { return this.read()?.token ?? null; }
  get user(): User | null { return this.read()?.user ?? null; }
  get loggedIn(): boolean { return !!this.token; }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(tap((r) => this.store(r)));
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { name, email, password }).pipe(tap((r) => this.store(r)));
  }

  logout() {
    localStorage.removeItem(this.KEY);
    this.router.navigate(['/login']);
  }

  private store(r: AuthResponse) { localStorage.setItem(this.KEY, JSON.stringify(r)); }
  private read(): AuthResponse | null {
    try { return JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch { return null; }
  }
}
