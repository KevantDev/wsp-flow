import { TenantPlan } from './tenant.entity';

export class PlanEntity {
  id: string;
  code: TenantPlan;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  billingPeriod: string;
  maxProducts: number;
  maxBroadcasts: number;
  maxUsers: number;
  hasMercadoPago: boolean;
  hasAiBot: boolean;
  hasCustomThemes: boolean;
  hasPdfCatalog: boolean;
  features: string[];
  badgeColor: string;
  isPopular: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<PlanEntity>) {
    Object.assign(this, partial);
  }
}
