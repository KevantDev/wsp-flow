import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaPlanRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-plan.repository';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { UpdatePlanDto } from '../dtos/plan.dto';
import { TenantPlan } from '../../domain/entities/tenant.entity';

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  constructor(
    private readonly planRepo: PrismaPlanRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getAllPlans(activeOnly = true) {
    return this.planRepo.findAll(activeOnly);
  }

  async getAdminPlans() {
    const [plans, tenantCounts] = await Promise.all([
      this.planRepo.findAll(false),
      this.planRepo.countTenantsByPlan(),
    ]);

    return plans.map((plan) => ({
      ...plan,
      tenantsCount: tenantCounts[plan.code] || 0,
    }));
  }

  async getPlanByCode(code: TenantPlan) {
    const plan = await this.planRepo.findByCode(code);
    if (!plan) throw new NotFoundException(`Plan "${code}" no encontrado`);
    return plan;
  }

  async updatePlan(code: TenantPlan, dto: UpdatePlanDto) {
    const existing = await this.getPlanByCode(code);
    const { code: _c, id: _id, tenantsCount: _tc, syncTenantLimits, ...cleanData } = dto as any;

    const updated = await this.planRepo.update(code, cleanData);
    this.logger.log(`Plan [${code}] actualizado exitosamente por Super Admin.`);

    // Sincronizar límites con los tenants suscritos a este plan si se solicita o por defecto
    if (dto.syncTenantLimits || dto.maxProducts !== undefined || dto.maxBroadcasts !== undefined) {
      const updateData: any = {};
      if (dto.maxProducts !== undefined) updateData.maxProducts = dto.maxProducts;
      if (dto.maxBroadcasts !== undefined) updateData.maxBroadcasts = dto.maxBroadcasts;

      if (Object.keys(updateData).length > 0) {
        const result = await this.prisma.tenant.updateMany({
          where: { plan: code },
          data: updateData,
        });
        this.logger.log(`Sincronizados límites para ${result.count} tiendas en el plan [${code}].`);
      }
    }

    return updated;
  }

  /**
   * Valida rigurosamente si un tenant puede realizar una acción o si ha alcanzado sus cuotas
   */
  async checkTenantQuota(
    tenantId: string,
    resource: 'PRODUCT' | 'BROADCAST' | 'USER' | 'MERCADOPAGO' | 'CUSTOM_THEME',
    options?: { audienceSize?: number },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            products: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tienda no encontrada para verificar límites');
    }

    // Obtener la configuración del plan
    const plan = await this.planRepo.findByCode(tenant.plan as TenantPlan);
    const planName = plan?.name || tenant.plan;

    // 1. Verificación de Límite de Productos
    if (resource === 'PRODUCT') {
      const maxProducts = plan ? plan.maxProducts : tenant.maxProducts;
      if (maxProducts !== -1 && tenant._count.products >= maxProducts) {
        throw new ForbiddenException(
          `Has alcanzado el límite de ${maxProducts} productos permitidos para tu plan (${planName}). Actualiza a un plan superior para registrar más productos.`,
        );
      }
    }

    // 2. Verificación de Límite de Difusiones Mensuales CRM
    if (resource === 'BROADCAST') {
      const maxBroadcasts = plan ? plan.maxBroadcasts : tenant.maxBroadcasts;
      if (maxBroadcasts !== -1) {
        // Calcular difusiones enviadas en el mes calendario actual
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const currentMonthSent = await this.prisma.broadcastRecipient.count({
          where: {
            campaign: {
              tenantId,
              createdAt: { gte: startOfMonth },
            },
            status: 'SENT',
          },
        });

        const needed = options?.audienceSize || 1;
        if (currentMonthSent + needed > maxBroadcasts) {
          throw new ForbiddenException(
            `Esta campaña (${needed} destinatarios) excede tu límite mensual de ${maxBroadcasts} difusiones en el plan ${planName} (${currentMonthSent} ya enviadas este mes). Actualiza tu plan para ampliar tu cuota.`,
          );
        }
      }
    }

    // 3. Verificación de Límite de Usuarios / Subadmins
    if (resource === 'USER') {
      const maxUsers = plan?.maxUsers ?? 1;
      if (maxUsers !== -1 && tenant._count.users >= maxUsers) {
        throw new ForbiddenException(
          `Has alcanzado el límite de ${maxUsers} usuario(s) permitidos para tu plan (${planName}). Actualiza tu plan para incorporar más operadores o subadministradores.`,
        );
      }
    }

    // 4. Verificación de Acceso a Pasarela Mercado Pago
    if (resource === 'MERCADOPAGO') {
      const allowed = plan?.hasMercadoPago ?? (tenant.plan !== 'FREE_TRIAL');
      if (!allowed) {
        throw new ForbiddenException(
          `La integración con la pasarela de pagos Mercado Pago no está disponible en el plan ${planName}. Actualiza a un plan Basic o superior para cobrar automáticamente.`,
        );
      }
    }

    // 5. Verificación de Temas Avanzados de Tienda
    if (resource === 'CUSTOM_THEME') {
      const allowed = plan?.hasCustomThemes ?? (tenant.plan === 'PRO' || tenant.plan === 'ENTERPRISE');
      if (!allowed) {
        throw new ForbiddenException(
          `La personalización avanzada de temas visuales de tienda está reservada para los planes Pro y Enterprise. Tu plan actual es ${planName}.`,
        );
      }
    }

    return { tenant, plan };
  }
}
