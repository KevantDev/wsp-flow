import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IProductRepository } from '../../../../domain/repositories/product.repository.interface';
import { ProductEntity } from '../../../../domain/entities/product.entity';

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(p: any): ProductEntity {
    return new ProductEntity({
      id: p.id,
      tenantId: p.tenantId,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description,
      price: p.price,
      costPrice: p.costPrice,
      stock: p.stock,
      minStockAlert: p.minStockAlert,
      isAvailable: p.isAvailable,
      videoUrl: p.videoUrl,
      categoryId: p.categoryId,
      categoryName: p.category?.name,
      images: p.images?.map((img: any) => ({
        id: img.id,
        productId: img.productId,
        imageUrl: img.imageUrl,
        altText: img.altText,
        isPrimary: img.isPrimary,
        orderIndex: img.orderIndex,
        createdAt: img.createdAt,
      })),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }

  async findById(id: string, tenantId?: string): Promise<ProductEntity | null> {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    const product = await this.prisma.product.findFirst({
      where,
      include: { category: true, images: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!product) return null;
    return this.mapToEntity(product);
  }

  async findBySku(sku: string, tenantId?: string): Promise<ProductEntity | null> {
    const where: any = { sku };
    if (tenantId) where.tenantId = tenantId;

    const product = await this.prisma.product.findFirst({
      where,
      include: { category: true, images: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!product) return null;
    return this.mapToEntity(product);
  }

  async findBySlug(slug: string, tenantId?: string): Promise<ProductEntity | null> {
    const where: any = { slug };
    if (tenantId) where.tenantId = tenantId;

    const product = await this.prisma.product.findFirst({
      where,
      include: { category: true, images: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!product) return null;
    return this.mapToEntity(product);
  }

  async findAll(filters?: {
    tenantId?: string;
    categoryId?: string;
    search?: string;
    onlyAvailable?: boolean;
  }): Promise<ProductEntity[]> {
    const where: any = {};
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.onlyAvailable) where.isAvailable = true;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where,
      include: { category: true, images: { orderBy: { orderIndex: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return products.map((p) => this.mapToEntity(p));
  }

  async create(
    product: Partial<ProductEntity>,
    images?: { imageUrl: string; isPrimary: boolean; altText?: string }[],
  ): Promise<ProductEntity> {
    const created = await this.prisma.product.create({
      data: {
        tenantId: product.tenantId!,
        name: product.name!,
        slug: product.slug!,
        sku: product.sku!,
        description: product.description || '',
        price: product.price!,
        costPrice: product.costPrice,
        stock: product.stock ?? 0,
        minStockAlert: product.minStockAlert ?? 5,
        isAvailable: product.isAvailable ?? true,
        videoUrl: product.videoUrl,
        categoryId: product.categoryId!,
        images:
          images && images.length > 0
            ? {
                create: images.map((img, idx) => ({
                  imageUrl: img.imageUrl,
                  altText: img.altText,
                  isPrimary: img.isPrimary ?? idx === 0,
                  orderIndex: idx,
                })),
              }
            : undefined,
      },
      include: { category: true, images: true },
    });
    return this.mapToEntity(created);
  }

  async update(
    id: string,
    product: Partial<ProductEntity>,
    images?: { imageUrl: string; isPrimary: boolean; altText?: string }[],
  ): Promise<ProductEntity> {
    if (images && images.length > 0) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      await this.prisma.productImage.createMany({
        data: images.map((img, idx) => ({
          productId: id,
          imageUrl: img.imageUrl,
          altText: img.altText,
          isPrimary: img.isPrimary ?? idx === 0,
          orderIndex: idx,
        })),
      });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(product.name && { name: product.name }),
        ...(product.slug && { slug: product.slug }),
        ...(product.sku && { sku: product.sku }),
        ...(product.description !== undefined && { description: product.description }),
        ...(product.price !== undefined && { price: product.price }),
        ...(product.costPrice !== undefined && { costPrice: product.costPrice }),
        ...(product.stock !== undefined && { stock: product.stock }),
        ...(product.minStockAlert !== undefined && { minStockAlert: product.minStockAlert }),
        ...(product.isAvailable !== undefined && { isAvailable: product.isAvailable }),
        ...(product.videoUrl !== undefined && { videoUrl: product.videoUrl }),
        ...(product.categoryId && { categoryId: product.categoryId }),
      },
      include: { category: true, images: { orderBy: { orderIndex: 'asc' } } },
    });
    return this.mapToEntity(updated);
  }

  async updateStock(id: string, newStock: number): Promise<ProductEntity> {
    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: Math.max(0, newStock) },
      include: { category: true, images: true },
    });
    return this.mapToEntity(updated);
  }

  async decrementStock(id: string, quantity: number): Promise<ProductEntity> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Producto no encontrado');
    const newStock = Math.max(0, product.stock - quantity);
    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: { category: true, images: true },
    });
    return this.mapToEntity(updated);
  }

  async incrementStock(id: string, quantity: number): Promise<ProductEntity> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Producto no encontrado');
    const newStock = product.stock + quantity;
    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: { category: true, images: true },
    });
    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.product.delete({ where: { id } });
    return true;
  }

  async countTotal(tenantId?: string): Promise<number> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return this.prisma.product.count({ where });
  }

  async countLowStock(tenantId?: string): Promise<number> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    const products = await this.prisma.product.findMany({ where });
    return products.filter((p) => p.stock <= p.minStockAlert).length;
  }
}
