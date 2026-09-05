import { Controller, Get, Put, Body, UseGuards, Query } from '@nestjs/common';
import { CompanyConfigService } from '../../application/services/company-config.service';
import { UpdateCompanyConfigDto } from '../../application/dtos/company-config.dto';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Public } from '../../core/decorators/public.decorator';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';
import { Role } from '../../domain/entities/user.entity';

@Controller('settings')
export class CompanyConfigController {
  constructor(private readonly configService: CompanyConfigService) {}

  @Public()
  @Get()
  async getConfig(
    @CurrentTenant() tenantId: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    return this.configService.getConfig(queryTenantId || tenantId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put()
  async updateConfig(
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateCompanyConfigDto,
  ) {
    const targetTenantId = dto.tenantId || tenantId;
    return this.configService.updateConfig(targetTenantId, dto);
  }
}
