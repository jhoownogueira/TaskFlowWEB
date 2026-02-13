import { Injectable, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private normalizeToken(v: string | null) {
    if (!v) return null;
    if (v === 'null' || v === 'undefined') return null;
    return v;
  }

  private _accessToken = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);

  accessToken = computed(() => this._accessToken());
  refreshToken = computed(() => this._refreshToken());
  isLoggedIn = computed(() => !!this._accessToken());

  constructor() {
    if (this.isBrowser) {
      const at = this.normalizeToken(localStorage.getItem('accessToken'));
      const rt = this.normalizeToken(localStorage.getItem('refreshToken'));
      this._accessToken.set(at);
      this._refreshToken.set(rt);
    }
  }

  setTokens(accessToken: string, refreshToken?: string) {
    this._accessToken.set(accessToken);
    if (this.isBrowser) localStorage.setItem('accessToken', accessToken);

    if (refreshToken) {
      this._refreshToken.set(refreshToken);
      if (this.isBrowser) localStorage.setItem('refreshToken', refreshToken);
    }
  }

  clear() {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    if (this.isBrowser) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  syncFromStorage() {
    if (!this.isBrowser) return;
    this._accessToken.set(this.normalizeToken(localStorage.getItem('accessToken')));
    this._refreshToken.set(this.normalizeToken(localStorage.getItem('refreshToken')));
  }
}
