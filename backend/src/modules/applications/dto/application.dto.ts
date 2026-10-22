import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { LEGAL_FORMS } from '../../../common/enums'

export const PURPOSE_CODES = [
  'WORKING_CAPITAL',
  'EQUIPMENT',
  'INVENTORY',
  'EXPANSION',
  'REFINANCING',
  'PAYROLL',
] as const
export type PurposeCode = (typeof PURPOSE_CODES)[number]

export class CompanySnapshotDto {
  @ApiPropertyOptional({ example: 'ООО «Восход»' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string

  @ApiPropertyOptional({ example: '7701234567' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  inn?: string

  @ApiPropertyOptional({ enum: LEGAL_FORMS })
  @IsOptional()
  @IsIn(LEGAL_FORMS)
  legalForm?: string

  @ApiPropertyOptional({ example: 'Строительство' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  industry?: string

  @ApiPropertyOptional({ example: 8500000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  revenue?: number

  @ApiPropertyOptional({ example: '2019-04-12T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  foundedAt?: string
}

export class CreateApplicationDto {
  @ApiProperty({ example: 'prod-biz-credit' })
  @IsString()
  @MinLength(1)
  productId: string

  @ApiProperty({ example: 1500000, description: 'Сумма кредита в рублях' })
  @IsInt()
  @Min(1)
  amount: number

  @ApiProperty({ example: 24, description: 'Срок кредита в месяцах' })
  @IsInt()
  @Min(1)
  @Max(120)
  term: number

  @ApiProperty({ example: 'Закупка оборудования для расширения производства' })
  @IsString()
  @MinLength(10)
  purpose: string

  @ApiPropertyOptional({ enum: PURPOSE_CODES, example: 'EQUIPMENT' })
  @IsOptional()
  @IsIn(PURPOSE_CODES)
  purposeCode?: string

  @ApiPropertyOptional({ example: '+7 900 000-00-00' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  contactPhone?: string

  @ApiPropertyOptional({ example: 'anna@demo.local' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @ApiPropertyOptional({ example: 2500000, description: 'Среднемесячная выручка, ₽' })
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyTurnover?: number

  @ApiPropertyOptional({ example: 85000, description: 'Средняя зарплата по штату, ₽' })
  @IsOptional()
  @IsInt()
  @Min(0)
  averageSalary?: number

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  employeeCount?: number

  @ApiPropertyOptional({ example: 1, description: 'Количество действующих кредитов' })
  @IsOptional()
  @IsInt()
  @Min(0)
  existingLoans?: number

  @ApiPropertyOptional({ description: 'Есть ли просроченная задолженность' })
  @IsOptional()
  @IsBoolean()
  hasOverdueDebt?: boolean

  @ApiPropertyOptional({ type: CompanySnapshotDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanySnapshotDto)
  company?: CompanySnapshotDto
}

export class UpdateApplicationDto {
  @ApiPropertyOptional({ example: 1500000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  term?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  purpose?: string

  @ApiPropertyOptional({ enum: PURPOSE_CODES })
  @IsOptional()
  @IsIn(PURPOSE_CODES)
  purposeCode?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  contactPhone?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyTurnover?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  averageSalary?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  employeeCount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  existingLoans?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasOverdueDebt?: boolean

  @ApiPropertyOptional({ type: CompanySnapshotDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanySnapshotDto)
  company?: CompanySnapshotDto
}

export class ApplicationDataInputDto {
  @ApiProperty({ example: 'revenue_2025' })
  @IsString()
  @MinLength(2)
  field: string

  @ApiProperty({ example: '12500000' })
  @IsString()
  value: string

  @ApiPropertyOptional({ example: 'Выручка за 2025 год' })
  @IsOptional()
  @IsString()
  label?: string
}

export class SubmitApplicationDto {
  @ApiPropertyOptional({ example: '+7 900 000-00-00' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  contactPhone?: string

  @ApiPropertyOptional({ example: 'anna@demo.local' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string

  @ApiPropertyOptional({ description: 'Подтверждение клиента на отправку заявки' })
  @IsOptional()
  @IsBoolean()
  confirm?: boolean
}

export class InfoResponseDto {
  @ApiProperty({ type: [ApplicationDataInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApplicationDataInputDto)
  answers: ApplicationDataInputDto[]
}

export class ProductBriefDto {
  @ApiProperty() id: string
  @ApiProperty() code: string
  @ApiProperty() name: string
  @ApiProperty() rate: number
  @ApiProperty() minAmount: number
  @ApiProperty() maxAmount: number
  @ApiProperty() minTerm: number
  @ApiProperty() maxTerm: number
}

export class CompanyBriefDto {
  @ApiProperty() id: string
  @ApiProperty() inn: string
  @ApiProperty() name: string
  @ApiProperty() legalForm: string
  @ApiProperty() industry: string
  @ApiProperty() revenue: number
  @ApiProperty() foundedAt: string
  @ApiProperty() status: string
}

export class ClientBriefDto {
  @ApiProperty() id: string
  @ApiProperty() email: string
  @ApiProperty() name: string
}

export class ApplicationResponseDto {
  @ApiProperty() id: string
  @ApiProperty({ example: 'DRAFT' }) status: string
  @ApiProperty() amount: number
  @ApiProperty() term: number
  @ApiProperty() purpose: string
  @ApiProperty({ nullable: true }) purposeCode: string | null
  @ApiProperty({ type: ProductBriefDto }) product: ProductBriefDto
  @ApiProperty({ type: CompanyBriefDto }) company: CompanyBriefDto
  @ApiProperty({ type: ClientBriefDto }) client: ClientBriefDto
  @ApiProperty({ description: 'Поля анкеты, сохранённые при заполнении' })
  formPayload: Record<string, unknown>
  @ApiProperty({ description: 'Поля, которых не хватает банку', type: [String] })
  missingFields: string[]
  @ApiProperty() createdAt: string
  @ApiProperty() updatedAt: string
}

export class StatusHistoryDto {
  @ApiProperty() id: string
  @ApiProperty({ nullable: true }) fromStatus: string | null
  @ApiProperty() toStatus: string
  @ApiProperty({ nullable: true }) actorId: string | null
  @ApiProperty({ nullable: true }) reason: string | null
  @ApiProperty() createdAt: string
}

export class ApplicationDataDto {
  @ApiProperty() id: string
  @ApiProperty() field: string
  @ApiProperty() value: string
  @ApiProperty({ nullable: true }) label: string | null
}

export class OfferDto {
  @ApiProperty() id: string
  @ApiProperty() amount: number
  @ApiProperty() term: number
  @ApiProperty() rate: number
  @ApiProperty() type: string
  @ApiProperty() status: string
  @ApiProperty({ nullable: true }) message: string | null
  @ApiProperty({ nullable: true }) expiresAt: string | null
  @ApiProperty() createdAt: string
}
