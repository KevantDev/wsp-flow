import { CategoryEntity } from '../entities/category.entity';

export interface ICategoryRepository {
  findById(id: string): Promise<CategoryEntity | null>;
  findBySlug(slug: string): Promise<CategoryEntity | null>;
  findAll(onlyActive?: boolean): Promise<CategoryEntity[]>;
  create(category: Partial<CategoryEntity>): Promise<CategoryEntity>;
  update(id: string, category: Partial<CategoryEntity>): Promise<CategoryEntity>;
  delete(id: string): Promise<boolean>;
}

export const CATEGORY_REPOSITORY = 'CATEGORY_REPOSITORY';
