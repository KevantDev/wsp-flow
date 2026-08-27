import { CompanyConfigEntity } from '../entities/company-config.entity';

export interface ICompanyConfigRepository {
  getConfig(): Promise<CompanyConfigEntity>;
  updateConfig(data: Partial<CompanyConfigEntity>): Promise<CompanyConfigEntity>;
}
