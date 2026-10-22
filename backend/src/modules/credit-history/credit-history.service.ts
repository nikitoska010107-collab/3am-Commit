import { Injectable, Logger } from '@nestjs/common'
import { CreditReport } from '@prisma/client'
import { AppError } from '../../common/errors/app-error'
import { ExternalCheckSource, ExternalCheckStatus } from '../../common/enums'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { BkiMockService } from '../mocks/bki-mock.service'
import { CreditReportDto, RefreshCreditHistoryResponseDto } from './dto/credit-report.dto'

@Injectable()
export class CreditHistoryService {
  private readonly logger = new Logger(CreditHistoryService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly bkiMock: BkiMockService,
    private readonly audit: AuditService,
  ) {}

  async refresh(
    applicationId: string,
    actorId?: string | null,
  ): Promise<RefreshCreditHistoryResponseDto> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { company: true },
    })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }

    const raw = this.bkiMock.fetchReport(application.company)

    const checkStatus = this.resolveCheckStatus(raw.hasBankruptcy, raw.overdueDays)

    const report = await this.prisma.creditReport.create({
      data: {
        companyId: application.companyId,
        applicationId: application.id,
        bureau: raw.bureau,
        creditScore: raw.creditScore,
        historyScore: raw.historyScore,
        overdueDays: raw.overdueDays,
        overdueAmount: raw.overdueAmount,
        totalDebt: raw.totalDebt,
        monthlyDebtPayment: raw.monthlyDebtPayment,
        openLoans: raw.openLoans,
        closedLoans: raw.closedLoans,
        hasBankruptcy: raw.hasBankruptcy,
        isLiquidated: raw.isLiquidated,
        registryVerified: raw.registryVerified,
        rawPayload: JSON.stringify(raw),
      },
    })

    await this.prisma.externalCheck.create({
      data: {
        applicationId: application.id,
        source: ExternalCheckSource.BKI,
        status: checkStatus,
        payload: JSON.stringify(raw),
      },
    })

    await this.audit.record({
      actorId: actorId ?? null,
      applicationId: application.id,
      entityType: 'CREDIT_REPORT',
      entityId: report.id,
      action: 'CREDIT_HISTORY_REFRESHED',
      payload: { creditScore: raw.creditScore, checkStatus },
    })

    this.logger.log(`Кредитная история обновлена для компании ${application.companyId}`)

    return {
      report: this.toDto(report),
      checkStatus,
      flags: this.buildFlags(raw.hasBankruptcy, raw.overdueDays, raw.registryVerified),
    }
  }

  async getForApplication(applicationId: string): Promise<CreditReportDto | null> {
    const report = await this.prisma.creditReport.findFirst({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    })
    return report ? this.toDto(report) : null
  }

  async getForCompany(companyId: string): Promise<CreditReportDto | null> {
    const report = await this.prisma.creditReport.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
    return report ? this.toDto(report) : null
  }

  private resolveCheckStatus(hasBankruptcy: boolean, overdueDays: number): ExternalCheckStatus {
    if (hasBankruptcy) {
      return ExternalCheckStatus.FAILED
    }
    if (overdueDays > 0) {
      return ExternalCheckStatus.WARNING
    }
    return ExternalCheckStatus.PASSED
  }

  private buildFlags(
    hasBankruptcy: boolean,
    overdueDays: number,
    registryVerified: boolean,
  ): string[] {
    const flags: string[] = []
    if (hasBankruptcy) {
      flags.push('BANKRUPTCY')
    }
    if (overdueDays > 0) {
      flags.push('HAS_OVERDUE')
    }
    if (!registryVerified) {
      flags.push('REGISTRY_NOT_VERIFIED')
    }
    return flags
  }

  private toDto(report: CreditReport): CreditReportDto {
    return {
      id: report.id,
      companyId: report.companyId,
      applicationId: report.applicationId,
      bureau: report.bureau,
      creditScore: report.creditScore,
      historyScore: report.historyScore,
      overdueDays: report.overdueDays,
      overdueAmount: report.overdueAmount,
      totalDebt: report.totalDebt,
      monthlyDebtPayment: report.monthlyDebtPayment,
      openLoans: report.openLoans,
      closedLoans: report.closedLoans,
      hasBankruptcy: report.hasBankruptcy,
      isLiquidated: report.isLiquidated,
      registryVerified: report.registryVerified,
      createdAt: report.createdAt.toISOString(),
    }
  }
}
