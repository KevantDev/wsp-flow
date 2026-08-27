import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { CompanyConfigService } from '../../application/services/company-config.service';
import { UpdateCompanyConfigDto } from '../../application/dtos/company-config.dto';
import { Roles } from '../../core/decorators/roles.decorator';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Public } from '../../core/decorators/public.decorator';
import { Role } from '../../domain/entities/user.entity';

@Controller('settings')
export class CompanyConfigController {
  constructor(private readonly configService: CompanyConfigService) {}

  @Public()
  @Get()
  async getConfig() {
    return this.configService.getConfig();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put()
  async updateConfig(@Body() dto: UpdateCompanyConfigDto) {
    return this.configService.updateConfig(dto);
  }
}
