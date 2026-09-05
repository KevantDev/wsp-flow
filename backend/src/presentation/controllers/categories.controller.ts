import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CategoriesService } from '../../application/services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../../application/dtos/category.dto';
import { Roles } from '../../core/decorators/roles.decorator';
import { CurrentTenant } from '../../core/decorators/current-tenant.decorator';
import { Role } from '../../domain/entities/user.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAll(
    @CurrentTenant() tenantId: string,
    @Query('onlyActive') onlyActive?: string,
  ) {
    return this.categoriesService.getAll(tenantId, onlyActive === 'true');
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.categoriesService.getById(id, tenantId);
  }

  @Roles(Role.ADMIN, Role.SUBADMIN)
  @Post()
  async create(@Body() dto: CreateCategoryDto, @CurrentTenant() tenantId: string) {
    return this.categoriesService.create(dto, tenantId);
  }

  @Roles(Role.ADMIN, Role.SUBADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.categoriesService.update(id, dto, tenantId);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    return this.categoriesService.delete(id, tenantId);
  }
}
