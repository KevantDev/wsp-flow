import { Controller, Get, Post, Patch, Body, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { OrdersService } from '../../application/services/orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, MarkCashCollectedDto } from '../../application/dtos/order.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { OrderStatus } from '../../domain/entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getAll(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: OrderStatus,
    @Query('customerPhone') customerPhone?: string,
  ) {
    return this.ordersService.getAll(tenantId, status, customerPhone);
  }

  @Get('metrics')
  async getMetrics(@CurrentTenant() tenantId: string) {
    return this.ordersService.getMetrics(tenantId);
  }

  /**
   * Retorna todos los pedidos contra entrega pendientes de cobro en efectivo.
   */
  @Get('pending-cash')
  async getPendingCashOrders(@CurrentTenant() tenantId: string) {
    return this.ordersService.getPendingCashOrders(tenantId);
  }

  /**
   * Descarga de Boleta de Venta Electrónica oficial en formato PDF
   */
  @Public()
  @Get(':idOrOrderNumber/receipt-pdf')
  async getReceiptPdf(
    @Param('idOrOrderNumber') idOrOrderNumber: string,
    @Query('tenantId') queryTenantId: string,
    @Res() res: Response,
  ) {
    const { buffer, fileName } = await this.ordersService.generateReceiptPdf(idOrOrderNumber, queryTenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.ordersService.getById(id, tenantId);
  }

  @Post()
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.create(dto, tenantId, userId);
  }

  /**
   * Endpoint público para procesar el checkout directo del Carrito de Compras Web
   */
  @Public()
  @Post('public-checkout')
  async publicCheckout(
    @Body()
    body: {
      tenantId?: string;
      storeSlug?: string;
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
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.updateStatus(id, dto, tenantId, userId);
  }

  /**
   * Marca un pedido contra entrega como cobrado en efectivo.
   */
  @Patch(':id/collect-cash')
  async markCashCollected(
    @Param('id') id: string,
    @Body() _dto: MarkCashCollectedDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordersService.markCashCollected(id, userId, tenantId);
  }
}
