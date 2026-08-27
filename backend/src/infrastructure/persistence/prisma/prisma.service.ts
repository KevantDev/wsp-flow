import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('📦 Conectado exitosamente a la base de datos PostgreSQL.');
    } catch (error) {
      this.logger.warn(`⚠️ No se pudo conectar a PostgreSQL en el arranque: ${error.message}. (Verifica que la base de datos esté activa).`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('📦 Desconectado de PostgreSQL.');
  }
}
