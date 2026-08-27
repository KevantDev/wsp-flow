import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ProductImageDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'El SKU es obligatorio' })
  sku: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  costPrice?: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minStockAlert?: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsString()
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  categoryId: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsArray()
  @IsOptional()
  images?: ProductImageDto[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsNumber()
  @IsOptional()
  minStockAlert?: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsArray()
  @IsOptional()
  images?: ProductImageDto[];
}

export class UpdateStockDto {
  @IsNumber()
  @Min(0, { message: 'El stock debe ser 0 o superior' })
  stock: number;
}
