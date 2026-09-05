import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaUserRepository } from '../../infrastructure/persistence/prisma/repositories/prisma-user.repository';
import { Role } from '../../domain/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly userRepo: PrismaUserRepository) {}

  async getAll(tenantId?: string) {
    const users = await this.userRepo.findAll(tenantId);
    return users.map((u) => ({
      id: u.id,
      tenantId: u.tenantId,
      email: u.email,
      fullName: u.fullName,
      phoneNumber: u.phoneNumber,
      role: u.role,
      isActive: u.isActive,
      avatarUrl: u.avatarUrl,
      createdAt: u.createdAt,
    }));
  }

  async toggleStatus(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('No se puede desactivar al Administrador Principal');
    }

    return this.userRepo.update(id, { isActive: !user.isActive });
  }

  async delete(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('No se puede eliminar al Administrador Principal');
    }
    return this.userRepo.delete(id);
  }
}
