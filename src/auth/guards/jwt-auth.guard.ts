import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// JWT Guard для защиты эндпоинтов
// Использует JWT стратегию для проверки токена в заголовке Authorization
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Наследует базовую логику от AuthGuard('jwt')
  // Автоматически проверяет JWT токен и добавляет пользователя в req.user
}
