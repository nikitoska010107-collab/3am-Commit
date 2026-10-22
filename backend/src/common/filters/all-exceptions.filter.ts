import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { ErrorCode } from '../errors/error-code'

interface ErrorBody {
  code: string
  message: string
  details?: unknown
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp()
    const request = http.getRequest<FastifyRequest>()
    const reply = http.getResponse<FastifyReply>()

    const { status, body } = this.normalize(exception)

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    void reply.status(status).send(body)
  }

  private normalize(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse()
      if (typeof payload === 'object' && payload !== null) {
        const record = payload as Record<string, unknown>
        const rawMessage = record.message
        const isValidation = Array.isArray(rawMessage)
        return {
          status: exception.getStatus(),
          body: {
            code:
              typeof record.code === 'string'
                ? record.code
                : this.codeForStatus(exception.getStatus()),
            message: isValidation
              ? 'Ошибка валидации данных'
              : typeof rawMessage === 'string'
                ? rawMessage
                : exception.message,
            details: record.details ?? (isValidation ? { fields: rawMessage } : undefined),
          },
        }
      }
      return {
        status: exception.getStatus(),
        body: {
          code: this.codeForStatus(exception.getStatus()),
          message: typeof payload === 'string' ? payload : exception.message,
        },
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Внутренняя ошибка сервера',
      },
    }
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT
      default:
        return status >= HttpStatus.INTERNAL_SERVER_ERROR
          ? ErrorCode.INTERNAL_ERROR
          : ErrorCode.VALIDATION_ERROR
    }
  }
}
