import { CompanyConfigEntity } from '../entities/company-config.entity';

export interface ICompanyConfigRepository {
  getConfig(tenantId?: string): Promise<CompanyConfigEntity>;
  updateConfig(tenantId: string, data: Partial<CompanyConfigEntity>): Promise<CompanyConfigEntity>;
}
