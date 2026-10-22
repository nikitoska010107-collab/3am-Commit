import { Injectable, Logger } from '@nestjs/common'
import { Application, StatusHistory } from '@prisma/client'
import { AppError } from '../../common/errors/app-error'
import { ApplicationStatus, NotificationType } from '../../common/enums'
import { canTransition } from '../../common/state-machine'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { NotificationsService } from '../notifications/notifications.service'

export interface TransitionInput {
  application: Application
  to: ApplicationStatus
  actorId?: string | null
  reason?: string | null
  notifyUserId?: string | null
  notificationText?: string
}

@Injectable()
export class ApplicationStateService {
  private readonly logger = new Logger(ApplicationStateService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async transition(input: TransitionInput): Promise<Application> {
    const from = input.application.status as ApplicationStatus
    if (!canTransition(from, input.to)) {
      throw AppError.invalidTransition(from, input.to)
    }

    const updated = await this.prisma.application.update({
      where: { id: input.application.id },
      data: { status: input.to },
    })

    await this.prisma.statusHistory.create({
      data: {
        applicationId: updated.id,
        fromStatus: from,
        toStatus: input.to,
        actorId: input.actorId ?? null,
        reason: input.reason ?? null,
      },
    })

    await this.audit.record({
      actorId: input.actorId ?? null,
      applicationId: updated.id,
      entityType: 'APPLICATION',
      entityId: updated.id,
      action: 'STATUS_CHANGED',
      payload: { from, to: input.to, reason: input.reason ?? null },
    })

    if (input.notifyUserId && input.notificationText) {
      await this.notifications.create({
        userId: input.notifyUserId,
        applicationId: updated.id,
        type:
          input.to === ApplicationStatus.INFO_REQUESTED
            ? NotificationType.INFO_REQUESTED
            : NotificationType.STATUS_CHANGED,
        text: input.notificationText,
      })
    }

    this.logger.log(`Заявка ${updated.id}: ${from} -> ${input.to}`)
    return updated
  }

  async history(applicationId: string): Promise<StatusHistory[]> {
    return this.prisma.statusHistory.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' },
    })
  }
}
