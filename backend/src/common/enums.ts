export const UserRole = {
  CLIENT: 'CLIENT',
  UNDERWRITER: 'UNDERWRITER',
  ADMIN: 'ADMIN',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const ApplicationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  CHECKING: 'CHECKING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  INFO_REQUESTED: 'INFO_REQUESTED',
  APPROVED: 'APPROVED',
  COUNTER_OFFER: 'COUNTER_OFFER',
  REJECTED: 'REJECTED',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  DOCS_SIGNED: 'DOCS_SIGNED',
  DISBURSED: 'DISBURSED',
  CANCELLED: 'CANCELLED',
} as const
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus]

export const OfferType = {
  STANDARD: 'STANDARD',
  COUNTER: 'COUNTER',
} as const
export type OfferType = (typeof OfferType)[keyof typeof OfferType]

export const OfferStatus = {
  ACTIVE: 'ACTIVE',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus]

export const RiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel]

export const DecisionType = {
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  COUNTER_OFFER: 'COUNTER_OFFER',
  INFO_REQUEST: 'INFO_REQUEST',
} as const
export type DecisionType = (typeof DecisionType)[keyof typeof DecisionType]

export const NotificationType = {
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  INFO_REQUESTED: 'INFO_REQUESTED',
  DECISION_MADE: 'DECISION_MADE',
  COUNTER_OFFER: 'COUNTER_OFFER',
  DOCUMENTS_UPLOADED: 'DOCUMENTS_UPLOADED',
} as const
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export const ExternalCheckSource = {
  BKI: 'BKI',
  EGRUL: 'EGRUL',
  FNS: 'FNS',
} as const
export type ExternalCheckSource = (typeof ExternalCheckSource)[keyof typeof ExternalCheckSource]

export const ExternalCheckStatus = {
  PASSED: 'PASSED',
  WARNING: 'WARNING',
  FAILED: 'FAILED',
} as const
export type ExternalCheckStatus = (typeof ExternalCheckStatus)[keyof typeof ExternalCheckStatus]

export const DocumentKind = {
  FINANCIAL_STATEMENT: 'FINANCIAL_STATEMENT',
  BANK_STATEMENT: 'BANK_STATEMENT',
  REGISTRATION_DOCUMENT: 'REGISTRATION_DOCUMENT',
  OTHER: 'OTHER',
} as const
export type DocumentKind = (typeof DocumentKind)[keyof typeof DocumentKind]

export const LEGAL_FORMS = ['ООО', 'ИП', 'АО', 'ПАО', 'ГУП', 'МУП'] as const
export type LegalForm = (typeof LEGAL_FORMS)[number]
