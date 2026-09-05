import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';
import { BroadcastService, CreateCampaignInputDto } from '../../application/services/broadcast.service';

@Controller('broadcasts')
@UseGuards(JwtAuthGuard)
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  async estimateAudience(
    @Body() body: { targetSegment: string },
    @CurrentTenant() tenantId: string,
  ) {
    return this.broadcastService.estimateAudience(body.targetSegment || 'ALL_CUSTOMERS', tenantId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createCampaign(
    @Body() dto: CreateCampaignInputDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.broadcastService.createCampaign(dto, tenantId);
  }

  @Get()
  async getAllCampaigns(@CurrentTenant() tenantId: string) {
    return this.broadcastService.getAllCampaigns(tenantId);
  }

  @Get(':id')
  async getCampaignById(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.broadcastService.getCampaignById(id, tenantId);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  async startCampaign(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.broadcastService.startCampaign(id, tenantId);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  async pauseCampaign(@Param('id') id: string) {
    return this.broadcastService.pauseCampaign(id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelCampaign(@Param('id') id: string) {
    return this.broadcastService.cancelCampaign(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteCampaign(@Param('id') id: string) {
    return this.broadcastService.deleteCampaign(id);
  }

  // CRM: Cartera de Clientes
  @Get('customers/portfolio')
  async getCustomerPortfolio(@CurrentTenant() tenantId: string) {
    return this.broadcastService.getCustomerPortfolio(tenantId);
  }

  @Post('customers')
  @HttpCode(HttpStatus.CREATED)
  async addManualCustomer(
    @Body() body: { customerPhone: string; customerName: string; sendGreeting?: boolean },
    @CurrentTenant() tenantId: string,
  ) {
    return this.broadcastService.addCustomerManually(body, tenantId);
  }

  @Delete('customers/:idOrPhone')
  @HttpCode(HttpStatus.OK)
  async deleteCustomer(
    @Param('idOrPhone') idOrPhone: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.broadcastService.deleteCustomer(idOrPhone, tenantId);
  }
}
