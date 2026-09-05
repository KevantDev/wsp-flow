import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlanEntity } from '../../../../domain/entities/plan.entity';
import { TenantPlan } from '../../../../domain/entities/tenant.entity';

@Injectable()
export class PrismaPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = false): Promise<PlanEntity[]> {
    const plans = await this.prisma.plan.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { price: 'asc' },
    });

    return plans.map(
      (p) =>
        new PlanEntity({
          ...p,
          code: p.code as TenantPlan,
        }),
    );
  }

  async findByCode(code: TenantPlan): Promise<PlanEntity | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { code },
    });

    if (!plan) return null;
    return new PlanEntity({
      ...plan,
      code: plan.code as TenantPlan,
    });
  }

  async update(code: TenantPlan, data: Partial<PlanEntity>): Promise<PlanEntity> {
    const updated = await this.prisma.plan.update({
      where: { code },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.billingPeriod !== undefined && { billingPeriod: data.billingPeriod }),
        ...(data.maxProducts !== undefined && { maxProducts: data.maxProducts }),
        ...(data.maxBroadcasts !== undefined && { maxBroadcasts: data.maxBroadcasts }),
        ...(data.maxUsers !== undefined && { maxUsers: data.maxUsers }),
        ...(data.hasMercadoPago !== undefined && { hasMercadoPago: data.hasMercadoPago }),
        ...(data.hasAiBot !== undefined && { hasAiBot: data.hasAiBot }),
        ...(data.hasCustomThemes !== undefined && { hasCustomThemes: data.hasCustomThemes }),
        ...(data.hasPdfCatalog !== undefined && { hasPdfCatalog: data.hasPdfCatalog }),
        ...(data.features !== undefined && { features: data.features }),
        ...(data.badgeColor !== undefined && { badgeColor: data.badgeColor }),
        ...(data.isPopular !== undefined && { isPopular: data.isPopular }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return new PlanEntity({
      ...updated,
      code: updated.code as TenantPlan,
    });
  }

  async countTenantsByPlan(): Promise<Record<string, number>> {
    const groups = await this.prisma.tenant.groupBy({
      by: ['plan'],
      _count: { _all: true },
    });

    const result: Record<string, number> = {};
    for (const g of groups) {
      result[g.plan] = g._count._all;
    }
    return result;
  }
}
