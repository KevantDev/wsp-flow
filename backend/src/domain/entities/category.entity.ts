export class CategoryEntity {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<CategoryEntity>) {
    Object.assign(this, partial);
  }
}
