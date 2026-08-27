import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
        <div class="relative w-full max-w-md overflow-hidden rounded-3xl bg-white border border-zinc-200 shadow-2xl p-6 md:p-8 text-center">
          
          <!-- Close button -->
          <button
            (click)="close.emit()"
            class="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-all"
          >
            ✕
          </button>

          <!-- Header -->
          <div class="inline-flex p-3 rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-200/60 shadow-sm">
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.82 2.791.82h.001c3.182 0 5.768-2.587 5.768-5.766.001-3.187-2.575-5.77-5.76-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.062-2.12-.533-1.428-.596-2.348-2.037-2.42-2.132-.07-.095-.572-.76-.572-1.45 0-.69.363-1.03.493-1.17.13-.14.284-.175.378-.175.095 0 .19.001.272.005.087.004.204-.033.319.243.119.287.408.995.444 1.068.036.073.06.158.012.254-.048.096-.072.155-.144.24-.072.084-.152.188-.217.252-.072.072-.147.151-.063.295.084.144.373.615.8 1 .552.492 1.018.644 1.162.716.144.072.228.06.313-.036.084-.096.36-419.456-.563.096-.144.192-.12.324-.072.132.048.84.396.984.468.144.072.24.108.276.168.036.06.036.348-.108.753z"/>
            </svg>
          </div>

          <h3 class="text-xl font-bold text-zinc-900 mb-1">Vincular WhatsApp Oficial</h3>
          <p class="text-xs text-zinc-500 mb-6">
            Abre WhatsApp en tu teléfono ➔ Dispositivos Vinculados ➔ Vincular Dispositivo y apunta la cámara a este código.
          </p>

          <!-- QR Container -->
          <div class="relative mx-auto w-64 h-64 p-3 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-inner flex items-center justify-center">
            @if (qrCode) {
              <img [src]="qrCode" alt="QR WhatsApp" class="w-full h-full object-contain rounded-lg" />
            } @else {
              <div class="flex flex-col items-center gap-3 text-zinc-400">
                <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-xs font-medium text-zinc-500">Generando QR con Baileys...</span>
              </div>
            }
          </div>

          <!-- Status helper -->
          <div class="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Esperando lectura del código en tiempo real...</span>
          </div>

        </div>
      </div>
    }
  `,
})
export class QrModalComponent {
  @Input() isOpen = false;
  @Input() qrCode: string | null = null;
  @Output() close = new EventEmitter<void>();
}
