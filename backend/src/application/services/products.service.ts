import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaProductRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-product.repository';
import { CreateProductDto, UpdateProductDto, UpdateStockDto } from '../dtos/product.dto';
import { WhatsAppGateway } from '../../presentation/gateways/whatsapp.gateway';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productRepo: PrismaProductRepository,
    private readonly wsGateway: WhatsAppGateway,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .concat('-', Math.random().toString(36).substring(2, 6));
  }

  async getAll(categoryId?: string, search?: string) {
    return this.productRepo.findAll({ categoryId, search });
  }

  async getById(id: string) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async getBySku(sku: string) {
    return this.productRepo.findBySku(sku);
  }

  async create(dto: CreateProductDto) {
    const existingSku = await this.productRepo.findBySku(dto.sku);
    if (existingSku) {
      throw new ConflictException(`Ya existe un producto con el SKU "${dto.sku}"`);
    }

    const slug = this.generateSlug(dto.name);
    return this.productRepo.create(
      {
        name: dto.name,
        slug,
        sku: dto.sku,
        description: dto.description || '',
        price: dto.price,
        costPrice: dto.costPrice,
        stock: dto.stock,
        minStockAlert: dto.minStockAlert ?? 5,
        isAvailable: dto.isAvailable ?? true,
        categoryId: dto.categoryId,
      },
      dto.images?.map((img, i) => ({ imageUrl: img.imageUrl, isPrimary: img.isPrimary ?? i === 0 })),
    );
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.getById(id);

    if (dto.sku) {
      const existingSku = await this.productRepo.findBySku(dto.sku);
      if (existingSku && existingSku.id !== id) {
        throw new ConflictException(`El SKU "${dto.sku}" ya está en uso por otro producto`);
      }
    }

    const updated = await this.productRepo.update(
      id,
      {
        name: dto.name,
        sku: dto.sku,
        description: dto.description,
        price: dto.price,
        costPrice: dto.costPrice,
        stock: dto.stock,
        minStockAlert: dto.minStockAlert,
        isAvailable: dto.isAvailable,
        categoryId: dto.categoryId,
      },
      dto.images?.map((img, i) => ({ imageUrl: img.imageUrl, isPrimary: img.isPrimary ?? i === 0 })),
    );

    if (updated.stock <= updated.minStockAlert) {
      this.wsGateway.emitStockAlert(updated);
    }

    return updated;
  }

  async updateStock(id: string, dto: UpdateStockDto) {
    await this.getById(id);
    const updated = await this.productRepo.updateStock(id, dto.stock);
    if (updated.stock <= updated.minStockAlert) {
      this.wsGateway.emitStockAlert(updated);
    }
    return updated;
  }

  async delete(id: string) {
    await this.getById(id);
    return this.productRepo.delete(id);
  }
}
