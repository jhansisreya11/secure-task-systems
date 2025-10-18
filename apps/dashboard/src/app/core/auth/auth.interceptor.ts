import { Injectable } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthInterceptor {
  intercept = ((req, next) => {
    const auth = inject(AuthService);
    const token = auth.token;
    if (!token) return next(req);
    const clone = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next(clone);
  }) as HttpInterceptorFn;
}
