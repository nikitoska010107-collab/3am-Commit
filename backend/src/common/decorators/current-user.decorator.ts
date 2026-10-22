import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { UserRole } from '../enums'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: UserRole
  companyId: string | null
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthenticatedUser }>()
    const user = request.user
    return data && user ? user[data] : user
  },
)
