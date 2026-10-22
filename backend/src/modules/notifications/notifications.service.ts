import { Injectable } from '@nestjs/common'
import { NotificationType } from '../../common/enums'
import { PrismaService } from '../../prisma/prisma.service'

export interface NotificationInput {
  userId: string
  applicationId?: string | null
  type: NotificationType
  text: string
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: NotificationInput): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId: input.userId,
        applicationId: input.applicationId ?? null,
        type: input.type,
        text: input.text,
      },
    })
  }

  async listForUser(userId: string, unreadOnly = false) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return notifications.map((notification) => ({
      id: notification.id,
      applicationId: notification.applicationId,
      type: notification.type,
      text: notification.text,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    }))
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } })
    if (!notification) {
      return null
    }
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })
    return {
      id: updated.id,
      applicationId: updated.applicationId,
      type: updated.type,
      text: updated.text,
      isRead: updated.isRead,
      createdAt: updated.createdAt.toISOString(),
    }
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
    return result.count
  }
}
