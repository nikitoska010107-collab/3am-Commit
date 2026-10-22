import { ApiProperty } from '@nestjs/swagger'

export class ScoringFactorDto {
  @ApiProperty({ example: 'CREDIT_HISTORY' }) code: string
  @ApiProperty({ example: 'Качество кредитной истории' }) title: string
  @ApiProperty({ example: 23 }) value: number
  @ApiProperty({ example: 25 }) weight: number
  @ApiProperty({ example: 23 }) contribution: number
  @ApiProperty({ example: 'Просрочек нет, кредитная история закрытых обязательств положительная.' })
  explanation: string
}

export class ScoringResultDto {
  @ApiProperty() id: string
  @ApiProperty() applicationId: string
  @ApiProperty({ example: 78 }) score: number
  @ApiProperty({ example: 'LOW', description: 'LOW | MEDIUM | HIGH' }) riskLevel: string
  @ApiProperty({ example: 'rule-based-v1' }) modelVersion: string
  @ApiProperty() summary: string
  @ApiProperty({ type: [ScoringFactorDto] }) factors: ScoringFactorDto[]
  @ApiProperty() createdAt: string
}
