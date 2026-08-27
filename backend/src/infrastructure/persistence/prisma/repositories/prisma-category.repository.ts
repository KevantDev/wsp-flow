import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ICategoryRepository } from '../../../../domain/repositories/category.repository.interface';
import { CategoryEntity } from '../../../../domain/entities/category.entity';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CategoryEntity | null> {
    const c = await this.prisma.category.findUnique({ where: { id } });
    if (!c) return null;
    return new CategoryEntity(c);
  }

  async findBySlug(slug: string): Promise<CategoryEntity | null> {
    const c = await this.prisma.category.findUnique({ where: { slug } });
    if (!c) return null;
    return new CategoryEntity(c);
  }

  async findAll(onlyActive = false): Promise<CategoryEntity[]> {
    const categories = await this.prisma.category.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { orderIndex: 'asc' },
    });
    return categories.map((c) => new CategoryEntity(c));
  }

  async create(category: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const created = await this.prisma.category.create({
      data: {
        name: category.name!,
        slug: category.slug!,
        description: category.description,
        imageUrl: category.imageUrl,
        isActive: category.isActive ?? true,
        orderIndex: category.orderIndex ?? 0,
      },
    });
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
    return new CategoryEntity(updated);
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.category.delete({ where: { id } });
    return true;
  }
}
