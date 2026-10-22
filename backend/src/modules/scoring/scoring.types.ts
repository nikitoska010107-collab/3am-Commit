import { Application, Company, Product } from '@prisma/client'
import { RiskLevel } from '../../common/enums'
import { CreditReportDto } from '../credit-history/dto/credit-report.dto'

export const SCORING_FACTOR_CODES = {
  CREDIT_HISTORY: 'CREDIT_HISTORY',
  DEBT_BURDEN: 'DEBT_BURDEN',
  REVENUE_STABILITY: 'REVENUE_STABILITY',
  BUSINESS_AGE: 'BUSINESS_AGE',
  AMOUNT_TO_REVENUE: 'AMOUNT_TO_REVENUE',
  INDUSTRY_RISK: 'INDUSTRY_RISK',
} as const
export type ScoringFactorCode = (typeof SCORING_FACTOR_CODES)[keyof typeof SCORING_FACTOR_CODES]

export const SCORING_FACTOR_WEIGHTS: Record<ScoringFactorCode, number> = {
  CREDIT_HISTORY: 25,
  DEBT_BURDEN: 20,
  REVENUE_STABILITY: 20,
  BUSINESS_AGE: 15,
  AMOUNT_TO_REVENUE: 10,
  INDUSTRY_RISK: 10,
}

export interface ScoringFactorResult {
  code: ScoringFactorCode
  title: string
  value: number
  weight: number
  contribution: number
  explanation: string
}

export interface ScoringResultPayload {
  score: number
  riskLevel: RiskLevel
  summary: string
  factors: ScoringFactorResult[]
}

export interface ScoringContext {
  application: Application
  company: Company
  product: Product
  creditReport: CreditReportDto | null
  formPayload: Record<string, unknown>
}

export const SCORING_PROVIDER = Symbol('SCORING_PROVIDER')

export interface ScoringProvider {
  readonly modelVersion: string
  evaluate(context: ScoringContext): Promise<ScoringResultPayload>
}
