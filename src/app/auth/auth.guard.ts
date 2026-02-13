import { inject, PLATFORM_ID } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthStore } from './auth.store';

export const authGuard: CanMatchFn = () => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) return true;

  const auth = inject(AuthStore);
  const router = inject(Router);

  auth.syncFromStorage?.();

  const logged = auth.isLoggedIn();
  return logged ? true : router.parseUrl('/');
};
