import { Injectable, Logger } from '@nestjs/common'
import { RiskLevel } from '../../common/enums'
import {
  SCORING_FACTOR_CODES,
  SCORING_FACTOR_WEIGHTS,
  ScoringContext,
  ScoringFactorResult,
  ScoringProvider,
  ScoringResultPayload,
} from './scoring.types'

const HIGH_RISK_INDUSTRIES = ['строительство', 'общепит', 'логистика', 'туристический бизнес']

@Injectable()
export class RuleBasedScoringProvider implements ScoringProvider {
  readonly modelVersion = 'rule-based-v1'
  private readonly logger = new Logger(RuleBasedScoringProvider.name)

  async evaluate(context: ScoringContext): Promise<ScoringResultPayload> {
    const factors: ScoringFactorResult[] = [
      this.creditHistoryFactor(context),
      this.debtBurdenFactor(context),
      this.revenueStabilityFactor(context),
      this.businessAgeFactor(context),
      this.amountToRevenueFactor(context),
      this.industryRiskFactor(context),
    ]

    const score = Math.max(
      0,
      Math.min(100, Math.round(factors.reduce((sum, f) => sum + f.contribution, 0))),
    )
    const riskLevel = score >= 70 ? RiskLevel.LOW : score >= 45 ? RiskLevel.MEDIUM : RiskLevel.HIGH

    this.logger.log(`Скоринг заявки ${context.application.id}: ${score} (${riskLevel})`)

    return {
      score,
      riskLevel,
      summary: this.buildSummary(score, riskLevel, factors),
      factors,
    }
  }

  private creditHistoryFactor(context: ScoringContext): ScoringFactorResult {
    const weight = SCORING_FACTOR_WEIGHTS.CREDIT_HISTORY
    const report = context.creditReport

    if (!report) {
      return {
        code: SCORING_FACTOR_CODES.CREDIT_HISTORY,
        title: 'Качество кредитной истории',
        value: 0,
        weight,
        contribution: weight * 0.6,
        explanation:
          'Кредитная история ещё не получена: запрошены данные бюро кредитных историй. Оценка предварительная.',
      }
    }

    const raw = report.historyScore
    const value = Math.max(0, Math.min(weight, raw))
    const contribution = value
    const explanation = report.overdueDays
      ? `Просрочка ${report.overdueDays} дн. на сумму ${report.overdueAmount} ₽ снижает оценку истории.`
      : 'Просрочек нет, кредитная история закрытых обязательств положительная.'

    return {
      code: SCORING_FACTOR_CODES.CREDIT_HISTORY,
      title: 'Качество кредитной истории',
      value,
      weight,
      contribution,
      explanation,
    }
  }

  private debtBurdenFactor(context: ScoringContext): ScoringFactorResult {
    const weight = SCORING_FACTOR_WEIGHTS.DEBT_BURDEN
    const monthlyTurnover = this.numberField(
      context.formPayload.monthlyTurnover,
      context.company.revenue / 12,
    )
    const monthlyPayment =
      (context.creditReport?.monthlyDebtPayment ?? 0) +
      context.application.amount / context.application.term

    const burden = monthlyTurnover > 0 ? monthlyPayment / monthlyTurnover : 1
    const ratio = Math.min(1, burden / 0.8)
    const value = Math.round(weight * (1 - ratio))

    return {
      code: SCORING_FACTOR_CODES.DEBT_BURDEN,
      title: 'Долговая нагрузка',
      value,
      weight,
      contribution: value,
      explanation: `Ежемесячные платежи ${Math.round(monthlyPayment)} ₽ при выручке ${Math.round(monthlyTurnover)} ₽ — нагрузка ${(burden * 100).toFixed(0)}% от оборота.`,
    }
  }

  private revenueStabilityFactor(context: ScoringContext): ScoringFactorResult {
    const weight = SCORING_FACTOR_WEIGHTS.REVENUE_STABILITY
    const turnover = this.numberField(
      context.formPayload.monthlyTurnover,
      context.company.revenue / 12,
    )
    const declaredRevenue = this.numberField(context.formPayload.monthlyTurnover, 0) * 12
    const ratio = declaredRevenue > 0 ? context.company.revenue / declaredRevenue : 1
    const value = Math.round(weight * Math.min(1, ratio))

    return {
      code: SCORING_FACTOR_CODES.REVENUE_STABILITY,
      title: 'Стабильность выручки',
      value,
      weight,
      contribution: value,
      explanation: `Годовая выручка ${context.company.revenue} ₽, среднемесячный оборот ${Math.round(turnover)} ₽.`,
    }
  }

  private businessAgeFactor(context: ScoringContext): ScoringFactorResult {
    const weight = SCORING_FACTOR_WEIGHTS.BUSINESS_AGE
    const months = Math.max(
      0,
      Math.floor((Date.now() - context.company.foundedAt.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    )
    const value =
      months < 6 ? Math.round(weight * 0.2) : months < 12 ? Math.round(weight * 0.6) : weight

    return {
      code: SCORING_FACTOR_CODES.BUSINESS_AGE,
      title: 'Возраст бизнеса',
      value,
      weight,
      contribution: value,
      explanation:
        months < 6
          ? `Бизнес работает ${months} мес. — истории недостаточно для одобрения без дополнительных данных.`
          : `Бизнес работает ${months} мес.`,
    }
  }

  private amountToRevenueFactor(context: ScoringContext): ScoringFactorResult {
    const weight = SCORING_FACTOR_WEIGHTS.AMOUNT_TO_REVENUE
    const revenue = context.company.revenue
    const ratio = revenue > 0 ? context.application.amount / revenue : 1
    const value = Math.round(weight * Math.max(0, Math.min(1, 1 - (ratio - 0.3) / 0.7)))

    return {
      code: SCORING_FACTOR_CODES.AMOUNT_TO_REVENUE,
      title: 'Отношение суммы к выручке',
      value,
      weight,
      contribution: value,
      explanation: `Запрошено ${context.application.amount} ₽ при выручке ${revenue} ₽ — это ${(ratio * 100).toFixed(0)}% годового оборота.`,
    }
  }

  private industryRiskFactor(context: ScoringContext): ScoringFactorResult {
    const weight = SCORING_FACTOR_WEIGHTS.INDUSTRY_RISK
    const industry = context.company.industry.toLowerCase()
    const isHighRisk = HIGH_RISK_INDUSTRIES.some((item) => industry.includes(item))
    const value = isHighRisk ? Math.round(weight * 0.4) : weight

    return {
      code: SCORING_FACTOR_CODES.INDUSTRY_RISK,
      title: 'Отраслевой риск',
      value,
      weight,
      contribution: value,
      explanation: isHighRisk
        ? `Отрасль «${context.company.industry}» относится к повышенному риску.`
        : `Отрасль «${context.company.industry}» относится к среднему риску.`,
    }
  }

  private numberField(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback
  }

  private buildSummary(
    score: number,
    riskLevel: RiskLevel,
    factors: ScoringFactorResult[],
  ): string {
    const weakest = [...factors].sort(
      (a, b) => a.contribution / a.weight - b.contribution / b.weight,
    )[0]
    return `Балл ${score} из 100, риск ${riskLevel}. Слабейший фактор: «${weakest.title}» — ${weakest.explanation}`
  }
}
