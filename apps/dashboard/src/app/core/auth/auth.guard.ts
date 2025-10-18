import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Require authentication.
 * If not logged in, return a UrlTree to /login (no imperative navigate).
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If your AuthService exposes a boolean, keep this:
  const isLoggedIn = !!auth.isLoggedIn;

  // If you expose a method instead, uncomment this and remove the line above:
  // const isLoggedIn = !!auth.isLoggedIn();

  return isLoggedIn ? true : router.parseUrl('/login');
};

/**
 * Block /login when already authenticated.
 * If logged in, redirect to '/'.
 */
export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = !!auth.isLoggedIn;
  // const isLoggedIn = !!auth.isLoggedIn(); // use this variant if your service is a method

  return isLoggedIn ? router.parseUrl('/') : true;
};
