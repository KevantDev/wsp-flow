import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProductsService } from '../../application/services/products.service';
import { CreateProductDto, UpdateProductDto, UpdateStockDto } from '../../application/dtos/product.dto';
import { Roles } from '../../core/decorators/roles.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { Role } from '../../domain/entities/user.entity';
import { CatalogPdfService } from '../../infrastructure/pdf/catalog-pdf.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly catalogPdfService: CatalogPdfService,
  ) {}

  @Public()
  @Get('catalog/pdf')
  async downloadCatalogPdf(@Res() res: Response) {
    const { buffer } = await this.catalogPdfService.generateCatalogPdf();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Catalogo_WSP_Flow.pdf"',
      'Content-Length': buffer.length,
    });
    return res.end(buffer);
  }

  @Roles(Role.ADMIN, Role.SUBADMIN)
  @Post('catalog/generate-pdf')
  async regenerateCatalogPdf() {
    const { filePath } = await this.catalogPdfService.generateCatalogPdf();
    return {
      success: true,
      message: 'Catálogo PDF generado exitosamente',
      downloadUrl: '/api/v1/products/catalog/pdf',
      filePath,
    };
  }

  @Get()
  async getAll(@Query('categoryId') categoryId?: string, @Query('search') search?: string) {
    return this.productsService.getAll(categoryId, search);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.productsService.getById(id);
  }

  @Roles(Role.ADMIN, Role.SUBADMIN)
  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Roles(Role.ADMIN, Role.SUBADMIN)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.SUBADMIN)
  @Patch(':id/stock')
  async updateStock(@Param('id') id: string, @Body() dto: UpdateStockDto) {
    return this.productsService.updateStock(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
