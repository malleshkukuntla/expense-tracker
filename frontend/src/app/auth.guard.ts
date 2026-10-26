import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Only logged-in users can open the dashboard.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.loggedIn ? true : inject(Router).createUrlTree(['/login']);
};

// Logged-in users skip the login and register pages.
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.loggedIn ? inject(Router).createUrlTree(['/']) : true;
};
