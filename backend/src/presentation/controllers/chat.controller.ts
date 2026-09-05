import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ChatService } from '../../application/services/chat.service';
import { SendManualMessageDto, ToggleBotDto, CreateChatSessionDto } from '../../application/dtos/chat.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  async getAllSessions(@CurrentTenant() tenantId: string) {
    return this.chatService.getAllSessions(tenantId);
  }

  @Post('sessions')
  async createSession(@Body() dto: CreateChatSessionDto, @CurrentTenant() tenantId: string) {
    return this.chatService.createOrGetSession(dto, tenantId);
  }

  @Get('sessions/:id/messages')
  async getSessionMessages(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.chatService.getSessionMessages(id, limit, offset);
  }

  @Post('toggle-bot')
  async toggleBot(@Body() dto: ToggleBotDto, @CurrentTenant() tenantId: string) {
    return this.chatService.toggleBot(dto, tenantId);
  }

  @Post('send')
  async sendManualMessage(
    @Body() dto: SendManualMessageDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser('fullName') userName: string,
  ) {
    return this.chatService.sendManualMessage(dto, tenantId, userName || 'Agente');
  }
}
