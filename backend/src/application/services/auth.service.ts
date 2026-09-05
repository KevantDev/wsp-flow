import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaUserRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-user.repository';
import { LoginDto, RegisterSubadminDto } from '../dtos/auth.dto';
import { Role } from '../../domain/entities/user.entity';
import { PlansService } from './plans.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: PrismaUserRepository,
    private readonly jwtService: JwtService,
    private readonly plansService: PlansService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase().trim());
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Esta cuenta ha sido desactivada por el administrador');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: user.tenantSlug,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        tenantSlug: user.tenantSlug,
        tenantName: user.tenantName,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
      },
    };
  }

  async registerSubadmin(dto: RegisterSubadminDto, tenantId?: string) {
    if (tenantId) {
      await this.plansService.checkTenantQuota(tenantId, 'USER');
    }

    const existing = await this.userRepo.findByEmail(dto.email.toLowerCase().trim());
    if (existing) {
      throw new ConflictException('Ya existe un usuario con este correo electrónico');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = await this.userRepo.create({
      tenantId,
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      role: Role.SUBADMIN,
      isActive: true,
      avatarUrl: dto.avatarUrl,
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      email: created.email,
      fullName: created.fullName,
      role: created.role,
      isActive: created.isActive,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return {
      id: user.id,
      tenantId: user.tenantId,
      tenantSlug: user.tenantSlug,
      tenantName: user.tenantName,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
    };
  }
}
