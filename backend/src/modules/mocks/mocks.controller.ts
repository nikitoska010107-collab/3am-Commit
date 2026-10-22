import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { PrismaService } from '../../prisma/prisma.service'
import { BkiMockService } from './bki-mock.service'
import { RegistryMockService } from './registry-mock.service'

@ApiTags('mock')
@ApiBearerAuth()
@Controller('mock')
export class MocksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bkiMock: BkiMockService,
    private readonly registryMock: RegistryMockService,
  ) {}

  @Get('bki/:companyId')
  @ApiOperation({ summary: 'Заглушка БКИ: кредитная история компании' })
  @ApiResponse({ status: 200, description: 'Отчёт бюро кредитных историй' })
  async bki(@Param('companyId') companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      throw new NotFoundException('Компания не найдена')
    }
    return this.bkiMock.fetchReport(company)
  }

  @Get('egrul/:inn')
  @ApiOperation({ summary: 'Заглушка ЕГРЮЛ: регистрационные данные' })
  @ApiResponse({ status: 200, description: 'Регистрационные данные компании' })
  egrul(@Param('inn') inn: string) {
    return this.registryMock.fetchEgrul(inn)
  }

  @Get('fns/:inn')
  @ApiOperation({ summary: 'Заглушка ФНС: налоговые данные' })
  @ApiResponse({ status: 200, description: 'Налоговые данные компании' })
  fns(@Param('inn') inn: string) {
    return this.registryMock.fetchFns(inn)
  }
}
