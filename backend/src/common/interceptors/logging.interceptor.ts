import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()
    const request = http.getRequest<FastifyRequest>()
    const startedAt = Date.now()

    return next.handle().pipe(
      map((data) => {
        this.logger.log(`${request.method} ${request.url} ${Date.now() - startedAt}ms`)
        return data
      }),
    )
  }
}
