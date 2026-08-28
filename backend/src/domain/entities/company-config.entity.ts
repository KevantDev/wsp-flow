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
  pickupStoreAddress?: string;
  pickupStoreHours?: string;
  deliveryZone1Price?: number;
  deliveryZone2Price?: number;
  deliveryZone3Price?: number;
  deliveryProvincePrice?: number;
  freeShippingThreshold?: number;
  updatedAt: Date;
  createdAt: Date;

  constructor(partial: Partial<CompanyConfigEntity>) {
    Object.assign(this, partial);
  }
}
