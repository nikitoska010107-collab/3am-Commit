import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'
import { DecisionType } from '../../../common/enums'

export const DECISION_TYPES = Object.values(DecisionType)

export class BankDecisionDto {
  @ApiProperty({ enum: DECISION_TYPES, example: 'COUNTER_OFFER' })
  @IsIn(DECISION_TYPES)
  type: string

  @ApiPropertyOptional({ example: 'Сумма снижена из-за высокой долговой нагрузки' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string

  @ApiPropertyOptional({ example: 1200000, description: 'Сумма в контрпредложении, ₽' })
  @IsOptional()
  @IsInt()
  @Min(1)
  counterAmount?: number

  @ApiPropertyOptional({ example: 36, description: 'Срок в контрпредложении, мес.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  counterTerm?: number

  @ApiPropertyOptional({ example: 21.5, description: 'Ставка в контрпредложении, %' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  counterRate?: number

  @ApiPropertyOptional({ example: 'Готовы предложить меньшую сумму на больший срок' })
  @IsOptional()
  @IsString()
  message?: string

  @ApiPropertyOptional({ type: [String], example: ['revenue_2025', 'bank_statement'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  missingFields?: string[]
}

export class DecisionResultDto {
  @ApiProperty() applicationId: string
  @ApiProperty({ example: 'COUNTER_OFFER' }) type: string
  @ApiProperty({ example: 'COUNTER_OFFER' }) status: string
  @ApiProperty({ nullable: true }) offerId: string | null
  @ApiProperty() reason: string | null
  @ApiProperty() createdAt: string
}
