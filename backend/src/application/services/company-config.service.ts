import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ICompanyConfigRepository } from '../../domain/repositories/company-config.repository.interface';
import { CompanyConfigEntity } from '../../domain/entities/company-config.entity';
import { UpdateCompanyConfigDto } from '../dtos/company-config.dto';
import { TenantsService } from './tenants.service';

@Injectable()
export class CompanyConfigService {
  constructor(
    @Inject('ICompanyConfigRepository')
    private readonly configRepo: ICompanyConfigRepository,
    @Inject(forwardRef(() => TenantsService))
    private readonly tenantsService: TenantsService,
  ) {}

  async getConfig(tenantId?: string): Promise<CompanyConfigEntity> {
    return this.configRepo.getConfig(tenantId);
  }

  async updateConfig(tenantId: string, dto: UpdateCompanyConfigDto): Promise<CompanyConfigEntity> {
    const updated = await this.configRepo.updateConfig(tenantId, dto);
    // Invalidar caché de tienda pública para que los cambios se reflejen de inmediato
    this.tenantsService.invalidatePublicStoreCache();
    return updated;
  }
}
