import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TenantEntity, TenantPlan, TenantStatus } from '../../../../domain/entities/tenant.entity';

@Injectable()
export class PrismaTenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(t: any): TenantEntity {
    return new TenantEntity({
      id: t.id,
      name: t.name,
      slug: t.slug,
      logoUrl: t.logoUrl,
      plan: t.plan as TenantPlan,
      status: t.status as TenantStatus,
      maxProducts: t.maxProducts,
      maxBroadcasts: t.maxBroadcasts,
      culqiPublicKey: t.culqiPublicKey,
      culqiPrivateKey: t.culqiPrivateKey,
      mpPublicKey: t.mpPublicKey,
      mpAccessToken: t.mpAccessToken,
      mpRefreshToken: t.mpRefreshToken,
      mpUserId: t.mpUserId,
      mpConnectedAt: t.mpConnectedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    });
  }

  async findById(id: string): Promise<TenantEntity | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    if (!tenant) return null;
    return this.mapToEntity(tenant);
  }

  async findBySlug(slug: string): Promise<TenantEntity | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (!tenant) return null;
    return this.mapToEntity(tenant);
  }

  async findAll(): Promise<TenantEntity[]> {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return tenants.map((t) => this.mapToEntity(t));
  }

  async create(data: {
    name: string;
    slug: string;
    logoUrl?: string;
    plan?: TenantPlan;
    status?: TenantStatus;
    culqiPublicKey?: string;
    culqiPrivateKey?: string;
    mpPublicKey?: string;
    mpAccessToken?: string;
  }): Promise<TenantEntity> {
    const created = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        logoUrl: data.logoUrl,
        plan: (data.plan as any) || 'FREE_TRIAL',
        status: (data.status as any) || 'ACTIVE',
        culqiPublicKey: data.culqiPublicKey,
        culqiPrivateKey: data.culqiPrivateKey,
        mpPublicKey: data.mpPublicKey,
        mpAccessToken: data.mpAccessToken,
      },
    });
    return this.mapToEntity(created);
  }

  async update(id: string, data: Partial<TenantEntity>): Promise<TenantEntity> {
    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.plan && { plan: data.plan as any }),
        ...(data.status && { status: data.status as any }),
        ...(data.culqiPublicKey !== undefined && { culqiPublicKey: data.culqiPublicKey }),
        ...(data.culqiPrivateKey !== undefined && { culqiPrivateKey: data.culqiPrivateKey }),
        ...(data.mpPublicKey !== undefined && { mpPublicKey: data.mpPublicKey }),
        ...(data.mpAccessToken !== undefined && { mpAccessToken: data.mpAccessToken }),
        ...(data.mpRefreshToken !== undefined && { mpRefreshToken: data.mpRefreshToken }),
        ...(data.mpUserId !== undefined && { mpUserId: data.mpUserId }),
        ...(data.mpConnectedAt !== undefined && { mpConnectedAt: data.mpConnectedAt }),
        ...(data.maxProducts !== undefined && { maxProducts: data.maxProducts }),
        ...(data.maxBroadcasts !== undefined && { maxBroadcasts: data.maxBroadcasts }),
      },
    });
    return this.mapToEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tenant.delete({
      where: { id },
    });
  }
}
