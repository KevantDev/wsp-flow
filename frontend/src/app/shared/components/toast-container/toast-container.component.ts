import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastItem } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- FLOATING TOASTS STACK (TOP-RIGHT)                                      -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <div
      class="fixed top-5 right-5 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      aria-live="polite"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto w-full rounded-2xl p-4 shadow-xl border backdrop-blur-xl transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3.5"
          [ngClass]="{
            'bg-white/95 border-emerald-200 text-zinc-900 shadow-emerald-500/5': toast.type === 'success',
            'bg-white/95 border-rose-200 text-zinc-900 shadow-rose-500/5': toast.type === 'error',
            'bg-white/95 border-amber-200 text-zinc-900 shadow-amber-500/5': toast.type === 'warning',
            'bg-white/95 border-indigo-200 text-zinc-900 shadow-indigo-500/5': toast.type === 'info'
          }"
        >
          <!-- Icon -->
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            [ngClass]="{
              'bg-emerald-100 text-emerald-600': toast.type === 'success',
              'bg-rose-100 text-rose-600': toast.type === 'error',
              'bg-amber-100 text-amber-600': toast.type === 'warning',
              'bg-indigo-100 text-indigo-600': toast.type === 'info'
            }"
          >
            @if (toast.type === 'success') {
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            } @else if (toast.type === 'error') {
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            } @else if (toast.type === 'warning') {
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            } @else {
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          </div>

          <!-- Text content -->
          <div class="flex-1 min-w-0 pt-0.5">
            @if (toast.title) {
              <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-0.5">{{ toast.title }}</h4>
            }
            <p class="text-sm font-medium text-zinc-800 leading-snug whitespace-pre-line">{{ toast.message }}</p>
          </div>

          <!-- Close button -->
          <button
            (click)="toastService.dismiss(toast.id)"
            class="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition-colors shrink-0"
            title="Cerrar notificación"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════ -->
    <!-- CONFIRMATION MODAL DIALOG (CENTERED)                                    -->
    <!-- ══════════════════════════════════════════════════════════════════════ -->
    @if (toastService.confirmDialog(); as dialog) {
      <div class="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in">
        <div
          class="relative w-full max-w-md rounded-3xl bg-white border border-zinc-200/90 shadow-2xl p-6 sm:p-7 space-y-5"
          role="alertdialog"
          aria-modal="true"
        >
          <!-- Top Icon & Header -->
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              [ngClass]="{
                'bg-rose-100 text-rose-600': dialog.type === 'danger',
                'bg-amber-100 text-amber-600': dialog.type === 'warning',
                'bg-indigo-100 text-indigo-600': dialog.type === 'info'
              }"
            >
              @if (dialog.type === 'danger') {
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              } @else {
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
            </div>

            <div class="space-y-1">
              <h3 class="text-lg font-bold text-zinc-900 tracking-tight">{{ dialog.title }}</h3>
              <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{{ dialog.message }}</p>
            </div>
          </div>

          <!-- Buttons Actions -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="dialog.resolve(false)"
              class="btn-secondary px-4 py-2 text-xs sm:text-sm font-semibold"
            >
              {{ dialog.cancelText }}
            </button>

            <button
              type="button"
              (click)="dialog.resolve(true)"
              [ngClass]="{
                'px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all': dialog.type === 'danger',
                'px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all': dialog.type === 'warning',
                'px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all': dialog.type === 'info'
              }"
            >
              {{ dialog.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
