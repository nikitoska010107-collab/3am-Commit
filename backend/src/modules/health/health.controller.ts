import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Проверка живости сервиса' })
  @ApiResponse({ status: 200, description: 'Сервис работает' })
  check() {
    return {
      status: 'ok',
      service: 'smart-credit-cabinet-api',
      timestamp: new Date().toISOString(),
    }
  }
}
