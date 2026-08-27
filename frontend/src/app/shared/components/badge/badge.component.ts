import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      [class]="'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ' + getStyleClass()"
    >
      <span [class]="'w-1.5 h-1.5 rounded-full ' + getDotClass()"></span>
      <ng-content></ng-content>
    </span>
  `,
})
export class BadgeComponent {
  @Input() variant: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral' = 'neutral';

  getStyleClass(): string {
    switch (this.variant) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200/70';
      case 'danger':
        return 'bg-rose-50 text-rose-700 border-rose-200/70';
      case 'info':
        return 'bg-sky-50 text-sky-700 border-sky-200/70';
      case 'purple':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/70';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  }

  getDotClass(): string {
    switch (this.variant) {
      case 'success':
        return 'bg-emerald-500 animate-pulse';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-rose-500';
      case 'info':
        return 'bg-sky-500';
      case 'purple':
        return 'bg-indigo-500';
      default:
        return 'bg-zinc-400';
    }
  }
}
