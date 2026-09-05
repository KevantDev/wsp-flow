import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bento-card',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block w-full',
  },
  template: `
    <div [class]="cardClasses">
      @if (glow) {
        <div class="absolute -top-20 -right-20 w-40 h-40 bg-indigo-50/60 rounded-full blur-2xl pointer-events-none"></div>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class BentoCardComponent {
  @Input() customClass = '';
  @Input() glow = false;

  get cardClasses(): string {
    const hasCustomPadding = /\bp-|\bpx-|\bpy-|\bpt-|\bpb-|\bpl-|\bpr-/.test(this.customClass);
    const defaultPadding = hasCustomPadding ? '' : 'p-5 md:p-6';
    return `relative overflow-hidden rounded-2xl md:rounded-3xl bg-white border border-zinc-200/80 ${defaultPadding} shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-zinc-300 transition-all duration-200 ease-out ${this.customClass}`.trim();
  }
}
