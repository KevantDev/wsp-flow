import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches, IsEnum } from 'class-validator';
import { TenantPlan, TenantStatus } from '../../domain/entities/tenant.entity';

export class RegisterStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la tienda es obligatorio' })
  storeName: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo puede contener letras minúsculas, números y guiones' })
  storeSlug?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo puede contener letras minúsculas, números y guiones' })
  slug?: string;

  @IsString()
  @IsOptional()
  adminFullName?: string;

  @IsString()
  @IsOptional()
  ownerName?: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsOptional()
  adminEmail?: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsOptional()
  adminPassword?: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsEnum(TenantPlan)
  @IsOptional()
  plan?: TenantPlan;

  @IsString()
  @IsOptional()
  businessCategory?: string;

  @IsString()
  @IsOptional()
  businessDescription?: string;
}

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsEnum(TenantPlan)
  @IsOptional()
  plan?: TenantPlan;

  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus;

  @IsString()
  @IsOptional()
  culqiPublicKey?: string;

  @IsString()
  @IsOptional()
  culqiPrivateKey?: string;

  @IsString()
  @IsOptional()
  mpPublicKey?: string;

  @IsString()
  @IsOptional()
  mpAccessToken?: string;

  @IsString()
  @IsOptional()
  mpRefreshToken?: string;

  @IsString()
  @IsOptional()
  mpUserId?: string;
}
