import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ICategoryRepository } from '../../../../domain/repositories/category.repository.interface';
import { CategoryEntity } from '../../../../domain/entities/category.entity';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  private readonly cache = new Map<string, { data: CategoryEntity[]; expiresAt: number }>();
  private readonly TTL_MS = 3 * 60 * 1000; // 3 minutos

  constructor(private readonly prisma: PrismaService) {}

  private clearCache() {
    this.cache.clear();
  }

  async findById(id: string, tenantId?: string): Promise<CategoryEntity | null> {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    const c = await this.prisma.category.findFirst({ where });
    if (!c) return null;
    return new CategoryEntity(c);
  }

  async findBySlug(slug: string, tenantId?: string): Promise<CategoryEntity | null> {
    const where: any = { slug };
    if (tenantId) where.tenantId = tenantId;
    const c = await this.prisma.category.findFirst({ where });
    if (!c) return null;
    return new CategoryEntity(c);
  }

  async findAll(tenantId?: string, onlyActive = false): Promise<CategoryEntity[]> {
    const cacheKey = `${tenantId || '__all__'}_${onlyActive}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    if (onlyActive) where.isActive = true;

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });
    const result = categories.map((c) => new CategoryEntity(c));
    this.cache.set(cacheKey, { data: result, expiresAt: Date.now() + this.TTL_MS });
    return result;
  }

  async create(category: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const created = await this.prisma.category.create({
      data: {
        tenantId: category.tenantId!,
        name: category.name!,
        slug: category.slug!,
        description: category.description,
        imageUrl: category.imageUrl,
        isActive: category.isActive ?? true,
        orderIndex: category.orderIndex ?? 0,
      },
    });
    this.clearCache();
    return new CategoryEntity(created);
  }

  async update(id: string, category: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(category.name && { name: category.name }),
        ...(category.slug && { slug: category.slug }),
        ...(category.description !== undefined && { description: category.description }),
        ...(category.imageUrl !== undefined && { imageUrl: category.imageUrl }),
        ...(category.isActive !== undefined && { isActive: category.isActive }),
        ...(category.orderIndex !== undefined && { orderIndex: category.orderIndex }),
      },
    });
    this.clearCache();
    return new CategoryEntity(updated);
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.category.delete({ where: { id } });
    this.clearCache();
    return true;
  }
}
