import { Module } from '@nestjs/common'
import { ApplicationsModule } from '../applications/applications.module'
import { CreditHistoryModule } from '../credit-history/credit-history.module'
import { RuleBasedScoringProvider } from './rule-based-scoring.provider'
import { ScoringService } from './scoring.service'
import { SCORING_PROVIDER } from './scoring.types'

@Module({
  imports: [ApplicationsModule, CreditHistoryModule],
  providers: [
    ScoringService,
    RuleBasedScoringProvider,
    { provide: SCORING_PROVIDER, useExisting: RuleBasedScoringProvider },
  ],
  exports: [ScoringService, SCORING_PROVIDER],
})
export class ScoringModule {}
