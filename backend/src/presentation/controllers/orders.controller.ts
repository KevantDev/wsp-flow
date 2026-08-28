import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { OrdersService } from '../../application/services/orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from '../../application/dtos/order.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { OrderStatus } from '../../domain/entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getAll(@Query('status') status?: OrderStatus, @Query('customerPhone') customerPhone?: string) {
    return this.ordersService.getAll(status, customerPhone);
  }

  @Get('metrics')
  async getMetrics() {
    return this.ordersService.getMetrics();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.ordersService.getById(id);
  }

  @Post()
  async create(@Body() dto: CreateOrderDto, @CurrentUser('id') userId: string) {
    return this.ordersService.create(dto, userId);
  }

  /**
   * Endpoint público para procesar el checkout directo del Carrito de Compras Web
   */
  @Public()
  @Post('public-checkout')
  async publicCheckout(
    @Body()
    body: {
      customerName: string;
      customerPhone: string;
      customerAddress?: string;
      deliveryType?: 'PICKUP' | 'HOME_DELIVERY' | 'PROVINCE_AGENCY';
      district?: string;
      items: { productId: string; quantity: number }[];
      notes?: string;
    },
  ) {
    return this.ordersService.createPublicCheckoutOrder(body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.updateStatus(id, dto, userId);
  }
}

