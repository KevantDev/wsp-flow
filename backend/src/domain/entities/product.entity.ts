export class ProductImageEntity {
  id: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  orderIndex: number;
  createdAt: Date;
}

export class ProductEntity {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStockAlert: number;
  isAvailable: boolean;
  categoryId: string;
  categoryName?: string;
  videoUrl?: string;
  images?: ProductImageEntity[];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProductEntity>) {
    Object.assign(this, partial);
  }

  isLowStock(): boolean {
    return this.stock <= this.minStockAlert;
  }

  canFulfillQuantity(quantity: number): boolean {
    return this.isAvailable && this.stock >= quantity;
  }
}
