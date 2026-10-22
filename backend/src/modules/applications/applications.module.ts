import { Module } from '@nestjs/common'
import { ApplicationStateService } from './application-state.service'
import { ApplicationsController } from './applications.controller'
import { ApplicationsService } from './applications.service'

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationStateService],
  exports: [ApplicationsService, ApplicationStateService],
})
export class ApplicationsModule {}
