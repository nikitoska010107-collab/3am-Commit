import { Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '../../common/enums'
import { Roles } from '../../common/decorators/roles.decorator'
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator'
import { ApplicationsService } from '../applications/applications.service'
import { CreditHistoryService } from './credit-history.service'
import { CreditReportDto, RefreshCreditHistoryResponseDto } from './dto/credit-report.dto'

@ApiTags('credit-history')
@ApiBearerAuth()
@Controller()
export class CreditHistoryController {
  constructor(
    private readonly creditHistory: CreditHistoryService,
    private readonly applications: ApplicationsService,
  ) {}

  @Post('applications/:id/credit-history/refresh')
  @Roles(UserRole.UNDERWRITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Запросить и сохранить кредитную историю компании по заявке' })
  @ApiResponse({ status: 201, type: RefreshCreditHistoryResponseDto })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  refresh(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<RefreshCreditHistoryResponseDto> {
    return this.creditHistory.refresh(id, user.id)
  }

  @Get('applications/:id/credit-history')
  @ApiOperation({ summary: 'Последняя сохранённая кредитная история по заявке' })
  @ApiResponse({ status: 200, type: CreditReportDto })
  @ApiResponse({ status: 200, nullable: true, description: 'Отчёт ещё не запрашивался' })
  async getForApplication(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<CreditReportDto | null> {
    await this.applications.getAccessible(user, id)
    return this.creditHistory.getForApplication(id)
  }

  @Get('companies/:companyId/credit-history')
  @ApiOperation({ summary: 'Последняя сохранённая кредитная история по компании' })
  @ApiResponse({ status: 200, type: CreditReportDto })
  async getForCompany(@Param('companyId') companyId: string): Promise<CreditReportDto | null> {
    return this.creditHistory.getForCompany(companyId)
  }
}
