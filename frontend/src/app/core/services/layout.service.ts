import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  isMobileMenuOpen = signal(false);

  toggleMenu() {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMenu() {
    this.isMobileMenuOpen.set(false);
  }
}
