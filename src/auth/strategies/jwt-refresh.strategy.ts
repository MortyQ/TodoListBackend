import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../config/app-config.service';

// Интерфейс для JWT Refresh Payload
export interface JwtRefreshPayload {
  sub: string; // ID пользователя
  type: string; // Тип токена ('refresh')
}

// Стратегия для проверки JWT Refresh токенов
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'), // извлекаем refresh token из тела запроса
      ignoreExpiration: false,
      secretOrKey: configService.jwtRefreshSecret, // отдельный секрет для refresh токенов
    });
  }

  // Этот метод вызывается после успешной проверки токена
  async validate(payload: JwtRefreshPayload) {
    // Проверяем тип токена для дополнительной безопасности
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    return {
      id: payload.sub,
    };
  }
}

