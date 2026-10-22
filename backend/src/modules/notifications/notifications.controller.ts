import { Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator'
import { NotificationsService } from './notifications.service'

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Уведомления пользователя' })
  @ApiResponse({ status: 200, description: 'Список уведомлений' })
  list(@CurrentUser() user: AuthenticatedUser, @Query('unread') unread?: string) {
    return this.notifications.listForUser(user.id, unread === 'true')
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Отметить уведомление прочитанным' })
  @ApiResponse({ status: 200, description: 'Обновлённое уведомление' })
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notifications.markRead(id, user.id)
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Отметить все уведомления прочитанными' })
  @ApiResponse({ status: 200, description: 'Количество обновлённых уведомлений' })
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return { marked: await this.notifications.markAllRead(user.id) }
  }
}
