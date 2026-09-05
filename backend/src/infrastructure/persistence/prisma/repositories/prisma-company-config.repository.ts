import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ICompanyConfigRepository } from '../../../../domain/repositories/company-config.repository.interface';
import { CompanyConfigEntity } from '../../../../domain/entities/company-config.entity';

@Injectable()
export class PrismaCompanyConfigRepository implements ICompanyConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(c: any): CompanyConfigEntity {
    return new CompanyConfigEntity({
      id: c.id,
      tenantId: c.tenantId,
      companyName: c.companyName,
      businessDescription: c.businessDescription,
      systemPrompt: c.systemPrompt,
      shippingPolicy: c.shippingPolicy,
      paymentMethods: c.paymentMethods,
      workingHours: c.workingHours,
      address: c.address,
      aiModel: c.aiModel,
      aiTemperature: c.aiTemperature,
      antiBanDelayMinMs: c.antiBanDelayMinMs,
      antiBanDelayMaxMs: c.antiBanDelayMaxMs,
      historyMessageLimit: c.historyMessageLimit,
      pickupStoreAddress: c.pickupStoreAddress || 'Av. Larco 743, Miraflores, Lima',
      pickupStoreHours: c.pickupStoreHours || 'Lunes a Sábados de 09:00 a 20:00',
      deliveryZone1Price: c.deliveryZone1Price ?? 10.0,
      deliveryZone2Price: c.deliveryZone2Price ?? 15.0,
      deliveryZone3Price: c.deliveryZone3Price ?? 20.0,
      deliveryProvincePrice: c.deliveryProvincePrice ?? 15.0,
      freeShippingThreshold: c.freeShippingThreshold ?? 0.0,
      storeTheme: c.storeTheme ?? undefined,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    });
  }

  async getConfig(tenantId?: string): Promise<CompanyConfigEntity> {
    const cleanTenantId = tenantId && tenantId.trim() !== '' ? tenantId.trim() : undefined;

    let config = cleanTenantId
      ? await this.prisma.companyConfig.findUnique({ where: { tenantId: cleanTenantId } })
      : await this.prisma.companyConfig.findFirst();

    if (!config) {
      if (cleanTenantId) {
        config = await this.prisma.companyConfig.create({
          data: {
            tenantId: cleanTenantId,
            companyName: 'WSP Flow Store',
            businessDescription:
              'Tienda digital de comercio electrónico con atención y ventas automatizadas 24/7.',
            systemPrompt:
              'Eres Luna, la asesora comercial y asistente virtual de ventas experta de la tienda. Tu objetivo es atender a los clientes con calidez y precisión, responder dudas sobre productos, verificar stock real, enviar fotos o videos cuando lo soliciten y concretar pedidos de compra de forma fluida.',
            shippingPolicy:
              'Envíos express a todo el país en 24 a 48 horas hábiles.',
            paymentMethods:
              'Transferencia bancaria, Yape, tarjetas de crédito/débito y pago contra entrega.',
            workingHours: 'Lunes a Sábado de 09:00 a 20:00',
            address: 'Av. Principal 1234, Centro',
            aiModel: 'gpt-4o-mini',
            aiTemperature: 0.7,
            antiBanDelayMinMs: 1500,
            antiBanDelayMaxMs: 3500,
            historyMessageLimit: 15,
          },
        });
      } else {
        throw new Error('No se encontró configuración y no se proveyó tenantId');
      }
    }

    return this.mapToEntity(config);
  }

  async updateConfig(tenantId: string, data: Partial<CompanyConfigEntity>): Promise<CompanyConfigEntity> {
    const cleanTenantId = tenantId && tenantId.trim() !== '' ? tenantId.trim() : undefined;
    const current = await this.getConfig(cleanTenantId);
    const { id, tenantId: _, createdAt, updatedAt, ...cleanData } = data as any;
    const updated = await this.prisma.companyConfig.update({
      where: { id: current.id },
      data: cleanData,
    });

    return this.mapToEntity(updated);
  }
}
