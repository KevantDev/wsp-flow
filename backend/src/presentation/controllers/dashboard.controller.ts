import { Controller, Get } from '@nestjs/common';
import { DashboardService } from '../../application/services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  async getMetrics() {
    return this.dashboardService.getMetrics();
  }
}
