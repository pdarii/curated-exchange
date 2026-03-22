import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.authInitialized).pipe(
    filter((initialized): initialized is boolean => {
      return !!initialized;
    }),
    take(1),
    map(() => {
      const loggedIn = auth.isLoggedIn();
      if (loggedIn) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};

export const traderGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.authInitialized).pipe(
    filter((initialized): initialized is boolean => {
      return !!initialized;
    }),
    take(1),
    map(() => {
      const user = auth.user();
      if (!user) return router.createUrlTree(['/login']);
      if (user.role === 'admin') return router.createUrlTree(['/admin']);
      return true;
    })
  );
};
