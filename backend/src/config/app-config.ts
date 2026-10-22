import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Env, parseCorsOrigins, parseDurationSeconds } from './env'

@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get port(): number {
    return this.config.get('PORT', { infer: true })
  }

  get host(): string {
    return this.config.get('HOST', { infer: true })
  }

  get jwtSecret(): string {
    return this.config.get('JWT_SECRET', { infer: true })
  }

  get jwtExpiresIn(): string {
    return this.config.get('JWT_EXPIRES_IN', { infer: true })
  }

  get jwtExpiresInSeconds(): number {
    return parseDurationSeconds(this.jwtExpiresIn)
  }

  get corsOrigins(): string[] {
    return parseCorsOrigins(this.config.get('CORS_ORIGINS', { infer: true }))
  }
}
