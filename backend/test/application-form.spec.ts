import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { BankDecisionDto } from '../src/modules/bank/dto/decision.dto'
import {
  CreateApplicationDto,
  SubmitApplicationDto,
} from '../src/modules/applications/dto/application.dto'
import { RegisterDto } from '../src/modules/auth/dto/auth.dto'

const validateDto = async <T extends object>(
  type: new () => T,
  payload: Record<string, unknown>,
  options: { whitelist?: boolean; forbidNonWhitelisted?: boolean } = {},
): Promise<string[]> => {
  const instance = plainToInstance(type, payload)
  const errors = await validate(instance, options)
  return errors.flatMap((error) => Object.values(error.constraints ?? {}))
}

const validApplication = {
  productId: 'product-1',
  amount: 1500000,
  term: 24,
  purpose: 'Закупка оборудования для расширения производства',
  purposeCode: 'EQUIPMENT',
  contactPhone: '+7 900 111-22-33',
  contactEmail: 'client.approve@demo.local',
  monthlyTurnover: 2000000,
  employeeCount: 18,
  existingLoans: 0,
  hasOverdueDebt: false,
}

describe('валидация заявки', () => {
  it('принимает корректную заявку', async () => {
    expect(await validateDto(CreateApplicationDto, validApplication)).toEqual([])
  })

  it('отклоняет нулевую сумму, слишком длинный срок и неверную валюту полей', async () => {
    const errors = await validateDto(CreateApplicationDto, {
      ...validApplication,
      amount: 0,
      term: 121,
    })

    expect(errors.some((message) => message.includes('amount'))).toBe(true)
    expect(errors.some((message) => message.includes('term'))).toBe(true)
  })

  it('отклоняет слишком короткое назначение и неизвестный код цели', async () => {
    const errors = await validateDto(CreateApplicationDto, {
      ...validApplication,
      purpose: 'Кредит',
      purposeCode: 'НЕИЗВЕСТНО',
    })

    expect(errors.some((message) => message.includes('purpose'))).toBe(true)
    expect(errors.some((message) => message.includes('purposeCode'))).toBe(true)
  })

  it('проверяет e-mail и телефон в анкете', async () => {
    const errors = await validateDto(CreateApplicationDto, {
      ...validApplication,
      contactEmail: 'not-an-email',
      contactPhone: '123',
    })

    expect(errors.some((message) => message.includes('contactEmail'))).toBe(true)
    expect(errors.some((message) => message.includes('contactPhone'))).toBe(true)
  })

  it('не принимает строку вместо булева признака просрочки', async () => {
    const errors = await validateDto(CreateApplicationDto, {
      ...validApplication,
      hasOverdueDebt: 'нет',
    })

    expect(errors.some((message) => message.includes('hasOverdueDebt'))).toBe(true)
  })

  it('не пропускает неизвестные поля при forbidNonWhitelisted', async () => {
    const instance = plainToInstance(CreateApplicationDto, {
      ...validApplication,
      hacker: 'лишнее поле',
    })
    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true })

    expect(
      errors.some((error) => (error.constraints?.whitelistValidation ?? '').includes('hacker')),
    ).toBe(true)
  })

  it('отклоняет отправку без подтверждения клиента, если передан неверный тип', async () => {
    const errors = await validateDto(SubmitApplicationDto, { confirm: 'да' })
    expect(errors.some((message) => message.includes('confirm'))).toBe(true)
  })
})

describe('валидация решения банка', () => {
  it('принимает решение об одобрении без контрпараметров', async () => {
    expect(await validateDto(BankDecisionDto, { type: 'APPROVE' })).toEqual([])
  })

  it('отклоняет неизвестный тип решения', async () => {
    const errors = await validateDto(BankDecisionDto, { type: 'MAYBE' })
    expect(errors.some((message) => message.includes('type'))).toBe(true)
  })

  it('проверяет параметры контрпредложения и список недостающих полей', async () => {
    const errors = await validateDto(BankDecisionDto, {
      type: 'INFO_REQUEST',
      counterAmount: -5,
      missingFields: [42],
    })

    expect(errors.some((message) => message.includes('counterAmount'))).toBe(true)
    expect(errors.some((message) => message.includes('missingFields'))).toBe(true)
  })
})

describe('валидация регистрации', () => {
  it('требует компанию, ИНН и пароль не короче 8 символов', async () => {
    const errors = await validateDto(RegisterDto, {
      email: 'anna@demo.local',
      password: 'demo',
      name: 'А',
      company: {
        name: 'О',
        inn: '123',
        legalForm: 'АО',
        industry: 'Т',
        revenue: -1,
        foundedAt: 'не дата',
      },
    })

    expect(errors.some((message) => message.includes('password'))).toBe(true)
    expect(errors.some((message) => message.includes('name'))).toBe(true)
  })
})
