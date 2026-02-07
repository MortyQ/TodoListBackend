# 🤖 Промпт для ИИ: Внедрение Refresh Token Функционала

## 📋 Контекст

Ты - Senior Backend разработчик, работающий над проектом **TodoBackend API** (NestJS + TypeScript + MongoDB).

Твоя задача: **Внедрить полноценный механизм Refresh Token для JWT аутентификации**.

---

## 🎯 Цель Задачи

Реализовать безопасную систему обновления JWT токенов с использованием Refresh Token, которая:
1. ✅ Улучшит безопасность (короткий TTL для access token)
2. ✅ Улучшит UX (автоматическое обновление токенов без повторного логина)
3. ✅ Позволит реализовать полноценный logout
4. ✅ Будет масштабируемой и следовать best practices

---

## 📊 Текущее Состояние Проекта

### Технологический стек:
- **Framework:** NestJS v10.0.0
- **Language:** TypeScript v5.1.0
- **Database:** MongoDB (Mongoose v7.0.0)
- **Auth:** JWT (@nestjs/jwt v10.0.0, passport-jwt v4.0.1)
- **Password Hashing:** argon2 v0.30.0
- **Validation:** class-validator + class-transformer
- **Docs:** Swagger (@nestjs/swagger v7.0.0)

### Текущая аутентификация:

#### 1. User Schema (`src/users/schemas/user.schema.ts`)
```typescript
@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  email: string;
  name?: string;
  passwordHash: string;  // select: false
  role: UserRole;  // 'user' | 'admin'
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Проблема:** Отсутствуют поля для хранения refresh token.

#### 2. Login Response (`src/auth/dto/auth.dto.ts`)
```typescript
export class LoginResponseDto {
  accessToken: string;
  // refreshToken ОТСУТСТВУЕТ
}
```

#### 3. Auth Service (`src/auth/auth.service.ts`)
```typescript
async login(loginDto: LoginDto): Promise<LoginResponseDto> {
  // 1. Проверка email/password
  // 2. Генерация ТОЛЬКО accessToken
  // 3. Возврат { accessToken }
}
```

**Проблема:** Нет генерации refresh token, нет сохранения в БД.

#### 4. Эндпоинты (`src/auth/auth.controller.ts`)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

**Проблема:** Нет эндпоинтов `/refresh` и `/logout`.

---

## 🎯 Требования к Реализации

### 1. Database Changes

**Обновить User Schema:**
```typescript
@Prop({ required: false, select: false })
refreshToken?: string;  // Хешированный refresh token (argon2)

@Prop({ required: false })
refreshTokenExpiresAt?: Date;  // Дата истечения
```

**Добавить индекс:**
```typescript
UserSchema.index({ refreshTokenExpiresAt: 1 });
```

---

### 2. Configuration (AppConfigService)

**Добавить методы:**
```typescript
get jwtRefreshSecret(): string {
  return this.configService.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh');
}

