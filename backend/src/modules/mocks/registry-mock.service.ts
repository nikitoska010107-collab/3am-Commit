import { Injectable } from '@nestjs/common'
import { Company } from '@prisma/client'
import { ExternalCheckStatus } from '../../common/enums'

export interface RegistryReport {
  source: 'EGRUL-MOCK' | 'FNS-MOCK'
  inn: string
  status: 'ACTIVE' | 'LIQUIDATED' | 'BANKRUPT'
  found: boolean
  legalForm: string
  name: string
  foundedAt: string
  authorizedCapital: number
  employeesCount: number
  taxRegime: string
  checkedAt: string
}

@Injectable()
export class RegistryMockService {
  fetchEgrul(inn: string): RegistryReport {
    return {
      source: 'EGRUL-MOCK',
      inn,
      status: 'ACTIVE',
      found: true,
      legalForm: 'ООО',
      name: `Компания с ИНН ${inn}`,
      foundedAt: '2015-06-01T00:00:00.000Z',
      authorizedCapital: 100000,
      employeesCount: 12,
      taxRegime: 'УСН',
      checkedAt: new Date().toISOString(),
    }
  }

  fetchFns(inn: string): RegistryReport {
    return {
      source: 'FNS-MOCK',
      inn,
      status: 'ACTIVE',
      found: true,
      legalForm: 'ООО',
      name: `Компания с ИНН ${inn}`,
      foundedAt: '2015-06-01T00:00:00.000Z',
      authorizedCapital: 100000,
      employeesCount: 12,
      taxRegime: 'УСН',
      checkedAt: new Date().toISOString(),
    }
  }

  resolveStatus(company: Pick<Company, 'status'>): ExternalCheckStatus {
    return company.status === 'ACTIVE' ? ExternalCheckStatus.PASSED : ExternalCheckStatus.FAILED
  }
}
