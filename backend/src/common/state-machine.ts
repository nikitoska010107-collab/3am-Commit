import { ApplicationStatus } from './enums'

export const STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: [ApplicationStatus.SUBMITTED, ApplicationStatus.CANCELLED],
  SUBMITTED: [ApplicationStatus.CHECKING],
  CHECKING: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.INFO_REQUESTED],
  UNDER_REVIEW: [
    ApplicationStatus.APPROVED,
    ApplicationStatus.COUNTER_OFFER,
    ApplicationStatus.REJECTED,
    ApplicationStatus.INFO_REQUESTED,
  ],
  INFO_REQUESTED: [ApplicationStatus.UNDER_REVIEW],
  APPROVED: [ApplicationStatus.OFFER_ACCEPTED],
  COUNTER_OFFER: [ApplicationStatus.OFFER_ACCEPTED, ApplicationStatus.CANCELLED],
  REJECTED: [],
  OFFER_ACCEPTED: [ApplicationStatus.DOCS_SIGNED],
  DOCS_SIGNED: [ApplicationStatus.DISBURSED],
  DISBURSED: [],
  CANCELLED: [],
}

export const CLIENT_INITIATED_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.SUBMITTED,
  ApplicationStatus.CANCELLED,
  ApplicationStatus.OFFER_ACCEPTED,
]

export const TERMINAL_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.REJECTED,
  ApplicationStatus.DISBURSED,
  ApplicationStatus.CANCELLED,
]

export const isTerminalStatus = (status: ApplicationStatus): boolean =>
  TERMINAL_STATUSES.includes(status)

export const canTransition = (from: ApplicationStatus, to: ApplicationStatus): boolean =>
  STATUS_TRANSITIONS[from]?.includes(to) ?? false
