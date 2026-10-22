import { HttpException, HttpStatus } from '@nestjs/common'
import { ErrorCode, ErrorDetails } from './error-code'

export class AppError extends HttpException {
  constructor(code: ErrorCode, message: string, status: HttpStatus, details?: ErrorDetails) {
    super({ code, message, details }, status)
  }

  static badRequest(message: string, details?: ErrorDetails): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, HttpStatus.BAD_REQUEST, details)
  }

  static unauthorized(message = 'Требуется авторизация'): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED)
  }

  static forbidden(message = 'Недостаточно прав'): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN)
  }

  static notFound(message = 'Ресурс не найден'): AppError {
    return new AppError(ErrorCode.NOT_FOUND, message, HttpStatus.NOT_FOUND)
  }

  static conflict(message: string, details?: ErrorDetails): AppError {
    return new AppError(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT, details)
  }

  static invalidTransition(from: string, to: string): AppError {
    return new AppError(
      ErrorCode.INVALID_TRANSITION,
      `Недопустимый переход статуса: ${from} -> ${to}`,
      HttpStatus.CONFLICT,
      { from, to },
    )
  }

  static internal(message = 'Внутренняя ошибка сервиса'): AppError {
    return new AppError(ErrorCode.INTERNAL_ERROR, message, HttpStatus.INTERNAL_SERVER_ERROR)
  }
}
