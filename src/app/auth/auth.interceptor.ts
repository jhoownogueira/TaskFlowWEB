import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, finalize, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AuthStore } from './auth.store';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

let refreshing = false;
let refreshWaiters$: Observable<string> | null = null;

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);

  const store = inject(AuthStore);

  if (isBrowser && typeof store.syncFromStorage === 'function') {
    store.syncFromStorage();
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');

  const accessToken = store.accessToken();
  const authReq =
    !isAuthEndpoint && accessToken
      ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      console.log('401 detected, attempting token refresh...');
      console.log(err);

      if (!isBrowser) return throwError(() => err);

      if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

      if (err.status !== 401) return throwError(() => err);

      if (isAuthEndpoint) return throwError(() => err);

      const rt = store.refreshToken();
      if (!rt) {
        if (isBrowser) {
          store.clear();
          router.navigateByUrl('/');
        }
        return throwError(() => err);
      }

      if (!refreshing) {
        refreshing = true;

        refreshWaiters$ = auth.refresh(rt).pipe(
          switchMap((res) => {
            store.setTokens(res.accessToken, res.refreshToken);
            return new Observable<string>((obs) => {
              obs.next(res.accessToken);
              obs.complete();
            });
          }),
          catchError((refreshErr: any) => {
            if (isBrowser) {
              store.clear();
              router.navigateByUrl('/');
            }
            return throwError(() => refreshErr);
          }),
          finalize(() => {
            refreshing = false;
            refreshWaiters$ = null;
          }),
        );
      }

      return (refreshWaiters$ as Observable<string>).pipe(
        take(1),
        switchMap((newToken) => {
          const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
          return next(retried);
        }),
      );
    }),
  );
}
