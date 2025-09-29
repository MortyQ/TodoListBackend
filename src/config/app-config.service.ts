import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  // Порт сервера
  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  // MongoDB URI
  get mongodbUri(): string {
    return this.configService.get<string>('MONGODB_URI');
  }

  // Название базы данных
  get dbName(): string {
    return this.configService.get<string>('DB_NAME', 'todoapp');
  }

  // JWT секрет
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'change-me');
  }

  // JWT время жизни (0 = без истечения)
  get jwtExpiresIn(): string | undefined {
    const expires = this.configService.get<string>('JWT_EXPIRES_IN', '0');
    return expires === '0' ? undefined : expires;
  }

  // CORS origins
  get corsOrigins(): string | string[] {
    const origins = this.configService.get<string>('CORS_ORIGINS', '*');
    return origins === '*' ? '*' : origins.split(',').map(o => o.trim());
  }

  // Rate limiting TTL (время в секундах)
  get rateLimitTtl(): number {
    return this.configService.get<number>('RATE_LIMIT_TTL', 900);
  }

  // Rate limiting лимит запросов
  get rateLimitLimit(): number {
    return this.configService.get<number>('RATE_LIMIT_LIMIT', 100);
  }
}
