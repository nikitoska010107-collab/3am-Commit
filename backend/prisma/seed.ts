import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_PASSWORD = 'demo'

const products = [
  {
    code: 'biz-credit',
    name: 'Кредит на развитие бизнеса',
    minAmount: 300000,
    maxAmount: 5000000,
    minTerm: 3,
    maxTerm: 60,
    rate: 18.5,
    description:
      'Универсальный кредит на развитие: расширение производства, запуск новой линии или развитие сети. Решение по заявке — от одних суток.',
    purpose: 'Развитие бизнеса',
    sortOrder: 1,
  },
  {
    code: 'working-capital',
    name: 'Кредит на пополнение оборотных средств',
    minAmount: 100000,
    maxAmount: 2000000,
    minTerm: 1,
    maxTerm: 36,
    rate: 21,
    description:
      'Покрытие кассовых разрывов, закупка товара и расчёты с поставщиками. Быстрый лимит без залога.',
    purpose: 'Оборотные средства',
    sortOrder: 2,
  },
  {
    code: 'equipment',
    name: 'Кредит на покупку оборудования',
    minAmount: 500000,
    maxAmount: 8000000,
    minTerm: 12,
    maxTerm: 60,
    rate: 16.9,
    description:
      'Специализированный кредит на обновление основных фондов: лизинговые условия, срок до 5 лет, гибкий график платежей.',
    purpose: 'Покупка оборудования',
    sortOrder: 3,
  },
]

const companies = [
  {
    inn: '7701234567',
    ogrn: '1107746000012',
    name: 'ООО «Восход»',
    legalForm: 'ООО',
    industry: 'Производство',
    revenue: 25000000,
    foundedAt: new Date('2019-04-12T00:00:00.000Z'),
    status: 'ACTIVE',
  },
  {
    inn: '7709876543',
    ogrn: '3157746001234',
    name: 'ИП Орлов П. С.',
    legalForm: 'ИП',
    industry: 'Торговля',
    revenue: 8500000,
    foundedAt: new Date('2021-09-01T00:00:00.000Z'),
    status: 'ACTIVE',
  },
  {
    inn: '7705554433',
    ogrn: '1227700004321',
    name: 'ООО «Северторг»',
    legalForm: 'ООО',
    industry: 'Строительство',
    revenue: 4200000,
    foundedAt: new Date('2024-02-20T00:00:00.000Z'),
    status: 'ACTIVE',
  },
]

const users = [
  {
    email: 'client.approve@demo.local',
    name: 'Анна Смирнова',
    role: 'CLIENT',
    companyInn: '7701234567',
  },
  {
    email: 'client.counter@demo.local',
    name: 'Павел Орлов',
    role: 'CLIENT',
    companyInn: '7709876543',
  },
  {
    email: 'client.reject@demo.local',
    name: 'Мария Волкова',
    role: 'CLIENT',
    companyInn: '7705554433',
  },
  {
    email: 'underwriter@demo.local',
    name: 'Игорь Петров',
    role: 'UNDERWRITER',
    companyInn: null,
  },
  {
    email: 'admin@demo.local',
    name: 'Анна Глазкова',
    role: 'ADMIN',
    companyInn: null,
  },
]

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      create: product,
      update: {
        name: product.name,
        minAmount: product.minAmount,
        maxAmount: product.maxAmount,
        minTerm: product.minTerm,
        maxTerm: product.maxTerm,
        rate: product.rate,
        description: product.description,
        purpose: product.purpose,
        sortOrder: product.sortOrder,
      },
    })
  }

  const companyIds = new Map<string, string>()

  for (const company of companies) {
    const record = await prisma.company.upsert({
      where: { inn: company.inn },
      create: company,
      update: {
        name: company.name,
        legalForm: company.legalForm,
        industry: company.industry,
        revenue: company.revenue,
        foundedAt: company.foundedAt,
        status: company.status,
      },
    })
    companyIds.set(company.inn, record.id)
  }

  const userIds = new Map<string, string>()

  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
        companyId: user.companyInn ? companyIds.get(user.companyInn) : null,
      },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        companyId: user.companyInn ? companyIds.get(user.companyInn) : null,
      },
    })
    userIds.set(user.email, record.id)
  }

  const bizCredit = await prisma.product.findUniqueOrThrow({ where: { code: 'biz-credit' } })
  const equipment = await prisma.product.findUniqueOrThrow({ where: { code: 'equipment' } })

  const drafts = [
    {
      clientEmail: 'client.approve@demo.local',
      productId: bizCredit.id,
      amount: 1500000,
      term: 24,
      purpose: 'Закупка оборудования для расширения производства',
      purposeCode: 'EQUIPMENT',
    },
    {
      clientEmail: 'client.counter@demo.local',
      productId: equipment.id,
      amount: 4000000,
      term: 36,
      purpose: 'Обновление производственной линии и запуск нового участка',
      purposeCode: 'EXPANSION',
    },
    {
      clientEmail: 'client.reject@demo.local',
      productId: bizCredit.id,
      amount: 2500000,
      term: 12,
      purpose: 'Покрытие кассового разрыва и текущих платежей поставщикам',
      purposeCode: 'WORKING_CAPITAL',
    },
  ]

  for (const draft of drafts) {
    const clientId = userIds.get(draft.clientEmail)
    if (!clientId) {
      continue
    }
    const existing = await prisma.application.findFirst({
      where: { clientId, productId: draft.productId, status: 'DRAFT' },
    })
    if (existing) {
      continue
    }
    await prisma.application.create({
      data: {
        clientId,
        companyId:
          companyIds.get(users.find((u) => u.email === draft.clientEmail)?.companyInn ?? '') ?? '',
        productId: draft.productId,
        amount: draft.amount,
        term: draft.term,
        purpose: draft.purpose,
        status: 'DRAFT',
        formPayload: JSON.stringify({
          purposeCode: draft.purposeCode,
          contactPhone: '+7 900 000-00-00',
          contactEmail: draft.clientEmail,
          monthlyTurnover: 1200000,
          employeeCount: 12,
          existingLoans: 1,
          hasOverdueDebt: false,
        }),
      },
    })
  }

  console.info('Seed завершён:', {
    products: products.length,
    companies: companies.length,
    users: users.length,
    drafts: drafts.length,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
