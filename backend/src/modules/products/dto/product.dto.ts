import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator'

export class ProductResponseDto {
  @ApiProperty() id: string
  @ApiProperty({ example: 'biz-credit' }) code: string
  @ApiProperty({ example: 'Кредит на развитие бизнеса' }) name: string
  @ApiProperty({ example: 300000 }) minAmount: number
  @ApiProperty({ example: 5000000 }) maxAmount: number
  @ApiProperty({ example: 3 }) minTerm: number
  @ApiProperty({ example: 60 }) maxTerm: number
  @ApiProperty({ example: 18.5 }) rate: number
  @ApiProperty() description: string
  @ApiProperty() purpose: string
  @ApiProperty() isActive: boolean
}

export class CreateProductDto {
  @ApiProperty({ example: 'biz-credit' })
  @IsString()
  @MinLength(2)
  code: string

  @ApiProperty({ example: 'Кредит на развитие бизнеса' })
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ example: 300000 })
  @IsInt()
  @Min(0)
  minAmount: number

  @ApiProperty({ example: 5000000 })
  @IsInt()
  @Min(1)
  maxAmount: number

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  minTerm: number

  @ApiProperty({ example: 60 })
  @IsInt()
  @Min(1)
  maxTerm: number

  @ApiProperty({ example: 18.5 })
  @IsNumber()
  @Min(0)
  rate: number

  @ApiProperty()
  @IsString()
  @MinLength(10)
  description: string

  @ApiProperty()
  @IsString()
  @MinLength(2)
  purpose: string

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  minAmount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxAmount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  minTerm?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTerm?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  purpose?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
