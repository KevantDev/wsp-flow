import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CategoriesService } from '../../application/services/categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../../application/dtos/category.dto';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '../../domain/entities/user.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAll(@Query('onlyActive') onlyActive?: string) {
    return this.categoriesService.getAll(onlyActive === 'true');
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.categoriesService.getById(id);
  }

  @Roles(Role.ADMIN, Role.SUBADMIN)
  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Roles(Role.ADMIN, Role.SUBADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
