import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, OrderSource, PaymentMethod } from '../../domain/entities/order.entity';

export class CreateOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: 'El teléfono del cliente es obligatorio' })
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsEnum(OrderSource)
  @IsOptional()
  source?: OrderSource;

  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @IsEnum(PaymentMethod, { message: 'Método de pago inválido' })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Estado de pedido inválido' })
  @IsNotEmpty()
  status: OrderStatus;

  @IsString()
  @IsOptional()
  customMessage?: string;
}

export class MarkCashCollectedDto {
  @IsString()
  @IsOptional()
  notes?: string;
}
