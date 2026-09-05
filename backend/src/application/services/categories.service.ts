import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaCategoryRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoryRepo: PrismaCategoryRepository) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  async getAll(tenantId?: string, onlyActive = false) {
    return this.categoryRepo.findAll(tenantId, onlyActive);
  }

  async getById(id: string, tenantId?: string) {
    const cat = await this.categoryRepo.findById(id, tenantId);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async create(dto: CreateCategoryDto, tenantId: string) {
    const slug = this.generateSlug(dto.name);
    const existing = await this.categoryRepo.findBySlug(slug, tenantId);
    if (existing) {
      throw new ConflictException('Ya existe una categoría con este nombre');
    }

    return this.categoryRepo.create({
      tenantId,
      name: dto.name,
      slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      isActive: dto.isActive ?? true,
      orderIndex: dto.orderIndex ?? 0,
    });
  }

  async update(id: string, dto: UpdateCategoryDto, tenantId?: string) {
    await this.getById(id, tenantId);
    const slug = dto.name ? this.generateSlug(dto.name) : undefined;
    return this.categoryRepo.update(id, {
      name: dto.name,
      slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      isActive: dto.isActive,
      orderIndex: dto.orderIndex,
    });
  }

  async delete(id: string, tenantId?: string) {
    await this.getById(id, tenantId);
    return this.categoryRepo.delete(id);
  }
}
