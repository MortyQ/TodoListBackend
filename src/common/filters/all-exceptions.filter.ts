import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

// Интерфейс для унифицированного формата ошибок
interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: number;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      // Обрабатываем HTTP исключения (валидация, авторизация и т.д.)
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        errorResponse = { message: exceptionResponse };
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;

        // Обрабатываем валидационные ошибки от class-validator
        if (responseObj.message && Array.isArray(responseObj.message)) {
          errorResponse = {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: responseObj.message,
          };
        } else {
          errorResponse = {
            message: responseObj.message || 'An error occurred',
            code: responseObj.code,
            details: responseObj.details,
          };
        }
      } else {
        errorResponse = { message: 'An error occurred' };
      }
    } else {
      // Обрабатываем неожиданные ошибки
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      };

      // Логируем неожиданные ошибки
      this.logger.error(
        `Unexpected error: ${exception}`,
        exception instanceof Error ? exception.stack : undefined,
        `${request.method} ${request.url}`,
      );
    }

    // Отправляем унифицированный ответ
    response.status(status).json(errorResponse);
  }
}
