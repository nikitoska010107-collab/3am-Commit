import { Inject, Injectable, Logger } from '@nestjs/common'
import { Application } from '@prisma/client'
import { AppError } from '../../common/errors/app-error'
import { ApplicationStatus } from '../../common/enums'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CreditHistoryService } from '../credit-history/credit-history.service'
import { ApplicationStateService } from '../applications/application-state.service'
import { ScoringResultDto } from './dto/scoring.dto'
import { SCORING_PROVIDER, ScoringContext, ScoringProvider } from './scoring.types'

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly creditHistory: CreditHistoryService,
    private readonly state: ApplicationStateService,
    private readonly audit: AuditService,
    @Inject(SCORING_PROVIDER) private readonly provider: ScoringProvider,
  ) {}

  async run(applicationId: string, actorId?: string | null): Promise<ScoringResultDto> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { company: true, product: true },
    })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }

    await this.ensureUnderReview(application, actorId)

    const creditReport = await this.creditHistory.getForApplication(applicationId)
    const context: ScoringContext = {
      application,
      company: application.company,
      product: application.product,
      creditReport,
      formPayload: this.parseFormPayload(application.formPayload),
    }

    const payload = await this.provider.evaluate(context)

    const result = await this.prisma.scoringResult.create({
      data: {
        applicationId,
        score: payload.score,
        riskLevel: payload.riskLevel,
        modelVersion: this.provider.modelVersion,
        summary: payload.summary,
      },
    })

    for (const factor of payload.factors) {
      await this.prisma.scoringFactor.create({
        data: {
          scoringId: result.id,
          code: factor.code,
          title: factor.title,
          value: factor.value,
          weight: factor.weight,
          contribution: factor.contribution,
          explanation: factor.explanation,
        },
      })
    }

    await this.audit.record({
      actorId: actorId ?? null,
      applicationId,
      entityType: 'APPLICATION',
      entityId: applicationId,
      action: 'SCORING_COMPLETED',
      payload: {
        score: payload.score,
        riskLevel: payload.riskLevel,
        modelVersion: this.provider.modelVersion,
      },
    })

    this.logger.log(`Скоринг заявки ${applicationId} завершён: ${payload.score}`)

    const latest = await this.getLatest(applicationId)
    if (!latest) {
      throw AppError.internal('Не удалось сохранить результат скоринга')
    }
    return latest
  }

  async getLatest(applicationId: string): Promise<ScoringResultDto | null> {
    const result = await this.prisma.scoringResult.findFirst({
      where: { applicationId },
      include: { factors: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!result) {
      return null
    }

    return {
      id: result.id,
      applicationId: result.applicationId,
      score: result.score,
      riskLevel: result.riskLevel,
      modelVersion: result.modelVersion,
      summary: result.summary ?? '',
      factors: result.factors.map((factor) => ({
        code: factor.code,
        title: factor.title,
        value: factor.value,
        weight: factor.weight,
        contribution: factor.contribution,
        explanation: factor.explanation,
      })),
      createdAt: result.createdAt.toISOString(),
    }
  }

  private async ensureUnderReview(
    application: Application,
    actorId?: string | null,
  ): Promise<void> {
    if (application.status === ApplicationStatus.SUBMITTED) {
      const checking = await this.state.transition({
        application,
        to: ApplicationStatus.CHECKING,
        actorId: actorId ?? null,
        reason: 'Система проверяет и обогащает данные заявки',
      })
      await this.state.transition({
        application: checking,
        to: ApplicationStatus.UNDER_REVIEW,
        actorId: actorId ?? null,
        reason: 'Данные проверены, заявка передана на скоринг',
      })
      return
    }

    if (
      application.status !== ApplicationStatus.CHECKING &&
      application.status !== ApplicationStatus.UNDER_REVIEW &&
      application.status !== ApplicationStatus.INFO_REQUESTED
    ) {
      throw AppError.conflict('Скоринг доступен только для заявок на рассмотрении', {
        status: application.status,
      })
    }
  }

  private parseFormPayload(raw: string | null): Record<string, unknown> {
    if (!raw) {
      return {}
    }
    try {
      const parsed = JSON.parse(raw) as unknown
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }
}
