import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatService } from '../../application/services/chat.service';
import { SendManualMessageDto, ToggleBotDto } from '../../application/dtos/chat.dto';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('sessions')
  async getAllSessions() {
    return this.chatService.getAllSessions();
  }

  @Get('sessions/:id/messages')
  async getSessionMessages(@Param('id') id: string) {
    return this.chatService.getSessionMessages(id);
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
