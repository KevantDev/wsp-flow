import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../../application/services/dashboard.service';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getMetrics(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getMetrics(tenantId);
  }
}
