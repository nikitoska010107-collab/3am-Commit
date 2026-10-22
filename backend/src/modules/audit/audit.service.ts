import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

export type AuditEntityType =
  'APPLICATION' | 'USER' | 'PRODUCT' | 'OFFER' | 'DOCUMENT' | 'CREDIT_REPORT'

export interface AuditEntryInput {
  actorId?: string | null
  applicationId?: string | null
  entityType: AuditEntityType
  entityId: string
  action: string
  payload?: unknown
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditEntryInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        applicationId: input.applicationId ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        payload: input.payload === undefined ? null : JSON.stringify(input.payload),
      },
    })
  }

  async listForApplication(applicationId: string) {
    const entries = await this.prisma.auditLog.findMany({
      where: { applicationId },
      include: { actor: { select: { id: true, email: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return entries.map((entry) => ({
      id: entry.id,
      actorId: entry.actorId,
      actor: entry.actor
        ? {
            id: entry.actor.id,
            email: entry.actor.email,
            name: entry.actor.name,
            role: entry.actor.role,
          }
        : null,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      payload: entry.payload ? safeParse(entry.payload) : null,
      createdAt: entry.createdAt.toISOString(),
    }))
  }
}

const safeParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}
