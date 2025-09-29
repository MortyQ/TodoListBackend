import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../config/app-config.service';

// Интерфейс для JWT payload (данные в токене)
export interface JwtPayload {
  sub: string; // ID пользователя
  email: string;
  role: string;
}

// Стратегия для проверки JWT токенов
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // извлекаем токен из Authorization header
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret, // секрет для проверки токена
    });
  }

  // Этот метод вызывается после успешной проверки токена
  // Данные из payload становятся доступными в req.user
  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
