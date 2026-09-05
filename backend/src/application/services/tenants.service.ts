import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/persistence/prisma/prisma.service';
import { PrismaTenantRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-tenant.repository';
import { PrismaUserRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-user.repository';
import { PrismaCompanyConfigRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-company-config.repository';
import { PrismaWhatsAppSessionRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-whatsapp-session.repository';
import { PrismaProductRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-product.repository';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { RegisterStoreDto, UpdateTenantDto } from '../dtos/tenant.dto';
import { Role } from '../../domain/entities/user.entity';
import { TenantPlan, TenantStatus } from '../../domain/entities/tenant.entity';

@Injectable()
export class TenantsService {
  private readonly publicStoreCache = new Map<string, { data: any; expiresAt: number }>();
  private readonly STORE_CACHE_TTL_MS = 2 * 1000; // 2 segundos para actualización en tiempo real

  invalidatePublicStoreCache(slugOrTenantId?: string) {
    if (slugOrTenantId) {
      this.publicStoreCache.delete(slugOrTenantId.toLowerCase().trim());
    }
    this.publicStoreCache.clear();
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantRepo: PrismaTenantRepository,
    private readonly userRepo: PrismaUserRepository,
    private readonly configRepo: PrismaCompanyConfigRepository,
    private readonly sessionRepo: PrismaWhatsAppSessionRepository,
    private readonly productRepo: PrismaProductRepository,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => BaileysService))
    private readonly baileysService: BaileysService,
  ) {}

  /**
   * Registra un nuevo emprendedor / tienda en el SaaS (Onboarding)
   */
  async registerStore(dto: RegisterStoreDto) {
    const rawSlug = dto.storeSlug || dto.slug || dto.storeName.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const slug = rawSlug.toLowerCase().trim();
    if (!slug) {
      throw new BadRequestException('El enlace o slug web de la tienda es obligatorio');
    }

    const adminEmail = (dto.adminEmail || dto.email || '').toLowerCase().trim();
    if (!adminEmail) {
      throw new BadRequestException('El correo electrónico del administrador es obligatorio');
    }

    const adminFullName = (dto.adminFullName || dto.ownerName || '').trim();
    if (!adminFullName) {
      throw new BadRequestException('El nombre del administrador es obligatorio');
    }

    const adminPassword = dto.adminPassword || dto.password;
    if (!adminPassword || adminPassword.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres');
    }

    // 1. Validar que el slug no exista
    const existingTenant = await this.tenantRepo.findBySlug(slug);
    if (existingTenant) {
      throw new ConflictException(
        `El enlace web "${slug}" ya está en uso. Por favor elige otro.`,
      );
    }

    // 2. Validar que el email no esté registrado
    const existingUser = await this.userRepo.findByEmail(adminEmail);
    if (existingUser) {
      throw new ConflictException(
        `El correo electrónico "${adminEmail}" ya está registrado en la plataforma.`,
      );
    }

    // 3. Crear el Tenant (Tienda) — Predeterminado estrictamente en FREE_TRIAL
    const initialPlan = (dto.plan as TenantPlan) || TenantPlan.FREE_TRIAL;
    const tenant = await this.tenantRepo.create({
      name: dto.storeName.trim(),
      slug,
      plan: initialPlan,
      status: TenantStatus.ACTIVE,
    });

    // 4. Crear el Usuario Administrador de la Tienda
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const user = await this.userRepo.create({
      tenantId: tenant.id,
      email: adminEmail,
      passwordHash,
      fullName: adminFullName,
      phoneNumber: dto.phoneNumber,
      role: Role.ADMIN,
      isActive: true,
    });

    // 5. Crear la Configuración Inicial de la Empresa / IA
    await this.configRepo.getConfig(tenant.id);
    if (dto.businessCategory || dto.businessDescription) {
      const category = dto.businessCategory || 'comercio electrónico';
      await this.configRepo.updateConfig(tenant.id, {
        companyName: dto.storeName.trim(),
        businessDescription: dto.businessDescription || `Comercio especializado en ${category} con catálogo web y atención automatizada por WhatsApp.`,
        systemPrompt: `Eres Luna, la asesora comercial y asistente virtual de ventas experta de ${dto.storeName.trim()}. La tienda opera en el rubro de ${category}. Tu objetivo es asesorar a los clientes con calidez y precisión, responder dudas sobre productos, verificar stock real, enviar fotos cuando lo soliciten y concretar pedidos de compra de forma fluida.`,
      });
    }

    // 6. Crear la Sesión Inicial de WhatsApp lista para escanear QR
    await this.sessionRepo.getSession(tenant.id, 'default');

    // 7. Generar Token JWT con tenantId
    const payload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: tenant.id,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: `¡Tienda "${tenant.name}" creada exitosamente!`,
      accessToken,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
      },
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
      },
    };
  }

  /**
   * Obtiene la información pública de una tienda y su catálogo activo para clientes
   */
  async getPublicStore(slug: string) {
    const cleanSlug = slug.toLowerCase().trim();
    const cached = this.publicStoreCache.get(cleanSlug);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const tenant = await this.tenantRepo.findBySlug(cleanSlug);
    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new NotFoundException('Tienda no encontrada o temporalmente inactiva');
    }

    const [config, products, categories, session] = await Promise.all([
      this.configRepo.getConfig(tenant.id),
      this.productRepo.findAll({
        tenantId: tenant.id,
        onlyAvailable: true,
      }),
      this.prisma.category.findMany({
        where: { tenantId: tenant.id },
        orderBy: { name: 'asc' },
      }),
      this.sessionRepo.getSession(tenant.id, 'default'),
    ]);

    const result = {
      store: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        whatsappNumber: session?.phoneNumber,
        whatsappConnected: session?.status === 'CONNECTED',
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        plan: tenant.plan,
        culqiPublicKey: tenant.culqiPublicKey,
      },
      config: {
        companyName: config.companyName,
        businessDescription: config.businessDescription,
        shippingPolicy: config.shippingPolicy,
        paymentMethods: config.paymentMethods,
        workingHours: config.workingHours,
        address: config.address,
        pickupStoreAddress: config.pickupStoreAddress,
        pickupStoreHours: config.pickupStoreHours,
        deliveryZone1Price: config.deliveryZone1Price,
        deliveryZone2Price: config.deliveryZone2Price,
        deliveryZone3Price: config.deliveryZone3Price,
        deliveryProvincePrice: config.deliveryProvincePrice,
        freeShippingThreshold: config.freeShippingThreshold,
        storeTheme: config.storeTheme,
      },
      categories,
      products,
    };

    this.publicStoreCache.set(cleanSlug, { data: result, expiresAt: Date.now() + this.STORE_CACHE_TTL_MS });
    return result;
  }

  async getTenantById(tenantId: string) {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tienda no encontrada');
    return tenant;
  }

  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    return this.tenantRepo.update(tenantId, dto);
  }

  async getAllTenants() {
    return this.tenantRepo.findAll();
  }

  /**
   * ==========================================
   * MÉTODOS EXCLUSIVOS PARA SUPER_ADMIN SAAS
   * ==========================================
   */

  /**
   * Métricas globales de la plataforma SaaS (MRR, GMV, Tiendas, Sockets Baileys)
   */
  async getAdminMetrics() {
    const [
      allTenants,
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenueResult,
      connectedSessionsCount,
    ] = await Promise.all([
      this.prisma.tenant.findMany({ select: { status: true, plan: true } }),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: 'PAID' },
      }),
      this.prisma.whatsAppSession.count({ where: { status: 'CONNECTED' } }),
    ]);

    const totalTenants = allTenants.length;
    const activeTenants = allTenants.filter((t) => t.status === 'ACTIVE').length;
    const basicTenants = allTenants.filter((t) => t.plan === 'BASIC' && t.status === 'ACTIVE').length;
    const proTenants = allTenants.filter((t) => t.plan === 'PRO' && t.status === 'ACTIVE').length;
    const enterpriseTenants = allTenants.filter((t) => t.plan === 'ENTERPRISE' && t.status === 'ACTIVE').length;
    const trialTenants = allTenants.filter((t) => t.plan === 'FREE_TRIAL' && t.status === 'ACTIVE').length;

    // MRR en Soles (PEN) según PROJECT_SPECIFICATION.md: BASIC = S/ 49, PRO = S/ 99, ENTERPRISE = S/ 249
    const estimatedMrr = basicTenants * 49 + proTenants * 99 + enterpriseTenants * 249;
    const estimatedArr = estimatedMrr * 12;
    const totalGmv = Number(totalRevenueResult._sum.total || 0);

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants: totalTenants - activeTenants,
      planDistribution: {
        freeTrial: trialTenants,
        basic: basicTenants,
        pro: proTenants,
        enterprise: enterpriseTenants,
      },
      financials: {
        mrr: estimatedMrr,
        arr: estimatedArr,
        totalGmv,
        currency: 'PEN',
      },
      stats: {
        totalProducts,
        totalOrders,
        totalUsers,
        connectedWhatsAppSessions: connectedSessionsCount,
      },
    };
  }

  /**
   * Listado enriquecido de todos los tenants con detalles de dueño, métricas y estado Baileys
   */
  async getEnrichedTenantsList() {
    const [rawTenants, gmvGroups] = await Promise.all([
      this.prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            where: { role: 'ADMIN' },
            take: 1,
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
              chatSessions: true,
              users: true,
            },
          },
          whatsappSessions: {
            take: 1,
            select: {
              status: true,
              phoneNumber: true,
              updatedAt: true,
            },
          },
          planRef: true,
        },
      }),
      this.prisma.order.groupBy({
        by: ['tenantId'],
        where: { paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
    ]);

    const gmvMap = new Map<string, number>();
    for (const g of gmvGroups) {
      gmvMap.set(g.tenantId, Number(g._sum?.total || 0));
    }

    // Calcular GMV y cuotas por tenant en memoria
    const enrichedList = rawTenants.map((t) => {
      const gmv = gmvMap.get(t.id) || 0;
      const owner = t.users[0] || null;
      const wsSession = t.whatsappSessions[0] || null;

      // Límites dinámicos según el plan configurado en base de datos
      const maxProducts = t.planRef ? t.planRef.maxProducts : t.maxProducts;
      const maxBroadcasts = t.planRef ? t.planRef.maxBroadcasts : t.maxBroadcasts;
      const maxUsers = t.planRef ? t.planRef.maxUsers : 1;

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        plan: t.plan,
        planName: t.planRef?.name || t.plan,
        status: t.status,
        logoUrl: t.logoUrl,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        owner: owner
          ? {
              id: owner.id,
              name: owner.fullName,
              email: owner.email,
              phone: owner.phoneNumber,
              avatarUrl: owner.avatarUrl,
            }
          : null,
        metrics: {
          productCount: t._count.products,
          maxProducts,
          maxBroadcasts,
          userCount: t._count.users,
          maxUsers,
          orderCount: t._count.orders,
          chatCount: t._count.chatSessions,
          totalGmv: gmv,
        },
        whatsapp: {
          status: wsSession?.status || 'DISCONNECTED',
          phoneNumber: wsSession?.phoneNumber || null,
          lastActivity: wsSession?.updatedAt || null,
        },
      };
    });

    return enrichedList;
  }

  /**
   * Actualiza el plan de una tienda y sincroniza sus cuotas de productos y difusiones
   */
  async updateTenantPlan(tenantId: string, plan: TenantPlan) {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tienda no encontrada');

    const planConfig = await this.prisma.plan.findUnique({
      where: { code: plan },
    });

    const maxProducts = planConfig ? planConfig.maxProducts : tenant.maxProducts;
    const maxBroadcasts = planConfig ? planConfig.maxBroadcasts : tenant.maxBroadcasts;

    return this.tenantRepo.update(tenantId, {
      plan,
      maxProducts,
      maxBroadcasts,
    });
  }

  /**
   * Actualiza el estado de una tienda (ACTIVE, SUSPENDED, TRIAL_EXPIRED, CANCELLED)
   */
  async updateTenantStatus(tenantId: string, status: TenantStatus) {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tienda no encontrada');
    return this.tenantRepo.update(tenantId, { status });
  }

  /**
   * Suplanta la identidad (Impersonate) de una tienda para soporte técnico
   */
  async impersonateTenant(tenantId: string) {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tienda no encontrada');

    // Buscar el admin principal de la tienda
    const adminUser = await this.prisma.user.findFirst({
      where: { tenantId, role: 'ADMIN' },
    });

    if (!adminUser) {
      throw new NotFoundException('La tienda no cuenta con un administrador activo');
    }

    const payload = {
      sub: adminUser.id,
      email: adminUser.email,
      fullName: `[Soporte SuperAdmin] ${adminUser.fullName}`,
      role: Role.ADMIN,
      tenantId: tenant.id,
      isImpersonating: true,
      storeName: tenant.name,
      storeSlug: tenant.slug,
    };

    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: `Iniciando sesión como administrador de la tienda "${tenant.name}"`,
      impersonationToken: token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }

  /**
   * Reinicia forzosamente el socket de WhatsApp (Baileys) de un tenant
   */
  async resetTenantWhatsApp(tenantId: string) {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tienda no encontrada');

    await this.baileysService.restartTenantSocket(tenantId);

    return {
      success: true,
      message: `Socket de WhatsApp reiniciado exitosamente para la tienda "${tenant.name}". Un nuevo QR está disponible.`,
    };
  }

  /**
   * Elimina un tenant y todos sus registros vinculados
   */
  async deleteTenant(tenantId: string) {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new NotFoundException('Tienda no encontrada');

    await this.baileysService.disconnect(tenantId);
    await this.prisma.tenant.delete({ where: { id: tenantId } });

    return {
      success: true,
      message: `Tienda "${tenant.name}" eliminada permanentemente.`,
    };
  }
}
