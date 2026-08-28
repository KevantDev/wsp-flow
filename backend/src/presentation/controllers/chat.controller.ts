import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ChatService } from '../../application/services/chat.service';
import { SendManualMessageDto, ToggleBotDto, CreateChatSessionDto } from '../../application/dtos/chat.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  async getAllSessions() {
    return this.chatService.getAllSessions();
  }

  @Post('sessions')
  async createSession(@Body() dto: CreateChatSessionDto) {
    return this.chatService.createOrGetSession(dto);
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
  async toggleBot(@Body() dto: ToggleBotDto) {
    return this.chatService.toggleBot(dto);
  }

  @Post('send')
  async sendManualMessage(@Body() dto: SendManualMessageDto, @CurrentUser('fullName') userName: string) {
    return this.chatService.sendManualMessage(dto, userName || 'Agente');
  }
}
