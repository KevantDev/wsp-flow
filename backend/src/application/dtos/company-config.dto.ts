import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateCompanyConfigDto {
  @IsOptional()
  id?: string;

  @IsOptional()
  createdAt?: any;

  @IsOptional()
  updatedAt?: any;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  businessDescription?: string;

  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @IsString()
  @IsOptional()
  shippingPolicy?: string;

  @IsString()
  @IsOptional()
  paymentMethods?: string;

  @IsString()
  @IsOptional()
  workingHours?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  aiModel?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(2)
  aiTemperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(500)
  @Max(10000)
  antiBanDelayMinMs?: number;

  @IsNumber()
  @IsOptional()
  @Min(1000)
  @Max(20000)
  antiBanDelayMaxMs?: number;

  @IsNumber()
  @IsOptional()
  @Min(5)
  @Max(50)
  historyMessageLimit?: number;
}
