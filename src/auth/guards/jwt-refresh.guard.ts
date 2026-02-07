import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// JWT Refresh Guard для защиты эндпоинта обновления токенов
// Использует JWT Refresh стратегию для проверки refresh токена
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
  // Наследует базовую логику от AuthGuard('jwt-refresh')
  // Автоматически проверяет JWT refresh токен и добавляет пользователя в req.user
}

