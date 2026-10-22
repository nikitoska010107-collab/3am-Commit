import { Injectable } from '@nestjs/common'
import { Company } from '@prisma/client'

export interface BureauReport {
  bureau: string
  creditScore: number
  historyScore: number
  overdueDays: number
  overdueAmount: number
  totalDebt: number
  monthlyDebtPayment: number
  openLoans: number
  closedLoans: number
  hasBankruptcy: boolean
  isLiquidated: boolean
  registryVerified: boolean
  checkedAt: string
  source: 'BKI-MOCK'
}

interface BureauProfile {
  creditScore: number
  historyScore: number
  overdueDays: number
  overdueAmount: number
  totalDebt: number
  monthlyDebtPayment: number
  openLoans: number
  closedLoans: number
  hasBankruptcy: boolean
  isLiquidated: boolean
  registryVerified: boolean
}

const DEFAULT_PROFILE: BureauProfile = {
  creditScore: 640,
  historyScore: 15,
  overdueDays: 0,
  overdueAmount: 0,
  totalDebt: 800000,
  monthlyDebtPayment: 95000,
  openLoans: 1,
  closedLoans: 2,
  hasBankruptcy: false,
  isLiquidated: false,
  registryVerified: true,
}

const PROFILES_BY_INN: Record<string, BureauProfile> = {
  '7701234567': {
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
  },
  '7709876543': {
    creditScore: 645,
    historyScore: 15,
    overdueDays: 18,
    overdueAmount: 47000,
    totalDebt: 900000,
    monthlyDebtPayment: 155000,
    openLoans: 2,
    closedLoans: 1,
    hasBankruptcy: false,
    isLiquidated: false,
    registryVerified: true,
  },
  '7705554433': {
    creditScore: 515,
    historyScore: 5,
    overdueDays: 124,
    overdueAmount: 350000,
    totalDebt: 2400000,
    monthlyDebtPayment: 310000,
    openLoans: 3,
    closedLoans: 0,
    hasBankruptcy: true,
    isLiquidated: false,
    registryVerified: true,
  },
}

@Injectable()
export class BkiMockService {
  private readonly bureau = 'BKI-MOCK'

  fetchReport(company: Pick<Company, 'id' | 'inn' | 'name' | 'industry'>): BureauReport {
    const profile = PROFILES_BY_INN[company.inn] ?? this.fallbackProfile(company.inn)

    return {
      bureau: this.bureau,
      ...profile,
      checkedAt: new Date().toISOString(),
      source: 'BKI-MOCK',
    }
  }

  private fallbackProfile(inn: string): BureauProfile {
    const seed = [...inn].reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const overdueDays = seed % 3 === 0 ? 30 : 0
    return {
      ...DEFAULT_PROFILE,
      creditScore: 600 + (seed % 150),
      historyScore: overdueDays === 0 ? 18 : 12,
      overdueDays,
      overdueAmount: overdueDays === 0 ? 0 : 50000,
    }
  }
}
