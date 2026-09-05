import { Controller, Get, Post } from '@nestjs/common';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';
import { Role } from '../../domain/entities/user.entity';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly baileysService: BaileysService) {}

  @Get('status')
  getStatus(@CurrentTenant() tenantId: string) {
    return this.baileysService.getStatus(tenantId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('connect')
  async connect(@CurrentTenant() tenantId: string) {
    await this.baileysService.initializeSocket(tenantId);
    return { message: 'Iniciando conexión de WhatsApp...' };
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('disconnect')
  async disconnect(@CurrentTenant() tenantId: string) {
    await this.baileysService.disconnect(tenantId);
    return { message: 'WhatsApp desconectado.' };
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('logout')
  async logout(@CurrentTenant() tenantId: string) {
    await this.baileysService.logout(tenantId);
    return { message: 'Sesión de WhatsApp cerrada y credenciales eliminadas.' };
  }
}
