import { Controller, Get, Patch, Delete, Param } from '@nestjs/common';
import { UsersService } from '../../application/services/users.service';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';
import { Role } from '../../domain/entities/user.entity';

@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAll(@CurrentTenant() tenantId: string) {
    return this.usersService.getAll(tenantId);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
