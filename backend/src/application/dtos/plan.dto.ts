import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  Min,
} from 'class-validator';
import { TenantPlan } from '../../domain/entities/tenant.entity';

export class UpdatePlanDto {
  @IsOptional()
  code?: TenantPlan;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsNumber()
  tenantsCount?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  maxProducts?: number;

  @IsOptional()
  @IsNumber()
  maxBroadcasts?: number;

  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @IsOptional()
  @IsBoolean()
  hasMercadoPago?: boolean;

  @IsOptional()
  @IsBoolean()
  hasAiBot?: boolean;

  @IsOptional()
  @IsBoolean()
  hasCustomThemes?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPdfCatalog?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  badgeColor?: string;

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  syncTenantLimits?: boolean;
}
