import { Injectable } from '@nestjs/common'
import { Application, Prisma } from '@prisma/client'
import { AppError } from '../../common/errors/app-error'
import { ApplicationStatus, NotificationType, UserRole } from '../../common/enums'
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { NotificationsService } from '../notifications/notifications.service'
import { ApplicationStateService } from './application-state.service'
import {
  ApplicationResponseDto,
  CreateApplicationDto,
  InfoResponseDto,
  SubmitApplicationDto,
  UpdateApplicationDto,
} from './dto/application.dto'

const FORM_FIELDS = [
  'purposeCode',
  'contactPhone',
  'contactEmail',
  'monthlyTurnover',
  'averageSalary',
  'employeeCount',
  'existingLoans',
  'hasOverdueDebt',
] as const

type ApplicationWithRelations = Prisma.ApplicationGetPayload<{
  include: { product: true; company: true; client: true }
}>

export interface ApplicationListQuery {
  status?: string
  productId?: string
  clientId?: string
}

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly state: ApplicationStateService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async createDraft(
    user: AuthenticatedUser,
    dto: CreateApplicationDto,
  ): Promise<ApplicationResponseDto> {
    const product = await this.getActiveProduct(dto.productId)
    this.assertWithinProductLimits(product, dto.amount, dto.term)

    const company = await this.getCompanyForUser(user)

    const created = await this.prisma.application.create({
      data: {
        clientId: user.id,
        companyId: company.id,
        productId: product.id,
        amount: dto.amount,
        term: dto.term,
        purpose: dto.purpose.trim(),
        status: ApplicationStatus.DRAFT,
        formPayload: JSON.stringify(this.pickFormFields(dto as unknown as Record<string, unknown>)),
      },
    })

    await this.applyCompanySnapshot(company.id, dto.company)

    await this.audit.record({
      actorId: user.id,
      applicationId: created.id,
      entityType: 'APPLICATION',
      entityId: created.id,
      action: 'APPLICATION_CREATED',
      payload: { amount: dto.amount, term: dto.term, productId: product.id },
    })

    return this.toResponse(await this.reload(created.id))
  }

  async updateDraft(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateApplicationDto,
  ): Promise<ApplicationResponseDto> {
    const application = await this.getAccessible(user, id)

    if (application.status !== ApplicationStatus.DRAFT) {
      throw AppError.conflict('Редактировать заявку можно только в статусе DRAFT', {
        status: application.status,
      })
    }

    const product = await this.prisma.product.findUnique({ where: { id: application.productId } })
    if (!product) {
      throw AppError.notFound('Кредитный продукт не найден')
    }

    const amount = dto.amount ?? application.amount
    const term = dto.term ?? application.term
    this.assertWithinProductLimits(product, amount, term)

    const formPayload = {
      ...this.parseFormPayload(application.formPayload),
      ...this.pickFormFields(dto as unknown as Record<string, unknown>),
    }

    await this.prisma.application.update({
      where: { id: application.id },
      data: {
        amount,
        term,
        ...(dto.purpose ? { purpose: dto.purpose.trim() } : {}),
        formPayload: JSON.stringify(formPayload),
      },
    })

    await this.applyCompanySnapshot(application.companyId, dto.company)

    await this.audit.record({
      actorId: user.id,
      applicationId: application.id,
      entityType: 'APPLICATION',
      entityId: application.id,
      action: 'APPLICATION_UPDATED',
      payload: { amount, term },
    })

    return this.toResponse(await this.reload(application.id))
  }

  async list(
    user: AuthenticatedUser,
    query: ApplicationListQuery,
  ): Promise<ApplicationResponseDto[]> {
    const where = this.buildListWhere(user, query)
    const applications = await this.prisma.application.findMany({
      where,
      include: { product: true, company: true, client: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return applications.map((application) => this.toResponse(application))
  }

  async getOne(user: AuthenticatedUser, id: string): Promise<ApplicationResponseDto> {
    const application = await this.getAccessible(user, id)
    return this.toResponse(await this.reload(application.id))
  }

  async submit(
    user: AuthenticatedUser,
    id: string,
    dto: SubmitApplicationDto,
  ): Promise<ApplicationResponseDto> {
    const application = await this.getAccessible(user, id)

    if (application.status !== ApplicationStatus.DRAFT) {
      throw AppError.conflict('Отправить можно только черновик заявки', {
        status: application.status,
      })
    }

    const formPayload = {
      ...this.parseFormPayload(application.formPayload),
      ...this.pickFormFields(dto as unknown as Record<string, unknown>),
    }

    const company = await this.prisma.company.findUnique({ where: { id: application.companyId } })
    if (!company) {
      throw AppError.notFound('Компания не найдена')
    }

    const missingFields = this.collectMissingFields(application, formPayload, company)
    if (missingFields.length) {
      throw AppError.badRequest('Заявка заполнена не полностью', { missingFields })
    }

    await this.prisma.application.update({
      where: { id: application.id },
      data: { formPayload: JSON.stringify(formPayload) },
    })

    const updated = await this.state.transition({
      application,
      to: ApplicationStatus.SUBMITTED,
      actorId: user.id,
      reason: 'Клиент отправил заявку',
    })

    await this.notifyUnderwriters(updated.id, `Новая заявка ${updated.id} на рассмотрение`)

    return this.toResponse(await this.reload(updated.id))
  }

  async cancel(user: AuthenticatedUser, id: string): Promise<ApplicationResponseDto> {
    const application = await this.getAccessible(user, id)

    const updated = await this.state.transition({
      application,
      to: ApplicationStatus.CANCELLED,
      actorId: user.id,
      reason: 'Клиент отозвал заявку',
    })

    return this.toResponse(await this.reload(updated.id))
  }

  async respondToInfoRequest(
    user: AuthenticatedUser,
    id: string,
    dto: InfoResponseDto,
  ): Promise<ApplicationResponseDto> {
    const application = await this.getAccessible(user, id)

    if (application.status !== ApplicationStatus.INFO_REQUESTED) {
      throw AppError.conflict('Заявка не находится в статусе ожидания данных', {
        status: application.status,
      })
    }

    for (const answer of dto.answers) {
      await this.prisma.applicationData.upsert({
        where: { applicationId_field: { applicationId: application.id, field: answer.field } },
        create: {
          applicationId: application.id,
          field: answer.field,
          value: answer.value,
          label: answer.label ?? null,
        },
        update: { value: answer.value, label: answer.label ?? null },
      })
    }

    const updated = await this.state.transition({
      application,
      to: ApplicationStatus.UNDER_REVIEW,
      actorId: user.id,
      reason: 'Клиент предоставил дополнительные данные',
    })

    await this.notifyUnderwriters(
      updated.id,
      `Клиент ответил на запрос данных по заявке ${updated.id}`,
    )

    return this.toResponse(await this.reload(updated.id))
  }

  async acceptOffer(user: AuthenticatedUser, id: string): Promise<ApplicationResponseDto> {
    const application = await this.getAccessible(user, id)

    if (
      application.status !== ApplicationStatus.APPROVED &&
      application.status !== ApplicationStatus.COUNTER_OFFER
    ) {
      throw AppError.conflict('Принять предложение можно только по одобренной заявке', {
        status: application.status,
      })
    }

    const offer = await this.prisma.offer.findFirst({
      where: { applicationId: application.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    })
    if (!offer) {
      throw AppError.conflict('Активное предложение по заявке не найдено')
    }

    await this.prisma.offer.update({ where: { id: offer.id }, data: { status: 'ACCEPTED' } })

    const updated = await this.state.transition({
      application,
      to: ApplicationStatus.OFFER_ACCEPTED,
      actorId: user.id,
      reason: 'Клиент принял условия кредита',
    })

    await this.notifications.create({
      userId: application.clientId,
      applicationId: application.id,
      type: NotificationType.STATUS_CHANGED,
      text: `Вы приняли условия по заявке ${application.id}`,
    })

    return this.toResponse(await this.reload(updated.id))
  }

  async getAudit(user: AuthenticatedUser, id: string) {
    await this.getAccessible(user, id)
    return this.audit.listForApplication(id)
  }

  async getHistory(user: AuthenticatedUser, id: string) {
    await this.getAccessible(user, id)
    const history = await this.state.history(id)
    return history.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      actorId: entry.actorId,
      reason: entry.reason,
      createdAt: entry.createdAt.toISOString(),
    }))
  }

  async getData(user: AuthenticatedUser, id: string) {
    await this.getAccessible(user, id)
    const data = await this.prisma.applicationData.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'asc' },
    })
    return data.map((item) => ({
      id: item.id,
      field: item.field,
      value: item.value,
      label: item.label,
    }))
  }

  async getOffers(user: AuthenticatedUser, id: string) {
    await this.getAccessible(user, id)
    const offers = await this.prisma.offer.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
    })
    return offers.map((offer) => ({
      id: offer.id,
      amount: offer.amount,
      term: offer.term,
      rate: offer.rate,
      type: offer.type,
      status: offer.status,
      message: offer.message,
      expiresAt: offer.expiresAt?.toISOString() ?? null,
      createdAt: offer.createdAt.toISOString(),
    }))
  }

  async getAccessible(user: AuthenticatedUser, id: string): Promise<Application> {
    const application = await this.prisma.application.findUnique({ where: { id } })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }
    if (user.role === UserRole.CLIENT && application.clientId !== user.id) {
      throw AppError.forbidden('Нет доступа к заявке')
    }
    return application
  }

  private async reload(id: string): Promise<ApplicationWithRelations> {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { product: true, company: true, client: true },
    })
    if (!application) {
      throw AppError.notFound('Заявка не найдена')
    }
    return application
  }

  private buildListWhere(
    user: AuthenticatedUser,
    query: ApplicationListQuery,
  ): Prisma.ApplicationWhereInput {
    const where: Prisma.ApplicationWhereInput = {}

    if (user.role === UserRole.CLIENT) {
      where.clientId = user.id
    } else if (query.clientId) {
      where.clientId = query.clientId
    }

    if (query.status) {
      where.status = query.status
    }
    if (query.productId) {
      where.productId = query.productId
    }

    return where
  }

  private async getActiveProduct(productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      throw AppError.notFound('Кредитный продукт не найден')
    }
    if (!product.isActive) {
      throw AppError.badRequest('Кредитный продукт недоступен для заявки', { productId })
    }
    return product
  }

  private async getCompanyForUser(user: AuthenticatedUser) {
    if (!user.companyId) {
      throw AppError.badRequest('У пользователя не привязана компания')
    }
    const company = await this.prisma.company.findUnique({ where: { id: user.companyId } })
    if (!company) {
      throw AppError.notFound('Компания не найдена')
    }
    return company
  }

  private assertWithinProductLimits(
    product: { minAmount: number; maxAmount: number; minTerm: number; maxTerm: number },
    amount: number,
    term: number,
  ): void {
    const details: Record<string, unknown> = {}

    if (amount < product.minAmount || amount > product.maxAmount) {
      details.amount = `Сумма должна быть в диапазоне от ${product.minAmount} до ${product.maxAmount} ₽`
    }
    if (term < product.minTerm || term > product.maxTerm) {
      details.term = `Срок должен быть в диапазоне от ${product.minTerm} до ${product.maxTerm} мес.`
    }

    if (Object.keys(details).length) {
      throw AppError.badRequest('Параметры заявки не соответствуют условиям продукта', details)
    }
  }

  private collectMissingFields(
    application: Application,
    formPayload: Record<string, unknown>,
    company: { inn: string; industry: string; revenue: number; foundedAt: Date },
  ): string[] {
    const missing: string[] = []

    if (!formPayload.contactPhone) {
      missing.push('contactPhone')
    }
    if (!formPayload.contactEmail) {
      missing.push('contactEmail')
    }
    if (!company.inn) {
      missing.push('company.inn')
    }
    if (!company.industry) {
      missing.push('company.industry')
    }
    if (!company.revenue) {
      missing.push('company.revenue')
    }
    if (!company.foundedAt) {
      missing.push('company.foundedAt')
    }
    if (!application.purpose || application.purpose.length < 10) {
      missing.push('purpose')
    }

    return missing
  }

  private async applyCompanySnapshot(
    companyId: string,
    snapshot?: {
      name?: string
      inn?: string
      legalForm?: string
      industry?: string
      revenue?: number
      foundedAt?: string
    },
  ): Promise<void> {
    if (!snapshot) {
      return
    }

    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(snapshot.name ? { name: snapshot.name.trim() } : {}),
        ...(snapshot.inn ? { inn: snapshot.inn.trim() } : {}),
        ...(snapshot.legalForm ? { legalForm: snapshot.legalForm } : {}),
        ...(snapshot.industry ? { industry: snapshot.industry.trim() } : {}),
        ...(snapshot.revenue !== undefined ? { revenue: snapshot.revenue } : {}),
        ...(snapshot.foundedAt ? { foundedAt: new Date(snapshot.foundedAt) } : {}),
      },
    })
  }

  private pickFormFields(source: Record<string, unknown>): Record<string, unknown> {
    const payload: Record<string, unknown> = {}
    for (const field of FORM_FIELDS) {
      const value = source[field]
      if (value !== undefined) {
        payload[field] = value
      }
    }
    return payload
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

  private async notifyUnderwriters(applicationId: string, text: string): Promise<void> {
    const underwriters = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.UNDERWRITER, UserRole.ADMIN] } },
      select: { id: true },
    })
    for (const underwriter of underwriters) {
      await this.notifications.create({
        userId: underwriter.id,
        applicationId,
        type: NotificationType.APPLICATION_SUBMITTED,
        text,
      })
    }
  }

  private toResponse(application: ApplicationWithRelations): ApplicationResponseDto {
    return {
      id: application.id,
      status: application.status,
      amount: application.amount,
      term: application.term,
      purpose: application.purpose,
      purposeCode: (this.parseFormPayload(application.formPayload).purposeCode as string) ?? null,
      product: {
        id: application.product.id,
        code: application.product.code,
        name: application.product.name,
        rate: application.product.rate,
        minAmount: application.product.minAmount,
        maxAmount: application.product.maxAmount,
        minTerm: application.product.minTerm,
        maxTerm: application.product.maxTerm,
      },
      company: {
        id: application.company.id,
        inn: application.company.inn,
        name: application.company.name,
        legalForm: application.company.legalForm,
        industry: application.company.industry,
        revenue: application.company.revenue,
        foundedAt: application.company.foundedAt.toISOString(),
        status: application.company.status,
      },
      client: {
        id: application.client.id,
        email: application.client.email,
        name: application.client.name,
      },
      formPayload: this.parseFormPayload(application.formPayload),
      missingFields: [],
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
    }
  }
}
