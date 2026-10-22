import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { UserRole } from '../../common/enums'
import { ApplicationsService } from './applications.service'
import {
  ApplicationDataDto,
  ApplicationResponseDto,
  CreateApplicationDto,
  InfoResponseDto,
  OfferDto,
  StatusHistoryDto,
  SubmitApplicationDto,
  UpdateApplicationDto,
} from './dto/application.dto'

@ApiTags('applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Создать черновик заявки' })
  @ApiResponse({ status: 201, type: ApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'Параметры не соответствуют условиям продукта' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApplicationDto,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.createDraft(user, dto)
  }

  @Get()
  @ApiOperation({ summary: 'Список заявок: клиент видит свои, банк — все' })
  @ApiResponse({ status: 200, type: [ApplicationResponseDto] })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('productId') productId?: string,
    @Query('clientId') clientId?: string,
  ): Promise<ApplicationResponseDto[]> {
    return this.applicationsService.list(user, { status, productId, clientId })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Карточка заявки' })
  @ApiResponse({ status: 200, type: ApplicationResponseDto })
  @ApiResponse({ status: 404, description: 'Заявка не найдена' })
  @ApiResponse({ status: 403, description: 'Нет доступа к заявке' })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.getOne(user, id)
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Редактировать черновик заявки' })
  @ApiResponse({ status: 200, type: ApplicationResponseDto })
  @ApiResponse({ status: 409, description: 'Заявка не в статусе DRAFT' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.updateDraft(user, id, dto)
  }

  @Post(':id/submit')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Отправить заявку на рассмотрение' })
  @ApiResponse({ status: 200, type: ApplicationResponseDto })
  @ApiResponse({ status: 400, description: 'Заявка заполнена не полностью' })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SubmitApplicationDto,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.submit(user, id, dto)
  }

  @Post(':id/cancel')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Отозвать заявку' })
  @ApiResponse({ status: 200, type: ApplicationResponseDto })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.cancel(user, id)
  }

  @Post(':id/info-response')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Ответ клиента на запрос дополнительных данных' })
  @ApiResponse({ status: 200, type: ApplicationResponseDto })
  @ApiResponse({ status: 409, description: 'Заявка не в статусе INFO_REQUESTED' })
  respondToInfoRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: InfoResponseDto,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.respondToInfoRequest(user, id, dto)
  }

  @Post(':id/offer/accept')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Принять предложение банка' })
  @ApiResponse({ status: 200, type: ApplicationResponseDto })
  acceptOffer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.acceptOffer(user, id)
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'История переходов статусов заявки' })
  @ApiResponse({ status: 200, type: [StatusHistoryDto] })
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<StatusHistoryDto[]> {
    return this.applicationsService.getHistory(user, id)
  }

  @Get(':id/data')
  @ApiOperation({ summary: 'Дополнительные данные заявки' })
  @ApiResponse({ status: 200, type: [ApplicationDataDto] })
  data(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApplicationDataDto[]> {
    return this.applicationsService.getData(user, id)
  }

  @Get(':id/offers')
  @ApiOperation({ summary: 'Предложения банка по заявке' })
  @ApiResponse({ status: 200, type: [OfferDto] })
  offers(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<OfferDto[]> {
    return this.applicationsService.getOffers(user, id)
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Аудит-лог заявки' })
  @ApiResponse({ status: 200, description: 'Список записей аудита' })
  audit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.applicationsService.getAudit(user, id)
  }
}
