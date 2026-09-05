import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  toasts = signal<ToastItem[]>([]);
  confirmDialog = signal<ConfirmDialogOptions | null>(null);

  show(message: string, type: ToastType = 'info', title?: string, duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, title, message, duration };

    this.toasts.update((items) => [...items, item]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: string, title = 'Operación Exitosa') {
    this.show(message, 'success', title);
  }

  error(message: string, title = 'Ocurrió un Error') {
    this.show(message, 'error', title, 5000);
  }

  warning(message: string, title = 'Atención') {
    this.show(message, 'warning', title, 4500);
  }

  info(message: string, title = 'Información') {
    this.show(message, 'info', title);
  }

  dismiss(id: string) {
    this.toasts.update((items) => items.filter((t) => t.id !== id));
  }

  confirm(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.confirmDialog.set({
        title: options.title || '¿Estás seguro?',
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'danger',
        resolve: (result: boolean) => {
          this.confirmDialog.set(null);
          resolve(result);
        },
      });
    });
  }
}
