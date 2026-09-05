import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { TenantsService } from '../../application/services/tenants.service';
import { RegisterStoreDto, UpdateTenantDto } from '../../application/dtos/tenant.dto';
import { Public } from '../../core/decorators/public.decorator';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '../../domain/entities/user.entity';
import { TenantPlan, TenantStatus } from '../../domain/entities/tenant.entity';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * Registro público de una nueva tienda / emprendedor (Onboarding)
   */
  @Public()
  @Post('register')
  async registerStore(@Body() dto: RegisterStoreDto) {
    return this.tenantsService.registerStore(dto);
  }

  /**
   * Obtiene la vista pública de una tienda (catálogo, datos de contacto, políticas)
   */
  @Public()
  @Get('public/:slug')
  async getPublicStore(@Param('slug') slug: string) {
    return this.tenantsService.getPublicStore(slug);
  }

  /**
   * ==========================================
   * RUTAS EXCLUSIVAS DE SUPER_ADMIN SAAS
   * ==========================================
   */

  /**
   * Métricas agregadas de la plataforma SaaS (MRR, GMV, Sockets, Planes)
   */
  @Roles(Role.SUPER_ADMIN)
  @Get('admin/metrics')
  async getAdminMetrics() {
    return this.tenantsService.getAdminMetrics();
  }

  /**
   * Lista todos los tenants con detalles enriquecidos (Dueño, Órdenes, GMV, WhatsApp)
   */
  @Roles(Role.SUPER_ADMIN)
  @Get()
  async getAllTenants() {
    return this.tenantsService.getEnrichedTenantsList();
  }

  /**
   * Cambiar el plan de un tenant (FREE_TRIAL, PRO, ENTERPRISE)
   */
  @Roles(Role.SUPER_ADMIN)
  @Patch(':id/plan')
  async updateTenantPlan(
    @Param('id') id: string,
    @Body('plan') plan: TenantPlan,
  ) {
    return this.tenantsService.updateTenantPlan(id, plan);
  }

  /**
   * Cambiar el estado de un tenant (ACTIVE, SUSPENDED, TRIAL_EXPIRED, CANCELLED)
   */
  @Roles(Role.SUPER_ADMIN)
  @Patch(':id/status')
  async updateTenantStatus(
    @Param('id') id: string,
    @Body('status') status: TenantStatus,
  ) {
    return this.tenantsService.updateTenantStatus(id, status);
  }

  /**
   * Suplantar identidad de la tienda (Impersonate) para soporte técnico
   */
  @Roles(Role.SUPER_ADMIN)
  @Post(':id/impersonate')
  async impersonateTenant(@Param('id') id: string) {
    return this.tenantsService.impersonateTenant(id);
  }

  /**
   * Forzar reinicio de socket de WhatsApp (Baileys) de una tienda
   */
  @Roles(Role.SUPER_ADMIN)
  @Post(':id/reset-whatsapp')
  async resetTenantWhatsApp(@Param('id') id: string) {
    return this.tenantsService.resetTenantWhatsApp(id);
  }

  /**
   * Eliminar un tenant permanentemente
   */
  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  async deleteTenant(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(id);
  }

  /**
   * ==========================================
   * RUTAS DE TENANT ACTUAL DEL USUARIO
   * ==========================================
   */

  /**
   * Obtiene la información del tenant actual del usuario autenticado
   */
  @Get('me')
  async getMyTenant(@CurrentTenant() tenantId: string) {
    if (!tenantId) {
      throw new UnauthorizedException('No perteneces a ninguna tienda');
    }
    return this.tenantsService.getTenantById(tenantId);
  }

  /**
   * Actualiza la información del tenant actual
   */
  @Patch('me')
  async updateMyTenant(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    if (!tenantId) {
      throw new UnauthorizedException('No perteneces a ninguna tienda');
    }
    return this.tenantsService.updateTenant(tenantId, dto);
  }
}
