import { Module } from '@nestjs/common'
import { ApplicationsModule } from '../applications/applications.module'
import { MocksModule } from '../mocks/mocks.module'
import { CreditHistoryController } from './credit-history.controller'
import { CreditHistoryService } from './credit-history.service'

@Module({
  imports: [ApplicationsModule, MocksModule],
  controllers: [CreditHistoryController],
  providers: [CreditHistoryService],
  exports: [CreditHistoryService],
})
export class CreditHistoryModule {}
