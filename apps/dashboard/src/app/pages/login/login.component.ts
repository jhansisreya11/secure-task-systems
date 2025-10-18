import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <form (ngSubmit)="submit()" class="w-full max-w-sm space-y-4">
        <h1 class="text-3xl font-bold">Sign in</h1>

        <div>
          <label class="block mb-1">Username</label>
          <input [(ngModel)]="username" name="username" class="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label class="block mb-1">Password</label>
          <input [(ngModel)]="password" name="password" type="password" class="w-full border rounded px-3 py-2" />
        </div>

        <button class="px-4 py-2 rounded text-white bg-black">Sign in</button>

        <p *ngIf="error" class="text-red-600 text-sm">{{ error }}</p>

        <p *ngIf="auth.user()" class="text-sm text-gray-600">
          Signed in as {{ auth.user()?.username }} ({{ auth.user()?.role }})
        </p>
      </form>
    </div>
  `,
})
export class LoginComponent {
  // make this public/readonly so the template can use it
  readonly auth: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  username = 'admin';
  password = 'password';
  error = '';

  submit() {
    this.error = '';
    this.auth.login({ username: this.username, password: this.password })
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: () => this.error = 'Login failed',
      });
  }
}

