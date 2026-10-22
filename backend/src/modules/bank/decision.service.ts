import { Injectable, Logger } from '@nestjs/common'
import { AppError } from '../../common/errors/app-error'
import { ApplicationStatus, DecisionType, NotificationType, OfferType } from '../../common/enums'
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { ApplicationStateService } from '../applications/application-state.service'
import { AuditService } from '../audit/audit.service'
import { NotificationsService } from '../notifications/notifications.service'
import { ScoringService } from '../scoring/scoring.service'
import { BankDecisionDto, DecisionResultDto } from './dto/decision.dto'

@Injectable()
export class DecisionService {
  private readonly logger = new Logger(DecisionService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly state: ApplicationStateService,
    private readonly scoring: ScoringService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async decide(
    user: AuthenticatedUser,
    applicationId: string,
    dto: BankDecisionDto,
  ): Promise<DecisionResultDto> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { product: true },
    })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }

    if (application.status !== ApplicationStatus.UNDER_REVIEW) {
      throw AppError.conflict('Решение можно принять только по заявке на рассмотрении', {
        status: application.status,
      })
    }

    switch (dto.type) {
      case DecisionType.APPROVE:
        return this.approve(user, applicationId, dto)
      case DecisionType.COUNTER_OFFER:
        return this.counterOffer(user, applicationId, dto)
      case DecisionType.REJECT:
        return this.reject(user, applicationId, dto)
      case DecisionType.INFO_REQUEST:
        return this.requestInfo(user, applicationId, dto)
      default:
        throw AppError.badRequest('Неизвестный тип решения')
    }
  }

  async sign(user: AuthenticatedUser, applicationId: string): Promise<DecisionResultDto> {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }

    const updated = await this.state.transition({
      application,
      to: ApplicationStatus.DOCS_SIGNED,
      actorId: user.id,
      reason: 'Клиент подписал документы (симуляция)',
    })

    this.logger.log(`Заявка ${applicationId}: документы подписаны`)

    await this.notifications.create({
      userId: application.clientId,
      applicationId,
      type: NotificationType.STATUS_CHANGED,
      text: `Документы по заявке ${applicationId} подписаны`,
    })

    return {
      applicationId,
      type: 'SIGN',
      status: updated.status,
      offerId: null,
      reason: null,
      createdAt: updated.updatedAt.toISOString(),
    }
  }

  async disburse(user: AuthenticatedUser, applicationId: string): Promise<DecisionResultDto> {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }

    const updated = await this.state.transition({
      application,
      to: ApplicationStatus.DISBURSED,
      actorId: user.id,
      reason: 'Средства предоставлены (симуляция)',
    })

    await this.notifications.create({
      userId: application.clientId,
      applicationId,
      type: NotificationType.STATUS_CHANGED,
      text: `Кредит по заявке ${applicationId} предоставлен`,
    })

    return {
      applicationId,
      type: 'DISBURSE',
      status: updated.status,
      offerId: null,
      reason: null,
      createdAt: updated.updatedAt.toISOString(),
    }
  }

  private async approve(
    user: AuthenticatedUser,
    applicationId: string,
    dto: BankDecisionDto,
  ): Promise<DecisionResultDto> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { product: true },
    })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }

    await this.expireActiveOffers(applicationId)

    const offer = await this.prisma.offer.create({
      data: {
        applicationId,
        amount: application.amount,
        term: application.term,
        rate: application.product.rate,
        type: OfferType.STANDARD,
        status: 'ACTIVE',
        message: dto.message ?? 'Кредит одобрен на запрошенных условиях',
      },
    })

    const updated = await this.state.transition({
      application,
      to: ApplicationStatus.APPROVED,
      actorId: user.id,
      reason: dto.reason ?? 'Заявка одобрена',
    })

    await this.registerDecision(user, applicationId, DecisionType.APPROVE, dto, offer.id)
    await this.notifyClient(applicationId, `Заявка ${applicationId} одобрена`)

    return {
      applicationId,
      type: DecisionType.APPROVE,
      status: updated.status,
      offerId: offer.id,
      reason: dto.reason ?? null,
      createdAt: updated.updatedAt.toISOString(),
    }
  }

  private async counterOffer(
    user: AuthenticatedUser,
    applicationId: string,
    dto: BankDecisionDto,
  ): Promise<DecisionResultDto> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { product: true },
    })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }

    await this.expireActiveOffers(applicationId)

    const amount = dto.counterAmount ?? Math.round((application.amount * 0.8) / 10000) * 10000
    const term = dto.counterTerm ?? Math.min(application.product.maxTerm, application.term + 6)
    const rate = dto.counterRate ?? Number((application.product.rate + 2).toFixed(2))

    const offer = await this.prisma.offer.create({
      data: {
        applicationId,
        amount,
        term,
        rate,
        type: OfferType.COUNTER,
        status: 'ACTIVE',
        message:
          dto.message ??
          `Готовы предоставить ${amount} ₽ на ${term} мес. под ${rate}% вместо ${application.amount} ₽ на ${application.term} мес.`,
      },
    })

    const updated = await this.state.transition({
      application,
      to: ApplicationStatus.COUNTER_OFFER,
      actorId: user.id,
      reason: dto.reason ?? 'Одобрено на изменённых условиях',
    })

    await this.registerDecision(user, applicationId, DecisionType.COUNTER_OFFER, dto, offer.id)
    await this.notifyClient(applicationId, `По заявке ${applicationId} получено контрпредложение`)

    return {
      applicationId,
      type: DecisionType.COUNTER_OFFER,
      status: updated.status,
      offerId: offer.id,
      reason: dto.reason ?? null,
      createdAt: updated.updatedAt.toISOString(),
    }
  }

  private async reject(
    user: AuthenticatedUser,
    applicationId: string,
    dto: BankDecisionDto,
  ): Promise<DecisionResultDto> {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }

    const reason = dto.reason ?? 'Заявка отклонена по результатам оценки риска'
    const updated = await this.state.transition({
      application,
      to: ApplicationStatus.REJECTED,
      actorId: user.id,
      reason,
    })

    await this.registerDecision(user, applicationId, DecisionType.REJECT, dto, null)
    await this.notifyClient(applicationId, `Заявка ${applicationId} отклонена: ${reason}`)

    return {
      applicationId,
      type: DecisionType.REJECT,
      status: updated.status,
      offerId: null,
      reason,
      createdAt: updated.updatedAt.toISOString(),
    }
  }

  private async requestInfo(
    user: AuthenticatedUser,
    applicationId: string,
    dto: BankDecisionDto,
  ): Promise<DecisionResultDto> {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }

    const missingFields = dto.missingFields ?? []
    const reason = dto.reason ?? 'Требуются дополнительные данные'

    for (const field of missingFields) {
      await this.prisma.applicationData.upsert({
        where: { applicationId_field: { applicationId, field } },
        create: { applicationId, field, value: '', label: `Запрошено банком: ${field}` },
        update: { label: `Запрошено банком: ${field}` },
      })
    }

    const updated = await this.state.transition({
      application,
      to: ApplicationStatus.INFO_REQUESTED,
      actorId: user.id,
      reason,
      notifyUserId: application.clientId,
      notificationText: `По заявке ${applicationId} нужны дополнительные данные: ${
        missingFields.join(', ') || reason
      }`,
    })

    await this.registerDecision(user, applicationId, DecisionType.INFO_REQUEST, dto, null)

    return {
      applicationId,
      type: DecisionType.INFO_REQUEST,
      status: updated.status,
      offerId: null,
      reason,
      createdAt: updated.updatedAt.toISOString(),
    }
  }

  private async registerDecision(
    user: AuthenticatedUser,
    applicationId: string,
    type: DecisionType,
    dto: BankDecisionDto,
    offerId: string | null,
  ): Promise<void> {
    await this.prisma.decision.create({
      data: {
        applicationId,
        type,
        actorId: user.id,
        reason: dto.reason ?? null,
        payload: JSON.stringify({
          counterAmount: dto.counterAmount ?? null,
          counterTerm: dto.counterTerm ?? null,
          counterRate: dto.counterRate ?? null,
          missingFields: dto.missingFields ?? [],
          offerId,
        }),
      },
    })

    await this.audit.record({
      actorId: user.id,
      applicationId,
      entityType: 'APPLICATION',
      entityId: applicationId,
      action: `DECISION_${type}`,
      payload: { ...dto, offerId },
    })
  }

  private async notifyClient(applicationId: string, text: string): Promise<void> {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId } })
    if (!application) {
      return
    }
    await this.notifications.create({
      userId: application.clientId,
      applicationId,
      type: NotificationType.DECISION_MADE,
      text,
    })
  }

  private async expireActiveOffers(applicationId: string): Promise<void> {
    await this.prisma.offer.updateMany({
      where: { applicationId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    })
  }

  async latestScoring(applicationId: string) {
    return this.scoring.getLatest(applicationId)
  }
}
