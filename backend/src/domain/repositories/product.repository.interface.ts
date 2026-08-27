import { ProductEntity } from '../entities/product.entity';

export interface IProductRepository {
  findById(id: string): Promise<ProductEntity | null>;
  findBySku(sku: string): Promise<ProductEntity | null>;
  findBySlug(slug: string): Promise<ProductEntity | null>;
  findAll(filters?: { categoryId?: string; search?: string; onlyAvailable?: boolean }): Promise<ProductEntity[]>;
  create(product: Partial<ProductEntity>, images?: { imageUrl: string; isPrimary: boolean }[]): Promise<ProductEntity>;
  update(id: string, product: Partial<ProductEntity>, images?: { imageUrl: string; isPrimary: boolean }[]): Promise<ProductEntity>;
  updateStock(id: string, newStock: number): Promise<ProductEntity>;
  decrementStock(id: string, quantity: number): Promise<ProductEntity>;
  delete(id: string): Promise<boolean>;
  countTotal(): Promise<number>;
  countLowStock(): Promise<number>;
}

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';
