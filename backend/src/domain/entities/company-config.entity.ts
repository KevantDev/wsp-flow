export class CompanyConfigEntity {
  id: string;
  companyName: string;
  businessDescription: string;
  systemPrompt: string;
  shippingPolicy: string;
  paymentMethods: string;
  workingHours: string;
  address: string;
  aiModel: string;
  aiTemperature: number;
  antiBanDelayMinMs: number;
  antiBanDelayMaxMs: number;
  historyMessageLimit: number;
  updatedAt: Date;
  createdAt: Date;

  constructor(partial: Partial<CompanyConfigEntity>) {
    Object.assign(this, partial);
  }
}
