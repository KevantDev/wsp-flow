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

  async getAll(onlyActive = false) {
    return this.categoryRepo.findAll(onlyActive);
  }

  async getById(id: string) {
    const cat = await this.categoryRepo.findById(id);
    if (!cat) throw new NotFoundException('Categoría no encontrada');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const slug = this.generateSlug(dto.name);
    const existing = await this.categoryRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictException('Ya existe una categoría con este nombre');
    }

    return this.categoryRepo.create({
      name: dto.name,
      slug,
      description: dto.description,
      imageUrl: dto.imageUrl,
      isActive: dto.isActive ?? true,
      orderIndex: dto.orderIndex ?? 0,
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.getById(id);
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

  async delete(id: string) {
    await this.getById(id);
    return this.categoryRepo.delete(id);
  }
}
