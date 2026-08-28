import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendManualMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'El teléfono del destinatario es obligatorio' })
  customerPhone: string;

  @IsString()
  @IsNotEmpty({ message: 'El contenido del mensaje es obligatorio' })
  content: string;

  @IsString()
  @IsOptional()
  senderName?: string;
}

export class ToggleBotDto {
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsBoolean()
  isBotActive: boolean;
}

export class CreateChatSessionDto {
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  customerPhone: string;

  @IsString()
  @IsOptional()
  customerName?: string;
}
