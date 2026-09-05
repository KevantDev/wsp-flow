import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { PlansService } from '../../application/services/plans.service';
import { UpdatePlanDto } from '../../application/dtos/plan.dto';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';
import { Role } from '../../domain/entities/user.entity';
import { TenantPlan } from '../../domain/entities/tenant.entity';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  /**
   * Obtiene la lista pública de planes activos de la plataforma (para pricing y landing)
   */
  @Public()
  @Get()
  async getPublicPlans() {
    return this.plansService.getAllPlans(true);
  }

  /**
   * Obtiene las métricas de consumo y cuotas del tenant autenticado
   */
  @Get('my-quota')
  async getMyQuota(@CurrentTenant() tenantId: string) {
    if (!tenantId) {
      throw new UnauthorizedException('No perteneces a ninguna tienda');
    }

    const { tenant, plan } = await this.plansService.checkTenantQuota(
      tenantId,
      'PRODUCT',
    ).catch((err) => {
      // Si arrojó ForbiddenException por límite de productos, aún queremos retornar el objeto de cuotas
      if (err.response) return err.response;
      throw err;
    });

    // Si falló por límite, obtener los datos directamente
    const res = await this.plansService.getAllPlans(false);
    const activePlan = res.find((p) => p.code === tenant?.plan);

    return {
      tenantId,
      planCode: tenant?.plan,
      planName: activePlan?.name || tenant?.plan,
      products: {
        used: (tenant as any)?._count?.products || 0,
        max: activePlan?.maxProducts ?? (tenant as any)?.maxProducts ?? 20,
        isUnlimited: (activePlan?.maxProducts ?? -1) === -1,
      },
      broadcasts: {
        max: activePlan?.maxBroadcasts ?? (tenant as any)?.maxBroadcasts ?? 50,
        isUnlimited: (activePlan?.maxBroadcasts ?? -1) === -1,
      },
      users: {
        used: (tenant as any)?._count?.users || 1,
        max: activePlan?.maxUsers ?? 1,
        isUnlimited: (activePlan?.maxUsers ?? 1) === -1,
      },
      features: {
        hasMercadoPago: activePlan?.hasMercadoPago ?? false,
        hasAiBot: activePlan?.hasAiBot ?? true,
        hasCustomThemes: activePlan?.hasCustomThemes ?? false,
        hasPdfCatalog: activePlan?.hasPdfCatalog ?? false,
      },
    };
  }

  /**
   * Obtiene todos los planes con conteo de suscriptores para el Super Admin
   */
  @Roles(Role.SUPER_ADMIN)
  @Get('admin')
  async getAdminPlans() {
    return this.plansService.getAdminPlans();
  }

  /**
   * Actualiza la configuración, precios o límites de un plan (Exclusivo Super Admin)
   */
  @Roles(Role.SUPER_ADMIN)
  @Patch(':code')
  async updatePlan(
    @Param('code') code: TenantPlan,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.updatePlan(code, dto);
  }
}
