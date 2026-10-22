import { ApiProperty } from '@nestjs/swagger'

export class DocumentDto {
  @ApiProperty() id: string
  @ApiProperty({ nullable: true }) applicationId: string | null
  @ApiProperty() userId: string
  @ApiProperty({ example: 'statement-2025.pdf' }) filename: string
  @ApiProperty({ example: 'FINANCIAL_STATEMENT' }) kind: string
  @ApiProperty({ example: 'application/pdf' }) mimeType: string
  @ApiProperty({ example: 248120 }) size: number
  @ApiProperty({ example: '9f2c1e...' }) checksum: string
  @ApiProperty() createdAt: string
}
