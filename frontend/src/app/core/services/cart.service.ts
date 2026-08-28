import { Injectable, signal, computed, effect } from '@angular/core';
import { Product } from '../models/models';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly STORAGE_KEY = 'wsp_flow_shopping_cart';

  // Signals
  items = signal<CartItem[]>(this.loadFromStorage());
  isOpen = signal<boolean>(false);

  // Computeds
  itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0),
  );

  subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );

  constructor() {
    // Sincronizar reactivamente con LocalStorage
    effect(() => {
      const current = this.items();
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(current));
      } catch (e) {
        console.error('Error guardando carrito en localStorage:', e);
      }
    });
  }

  private loadFromStorage(): CartItem[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  toggle() {
    this.isOpen.update((v) => !v);
  }

  addItem(product: Product, quantity = 1) {
    this.items.update((current) => {
      const existingIndex = current.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...current];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQty, product.stock || 99),
        };
        return updated;
      } else {
        return [...current, { product, quantity: Math.min(quantity, product.stock || 99) }];
      }
    });
    this.open();
  }

  removeItem(productId: string) {
    this.items.update((current) => current.filter((i) => i.product.id !== productId));
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this.items.update((current) =>
      current.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock || 99;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      }),
    );
  }

  clear() {
    this.items.set([]);
  }
}
