import { describe, expect, it } from 'vitest'
import { ApplicationStatus } from '../src/common/enums'
import {
  canTransition,
  isTerminalStatus,
  STATUS_TRANSITIONS,
  TERMINAL_STATUSES,
} from '../src/common/state-machine'

describe('машина статусов заявки', () => {
  it('разрешает клиентский путь от черновика до выдачи', () => {
    const path = [
      ApplicationStatus.DRAFT,
      ApplicationStatus.SUBMITTED,
      ApplicationStatus.CHECKING,
      ApplicationStatus.UNDER_REVIEW,
      ApplicationStatus.APPROVED,
      ApplicationStatus.OFFER_ACCEPTED,
      ApplicationStatus.DOCS_SIGNED,
      ApplicationStatus.DISBURSED,
    ]

    for (let index = 0; index < path.length - 1; index += 1) {
      expect(canTransition(path[index], path[index + 1])).toBe(true)
    }
  })

  it('разрешает контрпредложение и запрос данных', () => {
    expect(canTransition(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.COUNTER_OFFER)).toBe(
      true,
    )
    expect(canTransition(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.INFO_REQUESTED)).toBe(
      true,
    )
    expect(canTransition(ApplicationStatus.INFO_REQUESTED, ApplicationStatus.UNDER_REVIEW)).toBe(
      true,
    )
    expect(canTransition(ApplicationStatus.COUNTER_OFFER, ApplicationStatus.OFFER_ACCEPTED)).toBe(
      true,
    )
  })

  it('запрещает переходы из терминальных статусов', () => {
    for (const status of TERMINAL_STATUSES) {
      expect(STATUS_TRANSITIONS[status]).toEqual([])
      expect(isTerminalStatus(status)).toBe(true)
    }
  })

  it('запрещает перескок через этапы', () => {
    expect(canTransition(ApplicationStatus.DRAFT, ApplicationStatus.DISBURSED)).toBe(false)
    expect(canTransition(ApplicationStatus.SUBMITTED, ApplicationStatus.APPROVED)).toBe(false)
    expect(canTransition(ApplicationStatus.UNDER_REVIEW, ApplicationStatus.DOCS_SIGNED)).toBe(false)
    expect(canTransition(ApplicationStatus.REJECTED, ApplicationStatus.UNDER_REVIEW)).toBe(false)
  })

  it('не позволяет принимать решение по заявке вне рассмотрения', () => {
    expect(canTransition(ApplicationStatus.DRAFT, ApplicationStatus.APPROVED)).toBe(false)
    expect(canTransition(ApplicationStatus.CHECKING, ApplicationStatus.APPROVED)).toBe(false)
  })
})
