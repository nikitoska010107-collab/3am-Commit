import { Module } from '@nestjs/common'
import { ApplicationsModule } from '../applications/applications.module'
import { ScoringModule } from '../scoring/scoring.module'
import { BankController } from './bank.controller'
import { DecisionService } from './decision.service'

@Module({
  imports: [ApplicationsModule, ScoringModule],
  controllers: [BankController],
  providers: [DecisionService],
  exports: [DecisionService],
})
export class BankModule {}
