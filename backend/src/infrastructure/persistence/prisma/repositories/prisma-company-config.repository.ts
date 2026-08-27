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
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    });
  }

  async getConfig(): Promise<CompanyConfigEntity> {
    let config = await this.prisma.companyConfig.findFirst();
    if (!config) {
      config = await this.prisma.companyConfig.create({
        data: {
          companyName: 'WSP Flow Commerce',
          businessDescription:
            'Tienda digital multirubro con atención y ventas automatizadas 24/7.',
          systemPrompt:
            'Eres Luna, la asesora comercial y asistente virtual de ventas experta de WSP Flow. Tu objetivo es atender a los clientes con calidez y precisión, responder dudas sobre productos, verificar stock real, enviar fotos o videos cuando lo soliciten y concretar pedidos de compra de forma fluida.',
          shippingPolicy:
            'Envíos express a todo el país en 24 a 48 horas hábiles.',
          paymentMethods:
            'Transferencia bancaria, tarjetas de crédito/débito y pago contra entrega.',
          workingHours: 'Lunes a Sábado de 09:00 a 20:00',
          address: 'Av. Principal 1234, Centro',
          aiModel: 'gpt-5.6-luna',
          aiTemperature: 0.7,
          antiBanDelayMinMs: 1500,
          antiBanDelayMaxMs: 3500,
          historyMessageLimit: 15,
        },
      });
    }
    return this.mapToEntity(config);
  }

  async updateConfig(data: Partial<CompanyConfigEntity>): Promise<CompanyConfigEntity> {
    const current = await this.getConfig();
    const updated = await this.prisma.companyConfig.update({
      where: { id: current.id },
      data: {
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.businessDescription !== undefined && { businessDescription: data.businessDescription }),
        ...(data.systemPrompt !== undefined && { systemPrompt: data.systemPrompt }),
        ...(data.shippingPolicy !== undefined && { shippingPolicy: data.shippingPolicy }),
        ...(data.paymentMethods !== undefined && { paymentMethods: data.paymentMethods }),
        ...(data.workingHours !== undefined && { workingHours: data.workingHours }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.aiModel !== undefined && { aiModel: data.aiModel }),
        ...(data.aiTemperature !== undefined && { aiTemperature: data.aiTemperature }),
        ...(data.antiBanDelayMinMs !== undefined && { antiBanDelayMinMs: data.antiBanDelayMinMs }),
        ...(data.antiBanDelayMaxMs !== undefined && { antiBanDelayMaxMs: data.antiBanDelayMaxMs }),
        ...(data.historyMessageLimit !== undefined && { historyMessageLimit: data.historyMessageLimit }),
      },
    });
    return this.mapToEntity(updated);
  }
}
