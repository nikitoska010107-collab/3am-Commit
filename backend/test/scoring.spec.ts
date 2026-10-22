import { describe, expect, it } from 'vitest'
import { RiskLevel } from '../src/common/enums'
import { CreditReportDto } from '../src/modules/credit-history/dto/credit-report.dto'
import { RuleBasedScoringProvider } from '../src/modules/scoring/rule-based-scoring.provider'
import { ScoringContext, SCORING_FACTOR_WEIGHTS } from '../src/modules/scoring/scoring.types'

const buildReport = (overrides: Partial<CreditReportDto> = {}): CreditReportDto => ({
  id: 'report-1',
  companyId: 'company-1',
  applicationId: 'application-1',
  bureau: 'BKI-MOCK',
  creditScore: 780,
  historyScore: 23,
  overdueDays: 0,
  overdueAmount: 0,
  totalDebt: 1200000,
  monthlyDebtPayment: 120000,
  openLoans: 1,
  closedLoans: 3,
  hasBankruptcy: false,
  isLiquidated: false,
  registryVerified: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
})

const buildContext = (overrides: Partial<ScoringContext> = {}): ScoringContext => ({
  application: {
    id: 'application-1',
    amount: 1500000,
    term: 24,
    status: 'UNDER_REVIEW',
  } as ScoringContext['application'],
  company: {
    id: 'company-1',
    revenue: 25000000,
    industry: 'Производство',
    foundedAt: new Date('2019-04-12T00:00:00.000Z'),
  } as ScoringContext['company'],
  product: {
    id: 'product-1',
    rate: 18.5,
  } as ScoringContext['product'],
  creditReport: buildReport(),
  formPayload: { monthlyTurnover: 2000000 },
  ...overrides,
})

describe('правиловый скоринг', () => {
  const provider = new RuleBasedScoringProvider()

  it('даёт низкий риск надёжному заёмщику', async () => {
    const result = await provider.evaluate(buildContext())

    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.riskLevel).toBe(RiskLevel.LOW)
    expect(result.summary).toContain('Слабейший фактор')
  })

  it('снижает балл при просрочках и банкротстве в истории', async () => {
    const good = await provider.evaluate(buildContext())
    const bad = await provider.evaluate(
      buildContext({
        creditReport: buildReport({
          creditScore: 515,
          historyScore: 8,
          overdueDays: 95,
          overdueAmount: 480000,
          monthlyDebtPayment: 320000,
          hasBankruptcy: true,
        }),
        formPayload: { monthlyTurnover: 350000 },
      }),
    )

    expect(bad.score).toBeLessThan(good.score)
    expect(bad.riskLevel).not.toBe(RiskLevel.LOW)
    expect(bad.factors.find((factor) => factor.code === 'CREDIT_HISTORY')?.explanation).toContain(
      '95',
    )
  })

  it('возвращает полный набор объяснимых факторов', async () => {
    const result = await provider.evaluate(buildContext())
    const codes = result.factors.map((factor) => factor.code).sort()
    const expected = Object.keys(SCORING_FACTOR_WEIGHTS).sort()

    expect(codes).toEqual(expected)
    for (const factor of result.factors) {
      expect(factor.explanation.length).toBeGreaterThan(10)
      expect(factor.weight).toBe(SCORING_FACTOR_WEIGHTS[factor.code])
      expect(factor.contribution).toBeGreaterThanOrEqual(0)
      expect(factor.contribution).toBeLessThanOrEqual(factor.weight)
    }
  })

  it('держит балл в диапазоне 0..100', async () => {
    const result = await provider.evaluate(
      buildContext({
        company: {
          id: 'company-1',
          revenue: 100000,
          industry: 'Общепит',
          foundedAt: new Date(),
        } as ScoringContext['company'],
        creditReport: null,
        formPayload: {},
        application: {
          id: 'application-1',
          amount: 8000000,
          term: 60,
          status: 'UNDER_REVIEW',
        } as ScoringContext['application'],
      }),
    )

    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.factors).toHaveLength(6)
  })

  it('работает без кредитной истории, помечая оценку как предварительную', async () => {
    const result = await provider.evaluate(buildContext({ creditReport: null }))
    const factor = result.factors.find((item) => item.code === 'CREDIT_HISTORY')

    expect(factor?.explanation).toContain('предварительная')
  })
})