get jwtRefreshExpiresIn(): string {
  return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
}
```

**ENV переменные:**
```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m  # Access token (короткий!)
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d  # Refresh token (длинный)
```

---

### 3. DTOs

**Обновить LoginResponseDto:**
```typescript
export class LoginResponseDto {
  @ApiProperty({ description: 'Access token (short-lived)' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token (long-lived)' })
  refreshToken: string;
}
```

**Создать новые DTOs:**
```typescript
export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token from login' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
```

---

### 4. Auth Service Methods

#### 4.1 Обновить `login()`:

```typescript
async login(loginDto: LoginDto): Promise<LoginResponseDto> {
  // 1. Найти пользователя
  const user = await this.userModel.findOne({ email }).select('+passwordHash');
  
  // 2. Проверить пароль (argon2.verify)
  
  // 3. Генерировать Access Token (15 минут)
  const accessToken = this.generateAccessToken(user);
  
  // 4. Генерировать Refresh Token (7 дней)
  const refreshToken = this.generateRefreshToken(user);
  
  // 5. Хешировать Refresh Token (argon2.hash)
  const refreshTokenHash = await argon2.hash(refreshToken);
  
  // 6. Сохранить в БД
  await this.userModel.findByIdAndUpdate(user.id, {
    refreshToken: refreshTokenHash,
    refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  
  // 7. Вернуть оба токена
  return { accessToken, refreshToken };
}
```

#### 4.2 Создать `refresh()`:

```typescript
async refresh(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
  const { refreshToken } = refreshTokenDto;
  
  // 1. Валидировать JWT подпись refresh token
  let payload;
  try {
    payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.jwtRefreshSecret,
    });
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
  
  // 2. Найти пользователя
  const user = await this.userModel
    .findById(payload.sub)
    .select('+refreshToken');
  
  if (!user || !user.refreshToken) {
    throw new UnauthorizedException('Invalid refresh token');
  }
  
  // 3. Проверить истечение
  if (user.refreshTokenExpiresAt < new Date()) {
    throw new UnauthorizedException('Refresh token expired');
  }
  
  // 4. Сравнить хеши (argon2.verify)
  const isValid = await argon2.verify(user.refreshToken, refreshToken);
  if (!isValid) {
    throw new UnauthorizedException('Invalid refresh token');
  }
  
  // 5. Генерировать новые токены (Token Rotation)
  const newAccessToken = this.generateAccessToken(user);
  const newRefreshToken = this.generateRefreshToken(user);
  
  // 6. Хешировать и сохранить новый refresh token
  const refreshTokenHash = await argon2.hash(newRefreshToken);
  await this.userModel.findByIdAndUpdate(user.id, {
    refreshToken: refreshTokenHash,
    refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  
  // 7. Вернуть новые токены
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}
```

#### 4.3 Создать `logout()`:

```typescript
async logout(userId: string): Promise<void> {
  // Инвалидировать refresh token
  await this.userModel.findByIdAndUpdate(userId, {
    refreshToken: null,
    refreshTokenExpiresAt: null,
  });
}
```

#### 4.4 Вспомогательные методы:

```typescript
private generateAccessToken(user: User): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
    type: 'access',  // опционально
  };
  
  return this.jwtService.sign(payload, {
    secret: this.configService.jwtSecret,
    expiresIn: this.configService.jwtExpiresIn,
  });
}

private generateRefreshToken(user: User): string {
  const payload = {
    sub: user.id,
    type: 'refresh',  // опционально
  };
  
  return this.jwtService.sign(payload, {
    secret: this.configService.jwtRefreshSecret,
    expiresIn: this.configService.jwtRefreshExpiresIn,
  });
}
```

---

### 5. JWT Refresh Strategy

**Создать файл:** `src/auth/strategies/jwt-refresh.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.jwtRefreshSecret,
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }
    
    return { id: payload.sub };
  }
}
```

**Создать Guard:** `src/auth/guards/jwt-refresh.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
```

---

### 6. Auth Controller

**Добавить эндпоинты:**

```typescript
@Post('refresh')
@ApiOperation({ summary: 'Refresh access token' })
@ApiResponse({ status: 200, type: RefreshTokenResponseDto })
@ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
async refresh(
  @Body() refreshTokenDto: RefreshTokenDto
): Promise<RefreshTokenResponseDto> {
  return this.authService.refresh(refreshTokenDto);
}

