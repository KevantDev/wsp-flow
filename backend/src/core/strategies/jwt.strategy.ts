import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaUserRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepo: PrismaUserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'wsp_flow_super_secret_jwt_access_key_2026_x99',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.userRepo.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }
    return user;
  }
}
