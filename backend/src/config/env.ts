import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL обязателен'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET должен быть не короче 8 символов'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
})

export type Env = z.infer<typeof envSchema>

export const validateEnv = (config: Record<string, unknown>): Env => envSchema.parse(config)

export const parseCorsOrigins = (raw: string): string[] =>
  raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

const DURATION_MULTIPLIERS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }

export const parseDurationSeconds = (raw: string, fallback = 86400): number => {
  const match = /^(\d+)\s*([smhd])?$/.exec(raw.trim())
  if (!match) {
    return fallback
  }
  const value = Number(match[1])
  const unit = match[2] ?? 's'
  return value * (DURATION_MULTIPLIERS[unit] ?? 1)
}
