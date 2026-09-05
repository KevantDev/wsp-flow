export enum TenantPlan {
  FREE_TRIAL = 'FREE_TRIAL',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
}

export class TenantEntity {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: TenantPlan;
  status: TenantStatus;
  maxProducts: number;
  maxBroadcasts: number;
  culqiPublicKey?: string;
  culqiPrivateKey?: string;
  mpPublicKey?: string;
  mpAccessToken?: string;
  mpRefreshToken?: string;
  mpUserId?: string;
  mpConnectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TenantEntity>) {
    Object.assign(this, partial);
  }
}
