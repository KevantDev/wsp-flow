import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto, RegisterSubadminDto } from '../../application/dtos/auth.dto';
import { Public } from '../../core/decorators/public.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '../../domain/entities/user.entity';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Roles(Role.ADMIN)
  @Post('register-subadmin')
  async registerSubadmin(@Body() dto: RegisterSubadminDto) {
    return this.authService.registerSubadmin(dto);
  }

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
