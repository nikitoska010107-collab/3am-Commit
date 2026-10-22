import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '../../common/enums'
import { Roles } from '../../common/decorators/roles.decorator'
import { CreateProductDto, ProductResponseDto, UpdateProductDto } from './dto/product.dto'
import { ProductsService } from './products.service'

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Каталог кредитных продуктов' })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  findAll(@Query('includeInactive') includeInactive?: string): Promise<ProductResponseDto[]> {
    return this.productsService.findAll(includeInactive === 'true')
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Карточка кредитного продукта' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Продукт не найден' })
  findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findOne(id)
  }

  @Post()
  @Roles(UserRole.UNDERWRITER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать кредитный продукт' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.create(dto)
  }

  @Patch(':id')
  @Roles(UserRole.UNDERWRITER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить условия кредитного продукта' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<ProductResponseDto> {
    return this.productsService.update(id, dto)
  }
}