@Post('logout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Logout (invalidate refresh token)' })
@ApiResponse({ status: 200, description: 'Logged out successfully' })
async logout(@Req() req: any): Promise<{ message: string }> {
  await this.authService.logout(req.user.id);
  return { message: 'Logged out successfully' };
}
```

---

### 7. Auth Module

**Обновить providers:**

```typescript
@Module({
  imports: [
    AppConfigModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: configService.jwtExpiresIn },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,  // Добавить!
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 🔒 Security Requirements

### 1. Token Rotation
- ✅ При каждом refresh генерировать НОВЫЙ refresh token
- ✅ Старый refresh token инвалидируется

### 2. Hashing
- ✅ Хранить в БД только ХЕШИРОВАННЫЙ refresh token (argon2)
- ✅ Никогда не хранить plain text токены

### 3. Expiration
- ✅ Access Token: 15 минут (короткий TTL)
- ✅ Refresh Token: 7 дней (конфигурируемый)
- ✅ Проверять `refreshTokenExpiresAt` в БД

### 4. Token Type Validation
- ✅ В payload добавлять `type: 'access' | 'refresh'`
- ✅ Валидировать тип токена в стратегиях

### 5. Single Device (Optional)
- ⚠️ Один refresh token на пользователя (текущая реализация)
- 🔄 Для multi-device нужна таблица `refresh_tokens` с device tracking

---

## 📊 Flow Диаграммы

### Login Flow:
```
1. Client → POST /auth/login { email, password }
2. Server → Validate credentials
3. Server → Generate Access Token (15min)
4. Server → Generate Refresh Token (7d)
5. Server → Hash Refresh Token (argon2)
6. Server → Save to DB { refreshToken, refreshTokenExpiresAt }
7. Server → Return { accessToken, refreshToken }
```

### Refresh Flow:
```
1. Client → POST /auth/refresh { refreshToken }
2. Server → Verify JWT signature
3. Server → Find user + select refreshToken
4. Server → Compare hashes (argon2.verify)
5. Server → Check expiration
6. Server → Generate NEW tokens
7. Server → Update DB with new hashed refresh token
8. Server → Return { accessToken, refreshToken }
```

### Logout Flow:
```
1. Client → POST /auth/logout (Bearer accessToken)
2. Server → Verify access token
3. Server → Clear refresh token in DB (set to null)
4. Server → Return { message: 'success' }
```

---

## 🧪 Testing Checklist

### Unit Tests (AuthService):
- [ ] `login()` generates both tokens
- [ ] `login()` hashes refresh token before saving
- [ ] `refresh()` validates refresh token correctly
- [ ] `refresh()` rotates tokens (old token becomes invalid)
- [ ] `refresh()` throws error for invalid token
- [ ] `refresh()` throws error for expired token
- [ ] `logout()` clears refresh token from DB

### E2E Tests:
- [ ] `POST /auth/login` returns both tokens
- [ ] `POST /auth/refresh` with valid token returns new tokens
- [ ] `POST /auth/refresh` with invalid token returns 401
- [ ] `POST /auth/refresh` with expired token returns 401
- [ ] `POST /auth/refresh` with old token (after rotation) returns 401
- [ ] `POST /auth/logout` invalidates refresh token
- [ ] `POST /auth/refresh` after logout returns 401

---

## ⚠️ Edge Cases

1. **Token Reuse Detection:**
   - Если старый refresh token используется после rotation → возможная атака
   - Решение: инвалидировать ВСЕ refresh tokens пользователя

2. **Concurrent Requests:**
   - Два одновременных refresh запроса
   - Решение: транзакции или optimistic locking

3. **Database Failure:**
   - Токен сгенерирован, но не сохранен в БД
   - Решение: транзакции или rollback логика

4. **Clock Skew:**
   - Время на сервере и в JWT может расходиться
   - Решение: добавить небольшой буфер (leeway)

---

## 📝 Swagger Documentation

### POST /auth/login
```yaml
responses:
  200:
    description: Successful login
    schema:
      type: object
      properties:
        accessToken:
          type: string
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        refreshToken:
          type: string
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### POST /auth/refresh
```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        properties:
          refreshToken:
            type: string
responses:
  200:
    description: Tokens refreshed successfully
    schema:
      type: object
      properties:
        accessToken:
          type: string
        refreshToken:
          type: string
  401:
    description: Invalid or expired refresh token
```

### POST /auth/logout
```yaml
security:
  - bearerAuth: []
responses:
  200:
    description: Logged out successfully
    schema:
      type: object
      properties:
        message:
          type: string
          example: "Logged out successfully"
```

---

## 🚀 Порядок Выполнения

### Шаг 1: Database & Schema (ОБЯЗАТЕЛЬНО ПЕРВЫМ)
1. Обновить `src/users/schemas/user.schema.ts`
2. Добавить поля `refreshToken`, `refreshTokenExpiresAt`
3. Добавить индекс

### Шаг 2: Configuration
1. Обновить `src/config/app-config.service.ts`
2. Добавить методы `jwtRefreshSecret`, `jwtRefreshExpiresIn`

### Шаг 3: DTOs
1. Обновить `src/auth/dto/auth.dto.ts`
2. Добавить `RefreshTokenDto`, `RefreshTokenResponseDto`
3. Обновить `LoginResponseDto`

### Шаг 4: Strategies & Guards
1. Создать `src/auth/strategies/jwt-refresh.strategy.ts`
2. Создать `src/auth/guards/jwt-refresh.guard.ts`

### Шаг 5: Auth Service
1. Обновить `login()` в `src/auth/auth.service.ts`
2. Добавить `refresh()`, `logout()`
3. Добавить вспомогательные методы

### Шаг 6: Auth Controller
1. Обновить `src/auth/auth.controller.ts`
2. Добавить эндпоинты `/refresh`, `/logout`

### Шаг 7: Auth Module
1. Обновить `src/auth/auth.module.ts`
2. Зарегистрировать `JwtRefreshStrategy`

### Шаг 8: Testing
1. Написать unit tests
2. Написать E2E tests
3. Проверить все edge cases

---

## ✅ Критерии Приемки

### Функциональность:
- ✅ `POST /auth/login` возвращает `{ accessToken, refreshToken }`
- ✅ `POST /auth/refresh` принимает `refreshToken`, возвращает новые токены
- ✅ `POST /auth/logout` инвалидирует refresh token
- ✅ Старый refresh token не работает после rotation
- ✅ Access token имеет короткий TTL (15 минут)
- ✅ Refresh token имеет длинный TTL (7 дней)

### Безопасность:
- ✅ Refresh token хешируется перед сохранением (argon2)
- ✅ Проверка истечения срока действия
- ✅ Валидация JWT подписи
- ✅ Token type validation (access vs refresh)
- ✅ Защита от token reuse

### Код:
- ✅ TypeScript типизация
- ✅ class-validator валидация
- ✅ Swagger документация
- ✅ Error handling
- ✅ Следование архитектуре проекта

### Тесты:
- ✅ Unit tests (coverage > 80%)
- ✅ E2E tests для всех эндпоинтов
- ✅ Edge cases покрыты

---

## 📚 Справочные Материалы

### Best Practices:
- [OWASP JWT Security](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Auth0 Refresh Token Guide](https://auth0.com/docs/secure/tokens/refresh-tokens)
- [RFC 6749 - OAuth 2.0](https://tools.ietf.org/html/rfc6749#section-1.5)

### NestJS Docs:
- [Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT](https://docs.nestjs.com/recipes/passport#jwt-functionality)

---

## 🎯 Итоговый Промпт для ИИ

```
Ты - Senior Backend разработчик на NestJS.

ЗАДАЧА: Внедрить Refresh Token механизм в существующую JWT аутентификацию.

КОНТЕКСТ:
- Проект: TodoBackend API (NestJS + TypeScript + MongoDB)
- Текущая аутентификация: JWT access token (БЕЗ refresh token)
- Архитектура: см. PROJECT_ARCHITECTURE.md

ТРЕБОВАНИЯ:
1. Обновить User Schema: добавить refreshToken, refreshTokenExpiresAt
2. Обновить login(): генерировать оба токена, хешировать refresh token (argon2)
3. Создать refresh(): валидация, token rotation, обновление в БД
4. Создать logout(): инвалидация refresh token
5. Добавить эндпоинты: POST /auth/refresh, POST /auth/logout
6. Создать JwtRefreshStrategy и JwtRefreshGuard
7. Обновить DTOs, конфигурацию, Swagger docs

SECURITY:
- Access Token TTL: 15 минут
- Refresh Token TTL: 7 дней
- Token Rotation: да (новый refresh при каждом обновлении)
- Hashing: argon2 для refresh tokens
- Token Type Validation: проверять type в payload

ПОРЯДОК:
1. Schema → 2. Config → 3. DTOs → 4. Strategies → 5. Service → 6. Controller → 7. Module → 8. Tests

КРИТЕРИИ ПРИЕМКИ:
- Все тесты проходят
- Swagger документация обновлена
- Следование существующей архитектуре
- Security best practices соблюдены

НАЧНИ С ШАГА 1: Обновить User Schema.
```

---

**Документ подготовлен:** Senior Архитектор  
**Дата:** February 7, 2026  
**Версия:** 1.0  
**Статус:** Ready for Implementation

