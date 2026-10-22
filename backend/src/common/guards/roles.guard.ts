import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { FastifyRequest } from 'fastify'
import { AppError } from '../errors/app-error'
import { UserRole } from '../enums'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { AuthenticatedUser } from '../decorators/current-user.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedUser }>()
    const user = request.user

    if (!user) {
      throw AppError.unauthorized('Отсутствует токен доступа')
    }

    if (!requiredRoles.includes(user.role)) {
      throw AppError.forbidden('Недостаточно прав для выполнения операции')
    }

    return true
  }
}
