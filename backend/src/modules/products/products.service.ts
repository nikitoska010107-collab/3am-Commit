import { Injectable } from '@nestjs/common'
import { Product } from '@prisma/client'
import { AppError } from '../../common/errors/app-error'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateProductDto, ProductResponseDto, UpdateProductDto } from './dto/product.dto'

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return products.map((product) => this.toResponse(product))
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({ where: { id } })
    if (!product) {
      throw AppError.notFound('Кредитный продукт не найден')
    }
    return this.toResponse(product)
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const existing = await this.prisma.product.findUnique({ where: { code: dto.code } })
    if (existing) {
      throw AppError.conflict('Продукт с таким кодом уже существует', { code: dto.code })
    }

    const product = await this.prisma.product.create({
      data: {
        code: dto.code.trim(),
        name: dto.name.trim(),
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount,
        minTerm: dto.minTerm,
        maxTerm: dto.maxTerm,
        rate: dto.rate,
        description: dto.description.trim(),
        purpose: dto.purpose.trim(),
        isActive: dto.isActive ?? true,
      },
    })
    return this.toResponse(product)
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    await this.findOne(id)
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.minAmount !== undefined ? { minAmount: dto.minAmount } : {}),
        ...(dto.maxAmount !== undefined ? { maxAmount: dto.maxAmount } : {}),
        ...(dto.minTerm !== undefined ? { minTerm: dto.minTerm } : {}),
        ...(dto.maxTerm !== undefined ? { maxTerm: dto.maxTerm } : {}),
        ...(dto.rate !== undefined ? { rate: dto.rate } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.purpose !== undefined ? { purpose: dto.purpose.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    })
    return this.toResponse(product)
  }

  private toResponse(product: Product): ProductResponseDto {
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      minAmount: product.minAmount,
      maxAmount: product.maxAmount,
      minTerm: product.minTerm,
      maxTerm: product.maxTerm,
      rate: product.rate,
      description: product.description,
      purpose: product.purpose,
      isActive: product.isActive,
    }
  }
}
