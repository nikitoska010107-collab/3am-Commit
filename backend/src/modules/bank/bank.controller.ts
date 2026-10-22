import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '../../common/enums'
import { Roles } from '../../common/decorators/roles.decorator'
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator'
import { ScoringResultDto } from '../scoring/dto/scoring.dto'
import { ScoringService } from '../scoring/scoring.service'
import { BankDecisionDto, DecisionResultDto } from './dto/decision.dto'
import { DecisionService } from './decision.service'

@ApiTags('bank')
@ApiBearerAuth()
@Roles(UserRole.UNDERWRITER, UserRole.ADMIN)
@Controller('bank/applications')
export class BankController {
  constructor(
    private readonly scoring: ScoringService,
    private readonly decisions: DecisionService,
  ) {}

  @Post(':id/score')
  @ApiOperation({ summary: 'Запустить скоринг заявки' })
  @ApiResponse({ status: 201, type: ScoringResultDto })
  @ApiResponse({ status: 409, description: 'Заявка не на рассмотрении' })
  score(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ScoringResultDto> {
    return this.scoring.run(id, user.id)
  }

  @Get(':id/scoring')
  @ApiOperation({ summary: 'Последний результат скоринга по заявке' })
  @ApiResponse({ status: 200, type: ScoringResultDto })
  getScoring(@Param('id') id: string): Promise<ScoringResultDto | null> {
    return this.scoring.getLatest(id)
  }

  @Post(':id/decision')
  @ApiOperation({
    summary: 'Решение банка: одобрить, отказать, контрпредложение, запросить данные',
  })
  @ApiResponse({ status: 201, type: DecisionResultDto })
  @ApiResponse({ status: 409, description: 'Заявка не на рассмотрении' })
  decide(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BankDecisionDto,
  ): Promise<DecisionResultDto> {
    return this.decisions.decide(user, id, dto)
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Симуляция подписания документов' })
  @ApiResponse({ status: 201, type: DecisionResultDto })
  sign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DecisionResultDto> {
    return this.decisions.sign(user, id)
  }

  @Post(':id/disburse')
  @ApiOperation({ summary: 'Симуляция выдачи кредита' })
  @ApiResponse({ status: 201, type: DecisionResultDto })
  disburse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<DecisionResultDto> {
    return this.decisions.disburse(user, id)
  }
}
