import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { FastifyRequest } from 'fastify'
import { AppError } from '../errors/app-error'
import { UserRole } from '../enums'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { AuthenticatedUser } from '../decorators/current-user.decorator'

export interface JwtPayload {
  sub: string
  email: string
  name: string
  role: UserRole
  companyId: string | null
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) {
      return true
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedUser }>()
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Отсутствует токен доступа')
    }

    const token = header.slice('Bearer '.length).trim()
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token)
      request.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        companyId: payload.companyId,
      }
    } catch {
      throw AppError.unauthorized('Токен доступа недействителен или истёк')
    }

    return true
  }
}
