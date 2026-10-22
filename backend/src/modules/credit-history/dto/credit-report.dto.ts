import { ApiProperty } from '@nestjs/swagger'

export class CreditReportDto {
  @ApiProperty() id: string
  @ApiProperty() companyId: string
  @ApiProperty({ nullable: true }) applicationId: string | null
  @ApiProperty({ example: 'BKI-MOCK' }) bureau: string
  @ApiProperty({ example: 780 }) creditScore: number
  @ApiProperty({ example: 23, description: 'Вклад фактора «Качество кредитной истории»' })
  historyScore: number
  @ApiProperty({ example: 0 }) overdueDays: number
  @ApiProperty({ example: 0 }) overdueAmount: number
  @ApiProperty({ example: 1200000 }) totalDebt: number
  @ApiProperty({ example: 120000 }) monthlyDebtPayment: number
  @ApiProperty({ example: 1 }) openLoans: number
  @ApiProperty({ example: 3 }) closedLoans: number
  @ApiProperty() hasBankruptcy: boolean
  @ApiProperty() isLiquidated: boolean
  @ApiProperty() registryVerified: boolean
  @ApiProperty() createdAt: string
}

export class RefreshCreditHistoryResponseDto {
  @ApiProperty({ type: CreditReportDto }) report: CreditReportDto
  @ApiProperty({ example: 'PASSED', description: 'PASSED | WARNING | FAILED' })
  checkStatus: string
  @ApiProperty({ description: 'Рекомендации, которые скоринг может использовать' })
  flags: string[]
}
