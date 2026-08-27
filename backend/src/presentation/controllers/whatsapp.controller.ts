import { Controller, Get, Post, Body } from '@nestjs/common';
import { BaileysService } from '../../infrastructure/whatsapp/baileys.service';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '../../domain/entities/user.entity';

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly baileysService: BaileysService) {}

  @Get('status')
  getStatus() {
    return this.baileysService.getStatus();
  }

  @Roles(Role.ADMIN)
  @Post('connect')
  async connect() {
    await this.baileysService.initializeSocket();
    return { message: 'Iniciando conexión de WhatsApp...' };
  }

  @Roles(Role.ADMIN)
  @Post('disconnect')
  async disconnect() {
    await this.baileysService.disconnect();
    return { message: 'WhatsApp desconectado.' };
  }

  @Roles(Role.ADMIN)
  @Post('logout')
  async logout() {
    await this.baileysService.logout();
    return { message: 'Sesión de WhatsApp cerrada y credenciales eliminadas.' };
  }
}
