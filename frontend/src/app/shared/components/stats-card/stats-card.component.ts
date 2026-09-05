import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block w-full h-full',
  },
  template: `
    <div class="relative overflow-hidden rounded-2xl md:rounded-3xl bg-white border border-zinc-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-zinc-300 hover:-translate-y-0.5 transition-all duration-200 ease-out group h-full flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3.5">
          <span class="text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold">{{ title }}</span>
          <div [class]="'w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs transition-transform group-hover:scale-105 ' + iconClass">
            <ng-content select="[icon]"></ng-content>
          </div>
        </div>
        
        <div class="flex items-baseline gap-2.5 flex-wrap">
          <span class="text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-900 font-mono">{{ value }}</span>
          @if (trend) {
            <span [class]="'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ' + (trendUp ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' : 'bg-rose-50 text-rose-700 border-rose-200/70')">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                @if (trendUp) {
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                } @else {
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                }
              </svg>
              {{ trend }}
            </span>
          }
        </div>

        @if (subtitle) {
          <p class="text-xs text-zinc-500 font-normal mt-2 leading-relaxed">{{ subtitle }}</p>
        }
      </div>

      <!-- Decorative subtle bottom progress bar line -->
      <div class="mt-4 w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
        <div [class]="'h-full rounded-full transition-all duration-500 ' + (trendUp ? 'w-4/5 bg-indigo-500/80' : 'w-2/5 bg-amber-500/80')"></div>
      </div>
    </div>
  `,
})
export class StatsCardComponent {
  @Input() title = '';
  @Input() value = '';
  @Input() subtitle?: string;
  @Input() trend?: string;
  @Input() trendUp = true;
  @Input() iconClass = 'bg-zinc-50 text-zinc-700 border-zinc-200/80';
}
