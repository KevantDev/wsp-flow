import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import { UserEntity, Role } from '../../../../domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return new UserEntity({
      ...user,
      role: user.role as Role,
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return new UserEntity({
      ...user,
      role: user.role as Role,
    });
  }

  async findAll(tenantId?: string): Promise<UserEntity[]> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => new UserEntity({ ...u, role: u.role as Role }));
  }

  async create(user: Partial<UserEntity>): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        tenantId: user.tenantId,
        email: user.email!,
        passwordHash: user.passwordHash!,
        fullName: user.fullName!,
        phoneNumber: user.phoneNumber,
        role: (user.role as any) || 'SUBADMIN',
        isActive: user.isActive ?? true,
        avatarUrl: user.avatarUrl,
      },
    });
    return new UserEntity({ ...created, role: created.role as Role });
  }

  async update(id: string, user: Partial<UserEntity>): Promise<UserEntity> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(user.fullName && { fullName: user.fullName }),
        ...(user.phoneNumber !== undefined && { phoneNumber: user.phoneNumber }),
        ...(user.role && { role: user.role as any }),
        ...(user.isActive !== undefined && { isActive: user.isActive }),
        ...(user.avatarUrl !== undefined && { avatarUrl: user.avatarUrl }),
        ...(user.passwordHash && { passwordHash: user.passwordHash }),
        ...(user.tenantId !== undefined && { tenantId: user.tenantId }),
      },
    });
    return new UserEntity({ ...updated, role: updated.role as Role });
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.user.delete({ where: { id } });
    return true;
  }
}
