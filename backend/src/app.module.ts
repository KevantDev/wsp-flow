import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

// Infrastructure - Persistence
import { PrismaService } from './infrastructure/persistence/prisma/prisma.service';
import { PrismaUserRepository } from './infrastructure/persistence/prisma/repositories/prisma-user.repository';
import { PrismaProductRepository } from './infrastructure/persistence/prisma/repositories/prisma-product.repository';
import { PrismaCategoryRepository } from './infrastructure/persistence/prisma/repositories/prisma-category.repository';
import { PrismaOrderRepository } from './infrastructure/persistence/prisma/repositories/prisma-order.repository';
import { PrismaChatRepository } from './infrastructure/persistence/prisma/repositories/prisma-chat.repository';
import { PrismaWhatsAppSessionRepository } from './infrastructure/persistence/prisma/repositories/prisma-whatsapp-session.repository';
import { PrismaCompanyConfigRepository } from './infrastructure/persistence/prisma/repositories/prisma-company-config.repository';

import { PrismaBroadcastRepository } from './infrastructure/persistence/prisma/repositories/prisma-broadcast.repository';

// Infrastructure - WhatsApp Engine & Payments
import { BaileysService } from './infrastructure/whatsapp/baileys.service';
import { BaileysFlowHandler } from './infrastructure/whatsapp/baileys-flow.handler';
import { AiService } from './infrastructure/ai/ai.service';
import { CatalogPdfService } from './infrastructure/pdf/catalog-pdf.service';
import { ReceiptPdfService } from './infrastructure/pdf/receipt-pdf.service';
import { CulqiService } from './infrastructure/payments/culqi.service';

// Application Services
import { AuthService } from './application/services/auth.service';
import { ProductsService } from './application/services/products.service';
import { CategoriesService } from './application/services/categories.service';
import { OrdersService } from './application/services/orders.service';
import { ChatService } from './application/services/chat.service';
import { UsersService } from './application/services/users.service';
import { DashboardService } from './application/services/dashboard.service';
import { CompanyConfigService } from './application/services/company-config.service';
import { DeliveryService } from './application/services/delivery.service';
import { OrderRecoveryService } from './application/services/order-recovery.service';
import { BroadcastService } from './application/services/broadcast.service';

// Presentation - Gateways & Controllers
import { WhatsAppGateway } from './presentation/gateways/whatsapp.gateway';
import { AppController } from './app.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { ProductsController } from './presentation/controllers/products.controller';
import { CategoriesController } from './presentation/controllers/categories.controller';
import { OrdersController } from './presentation/controllers/orders.controller';
import { WhatsAppController } from './presentation/controllers/whatsapp.controller';
import { ChatController } from './presentation/controllers/chat.controller';
import { UsersController } from './presentation/controllers/users.controller';
import { DashboardController } from './presentation/controllers/dashboard.controller';
import { UploadController } from './presentation/controllers/upload.controller';
import { CompanyConfigController } from './presentation/controllers/company-config.controller';
import { PaymentsController } from './presentation/controllers/payments.controller';
import { BroadcastController } from './presentation/controllers/broadcast.controller';

// Core Security
import { JwtStrategy } from './core/strategies/jwt.strategy';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { RolesGuard } from './core/guards/roles.guard';

import { PrismaTenantRepository } from './infrastructure/persistence/prisma/repositories/prisma-tenant.repository';
import { PrismaPlanRepository } from './infrastructure/persistence/prisma/repositories/prisma-plan.repository';
import { TenantsService } from './application/services/tenants.service';
import { PlansService } from './application/services/plans.service';
import { TenantsController } from './presentation/controllers/tenants.controller';
import { PlansController } from './presentation/controllers/plans.controller';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderEventsListener } from './application/listeners/order-events.listener';
import { MercadoPagoService } from './infrastructure/payments/mercadopago.service';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'wsp_flow_super_secret_jwt_access_key_2026_x99',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [
    AppController,
    AuthController,
    TenantsController,
    ProductsController,
    CategoriesController,
    OrdersController,
    WhatsAppController,
    ChatController,
    UsersController,
    DashboardController,
    UploadController,
    CompanyConfigController,
    PaymentsController,
    BroadcastController,
    PlansController,
  ],
  providers: [
    // Prisma & Repositories
    PrismaService,
    PrismaTenantRepository,
    PrismaPlanRepository,
    PrismaUserRepository,
    PrismaProductRepository,
    PrismaCategoryRepository,
    PrismaOrderRepository,
    PrismaChatRepository,
    PrismaWhatsAppSessionRepository,
    PrismaCompanyConfigRepository,
    PrismaBroadcastRepository,
    {
      provide: 'ICompanyConfigRepository',
      useExisting: PrismaCompanyConfigRepository,
    },

    // WhatsApp Engine & AI Assistant & PDF Generator & Payments
    BaileysService,
    BaileysFlowHandler,
    WhatsAppGateway,
    AiService,
    CatalogPdfService,
    ReceiptPdfService,
    CulqiService,
    MercadoPagoService,

    // Services
    AuthService,
    TenantsService,
    PlansService,
    ProductsService,
    CategoriesService,
    OrdersService,
    ChatService,
    UsersService,
    DashboardService,
    CompanyConfigService,
    DeliveryService,
    OrderRecoveryService,
    BroadcastService,
    OrderEventsListener,

    // Security & Guards
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
