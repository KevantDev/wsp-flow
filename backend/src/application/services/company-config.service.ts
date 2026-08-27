import { Injectable, Inject } from '@nestjs/common';
import { ICompanyConfigRepository } from '../../domain/repositories/company-config.repository.interface';
import { CompanyConfigEntity } from '../../domain/entities/company-config.entity';
import { UpdateCompanyConfigDto } from '../dtos/company-config.dto';

@Injectable()
export class CompanyConfigService {
  constructor(
    @Inject('ICompanyConfigRepository')
    private readonly configRepo: ICompanyConfigRepository,
  ) {}

  async getConfig(): Promise<CompanyConfigEntity> {
    return this.configRepo.getConfig();
  }

  async updateConfig(dto: UpdateCompanyConfigDto): Promise<CompanyConfigEntity> {
    return this.configRepo.updateConfig(dto);
  }
}
