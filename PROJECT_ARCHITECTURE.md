# 📋 TodoBackend - Полная Архитектурная Документация

## 🎯 Общая Информация

**Проект:** MuzalovTodoApp Backend API  
**Стек:** NestJS + TypeScript + MongoDB (Mongoose) + JWT Authentication  
**Версия:** 1.0.0  
**Автор:** Muzalov  
**Дата анализа:** February 7, 2026

---

## 📦 Технологический Стек

### Core Dependencies
- **NestJS**: v10.0.0 (фреймворк)
- **TypeScript**: v5.1.0
- **Mongoose**: v7.0.0 (ODM для MongoDB)
- **Passport**: v0.6.0 + passport-jwt v4.0.1
- **@nestjs/jwt**: v10.0.0
- **argon2**: v0.30.0 (хеширование паролей)
- **class-validator**: v0.14.0
- **class-transformer**: v0.5.1
- **@nestjs/swagger**: v7.0.0 (документация API)
- **@nestjs/throttler**: v4.0.0 (rate limiting)

### Package Manager
- **pnpm**: v9.15.6

---

## 🏗️ Архитектура Проекта

### Структура модулей

```
TodoBackend/
├── src/
│   ├── app.module.ts                 # Корневой модуль приложения
│   ├── main.ts                       # Точка входа приложения
│   │
│   ├── auth/                         # ⚠️ КРИТИЧНЫЙ МОДУЛЬ ДЛЯ REFRESH TOKEN
│   │   ├── auth.module.ts           
│   │   ├── auth.service.ts          # Логика аутентификации (login, register, JWT)
│   │   ├── auth.controller.ts       # Эндпоинты: POST /register, POST /login, GET /profile
│   │   ├── dto/
│   │   │   └── auth.dto.ts          # CreateUserDto, LoginDto, LoginResponseDto
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts    # Guard для проверки JWT токенов
│   │   └── strategies/
│   │       └── jwt.strategy.ts      # Passport JWT стратегия
│   │
│   ├── users/                        # Управление пользователями
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── dto/
│   │   │   └── user.dto.ts
│   │   └── schemas/
│   │       └── user.schema.ts       # ⚠️ Mongoose схема User (добавить refreshToken)
│   │
│   ├── lists/                        # Управление списками задач
│   │   ├── lists.module.ts
│   │   ├── lists.service.ts
│   │   ├── lists.controller.ts
│   │   ├── dto/
│   │   │   └── list.dto.ts
│   │   └── schemas/
│   │       └── list.schema.ts       # Mongoose схема List
│   │
│   ├── tasks/                        # Управление задачами
│   │   ├── tasks.module.ts
│   │   ├── tasks.service.ts
│   │   ├── tasks.controller.ts
│   │   ├── dto/
│   │   │   └── task.dto.ts
│   │   └── schemas/
│   │       └── task.schema.ts       # Mongoose схема Task
│   │
│   ├── permissions/                  # Управление разрешениями
│   │   ├── permissions.module.ts
│   │   ├── permissions.service.ts
│   │   └── permissions.controller.ts
│   │
│   ├── analytics/                    # Аналитика
│   │   ├── analytics.module.ts
│   │   ├── analytics.service.ts
│   │   └── analytics.controller.ts
│   │
│   ├── health/                       # Health check эндпоинты
│   │   ├── health.module.ts
│   │   ├── health.service.ts
│   │   └── health.controller.ts
│   │
│   ├── config/                       # Конфигурация приложения
│   │   ├── app-config.module.ts
│   │   └── app-config.service.ts    # ⚠️ Централизованная конфигурация (ENV переменные)
│   │
│   ├── common/                       # Общие компоненты
│   │   ├── constants/
│   │   │   └── permissions.constants.ts
│   │   ├── decorators/
│   │   │   └── permissions.decorator.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   ├── guards/
│   │   │   ├── permissions.guard.ts # Guard для проверки разрешений
│   │   │   └── roles.guard.ts       # Guard для проверки ролей
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts
│   │   └── interceptors/
│   │
│   └── scripts/                      # Утилиты и миграции
│       ├── migrate-permissions.ts
│       └── seed.ts
│
├── api/                              # Vercel serverless
│   └── index.ts
│
├── postman/                          # Postman коллекция
│   └── todo-api.postman_collection.json
│
├── package.json
├── tsconfig.json
├── nest-cli.json
├── vercel.json
├── README.md
└── TESTING_WITHOUT_SWAGGER.md
```

---

## 🔐 Текущая Система Аутентификации

### 1. User Schema (`src/users/schemas/user.schema.ts`)

```typescript
@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: false, trim: true })
  name?: string;

  @Prop({ required: true, select: false })  // ⚠️ НЕ возвращается по умолчанию
  passwordHash: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  // ⚠️ ОТСУТСТВУЕТ: refreshToken, refreshTokenExpiresAt
  
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
```

**Что нужно добавить для Refresh Token:**
- `refreshToken?: string` (хешированный, select: false)
- `refreshTokenExpiresAt?: Date`

---

### 2. Auth Service (`src/auth/auth.service.ts`)

#### Метод `login()` - Текущая реализация:

```typescript
async login(loginDto: LoginDto): Promise<LoginResponseDto> {
  const { email, password } = loginDto;

  // 1. Ищем пользователя
  const user = await this.userModel.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new UnauthorizedException('Invalid email or password');
  }

  // 2. Проверяем пароль (argon2)
  const isPasswordValid = await argon2.verify(user.passwordHash, password);
  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid email or password');
  }

  // 3. Генерируем только ACCESS TOKEN
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
  };

  const tokenOptions: any = {};
  const expiresIn = this.configService.jwtExpiresIn;
  if (expiresIn) {
    tokenOptions.expiresIn = expiresIn;
  }

  const accessToken = this.jwtService.sign(payload, tokenOptions);

  // ⚠️ ПРОБЛЕМА: Возвращается только accessToken
  return { accessToken };
}
```

**Что нужно изменить:**
- Генерировать `refreshToken` с долгим сроком жизни (7-30 дней)
- Хешировать и сохранять `refreshToken` в БД
- Возвращать оба токена: `{ accessToken, refreshToken }`

#### Метод `register()` - Текущая реализация:

```typescript
async register(createUserDto: CreateUserDto): Promise<User> {
  const { email, password, name } = createUserDto;

  // Проверка на дубликат email
  const existingUser = await this.userModel.findOne({ email });
  if (existingUser) {
    throw new ConflictException('User with this email already exists');
  }

  // Хеширование пароля (argon2)
  const passwordHash = await argon2.hash(password);

  // Создание пользователя
  const user = new this.userModel({
    email,
    passwordHash,
    name,
    role: UserRole.USER,
    permissions: ROLE_PERMISSIONS.USER,
  });

  return user.save();
}
```

**Рекомендация:** Регистрация может оставаться без изменений (токены генерируются при login).

---

### 3. Auth Controller (`src/auth/auth.controller.ts`)

#### Текущие эндпоинты:

```typescript
@Controller('auth')
export class AuthController {
  
  @Post('register')  // POST /api/auth/register
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.authService.register(createUserDto);
  }

  @Post('login')  // POST /api/auth/login
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')  // GET /api/auth/profile
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(@Req() req: any): Promise<User> {
    return this.authService.getProfile(req.user.id);
  }
}
```

**Что нужно добавить:**
- `POST /api/auth/refresh` - обновление токенов по refresh token
- `POST /api/auth/logout` - инвалидация refresh token

---

### 4. JWT Strategy (`src/auth/strategies/jwt.strategy.ts`)

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
    };
  }
}

export interface JwtPayload {
  sub: string;  // User ID
  email: string;
  role: string;
  permissions?: string[];
}
```

**Что нужно добавить:**
- Новая стратегия `JwtRefreshStrategy` для валидации refresh токенов
- Возможно, добавить `tokenType: 'access' | 'refresh'` в payload

---

### 5. Auth Module (`src/auth/auth.module.ts`)

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
        // Время жизни устанавливается динамически в сервисе
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**Что нужно добавить:**
- Зарегистрировать `JwtRefreshStrategy` в providers
- Возможно, настроить отдельный JWT модуль для refresh токенов

---

### 6. Config Service (`src/config/app-config.service.ts`)

```typescript
@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get mongodbUri(): string {
    return this.configService.get<string>('MONGODB_URI');
  }

  get dbName(): string {
    return this.configService.get<string>('DB_NAME', 'todoapp');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'change-me');
  }

  get jwtExpiresIn(): string | undefined {
    const expires = this.configService.get<string>('JWT_EXPIRES_IN', '0');
    return expires === '0' ? undefined : expires;
  }

  // ⚠️ ОТСУТСТВУЮТ настройки для refresh token

  get corsOrigins(): string | string[] {
    const origins = this.configService.get<string>('CORS_ORIGINS', '*');
    return origins === '*' ? '*' : origins.split(',').map(o => o.trim());
  }

  get rateLimitTtl(): number {
    return this.configService.get<number>('RATE_LIMIT_TTL', 900);
  }

  get rateLimitLimit(): number {
    return this.configService.get<number>('RATE_LIMIT_LIMIT', 100);
  }
}
```

**Что нужно добавить:**

```typescript
// Refresh Token настройки
get jwtRefreshSecret(): string {
  return this.configService.get<string>('JWT_REFRESH_SECRET', 'change-me-refresh');
}

get jwtRefreshExpiresIn(): string {
  return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
}
```

---

### 7. Auth DTOs (`src/auth/dto/auth.dto.ts`)

```typescript
// DTO для регистрации
export class CreateUserDto {
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}

// DTO для входа
export class LoginDto {
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsString()
  password: string;
}

// DTO для ответа при логине
export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;
  
  // ⚠️ ОТСУТСТВУЕТ: refreshToken
}
```

**Что нужно добавить:**

```typescript
// Обновить LoginResponseDto
export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

// Новый DTO для refresh
export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

// Новый DTO для ответа refresh
export class RefreshTokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
```

---

## 🔒 Система Guards и Middleware

### Текущие Guards:

1. **JwtAuthGuard** (`src/auth/guards/jwt-auth.guard.ts`)
   - Проверяет Access Token в заголовке `Authorization: Bearer <token>`
   - Использует JwtStrategy

2. **PermissionsGuard** (`src/common/guards/permissions.guard.ts`)
   - Проверяет разрешения пользователя
   - Админы имеют доступ ко всему

3. **RolesGuard** (`src/common/guards/roles.guard.ts`)
   - Проверяет роли пользователя (USER, ADMIN)

4. **ThrottlerGuard** (глобальный, в `app.module.ts`)
   - Rate limiting (защита от спама)

**Что нужно добавить:**
- `JwtRefreshGuard` для защиты эндпоинта `/auth/refresh`

---

## 📊 База Данных (MongoDB)

### Текущие коллекции:

1. **users** (схема User)
   - Поля: email, name, passwordHash, role, permissions, createdAt, updatedAt
   - Индексы: email (unique)

2. **lists** (схема List)
   - Поля: title, ownerId, deadline, hexColor, createdAt, updatedAt
   - Индексы: ownerId, createdAt

3. **tasks** (схема Task)
   - Поля: listId, title, description, longDescription, status, priority, order, tags, dueDate, deadline, isStarred, isWeeklyGoal, completedAt, deletedAt, createdAt, updatedAt
   - Индексы: listId, status, priority, tags, isStarred, isWeeklyGoal

### Изменения для Refresh Token:

**Обновление коллекции `users`:**

```typescript
// Добавить в User Schema
@Prop({ required: false, select: false })
refreshToken?: string;  // Хешированный refresh token

@Prop({ required: false })
refreshTokenExpiresAt?: Date;  // Дата истечения refresh token
```

---

## 🌐 API Эндпоинты

### Текущие эндпоинты (Authentication):

| Метод | Путь | Описание | Guard |
|-------|------|----------|-------|
| POST | `/api/auth/register` | Регистрация пользователя | - |
| POST | `/api/auth/login` | Вход в систему | - |
| GET | `/api/auth/profile` | Получение профиля | JwtAuthGuard |

### Новые эндпоинты (для Refresh Token):

| Метод | Путь | Описание | Guard |
|-------|------|----------|-------|
| POST | `/api/auth/refresh` | Обновление токенов | JwtRefreshGuard |
| POST | `/api/auth/logout` | Выход (инвалидация refresh token) | JwtAuthGuard |

---

## 🔄 Предлагаемый Flow для Refresh Token

### 1. Login Flow (обновленный):

```
Client                    Server                    Database
  |                         |                           |
  |-- POST /auth/login ---->|                           |
  |   (email, password)     |                           |
  |                         |-- Find user by email ---->|
  |                         |<---- User data ------------|
  |                         |                           |
  |                         |-- Verify password (argon2)|
  |                         |                           |
  |                         |-- Generate Access Token --|
  |                         |   (exp: 15min)            |
  |                         |                           |
  |                         |-- Generate Refresh Token -|
  |                         |   (exp: 7 days)           |
  |                         |                           |
  |                         |-- Hash refresh token -----|
  |                         |   (argon2)                |
  |                         |                           |
  |                         |-- Save hashed refresh --->|
  |                         |   token to DB             |
  |                         |<---- Success --------------|
  |                         |                           |
  |<-- { accessToken, ------|                           |
  |     refreshToken }      |                           |
```

### 2. Refresh Token Flow:

```
Client                    Server                    Database
  |                         |                           |
  |-- POST /auth/refresh -->|                           |
  |   (refreshToken)        |                           |
  |                         |                           |
  |                         |-- Verify refresh token ---|
  |                         |   signature (JWT)         |
  |                         |                           |
  |                         |-- Extract user ID --------|
  |                         |                           |
  |                         |-- Find user ------------->|
  |                         |<---- User with hashed -----|
  |                         |     refreshToken          |
  |                         |                           |
  |                         |-- Compare tokens (argon2)-|
  |                         |                           |
  |                         |-- Check expiration -------|
  |                         |                           |
  |                         |-- Generate new Access ----|
  |                         |   Token (exp: 15min)      |
  |                         |                           |
  |                         |-- Generate new Refresh ---|
  |                         |   Token (exp: 7 days)     |
  |                         |                           |
  |                         |-- Hash new refresh -------|
  |                         |   token (argon2)          |
  |                         |                           |
  |                         |-- Update in DB ---------->|
  |                         |<---- Success --------------|
  |                         |                           |
  |<-- { accessToken, ------|                           |
  |     refreshToken }      |                           |
```

### 3. Logout Flow:

```
Client                    Server                    Database
  |                         |                           |
  |-- POST /auth/logout --->|                           |
  |   (Authorization header)|                           |
  |                         |                           |
  |                         |-- Verify access token ----|
  |                         |                           |
  |                         |-- Extract user ID --------|
  |                         |                           |
  |                         |-- Clear refresh token --->|
  |                         |   (set to null)           |
  |                         |<---- Success --------------|
  |                         |                           |
  |<-- { message: 'OK' } ---|                           |
```

---

## 🎯 Рекомендации Senior Архитектора

### 1. Security Best Practices:

- ✅ **Access Token TTL:** 15 минут (короткий срок)
- ✅ **Refresh Token TTL:** 7-30 дней (конфигурируемый)
- ✅ **Hash Refresh Tokens:** Использовать argon2 (как для паролей)
- ✅ **HttpOnly Cookies:** Рассмотреть хранение refresh token в httpOnly cookie
- ✅ **Token Rotation:** Генерировать новый refresh token при каждом обновлении
- ✅ **Single Use:** Старый refresh token инвалидируется после использования

### 2. Database Optimization:

- Добавить индекс на `refreshTokenExpiresAt` для очистки истекших токенов
- Создать cron job для удаления устаревших refresh tokens

### 3. Error Handling:

- `InvalidRefreshTokenException` (401)
- `RefreshTokenExpiredException` (401)
- `RefreshTokenReusedException` (401) - детекция взлома

### 4. Monitoring & Logging:

- Логировать все refresh token операции
- Алерты на подозрительную активность (множественные refresh с одного токена)

### 5. Alternative Approaches:

**Вариант A: Cookie-based (рекомендуется для web)**
```typescript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
});
```

**Вариант B: Token in Body (текущий, универсальный для mobile/web)**
```typescript
return { accessToken, refreshToken };
```

---

## 📝 Environment Variables (обновленные)

Текущие:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017
DB_NAME=todoapp
JWT_SECRET=change-me
JWT_EXPIRES_IN=15m  # Access token
CORS_ORIGINS=*
RATE_LIMIT_TTL=900
RATE_LIMIT_LIMIT=100
```

**Добавить:**
```env
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d  # Refresh token (7 дней)
```

---

## 🚀 План Внедрения (High-Level)

### Phase 1: Database & Schema
1. Обновить User Schema (добавить refreshToken, refreshTokenExpiresAt)
2. Создать миграцию (если нужно)
3. Добавить индексы

### Phase 2: Configuration
1. Обновить AppConfigService (добавить методы для refresh token)
2. Добавить новые ENV переменные
3. Обновить документацию

### Phase 3: DTOs & Interfaces
1. Создать RefreshTokenDto, RefreshTokenResponseDto
2. Обновить LoginResponseDto (добавить refreshToken)
3. Обновить JwtPayload (опционально добавить tokenType)

### Phase 4: Auth Service Logic
1. Обновить метод login() - генерация и сохранение refresh token
2. Создать метод refresh() - валидация и обновление токенов
3. Создать метод logout() - инвалидация refresh token
4. Создать вспомогательные методы (hashRefreshToken, compareRefreshToken)

### Phase 5: JWT Strategy
1. Создать JwtRefreshStrategy
2. Создать JwtRefreshGuard
3. Зарегистрировать в AuthModule

### Phase 6: Controller Endpoints
1. Добавить POST /auth/refresh
2. Добавить POST /auth/logout
3. Обновить Swagger документацию

### Phase 7: Testing & Security
1. Unit tests для AuthService
2. E2E tests для эндпоинтов
3. Security audit
4. Load testing

### Phase 8: Monitoring & Cleanup
1. Добавить логирование
2. Создать cron job для очистки устаревших токенов
3. Настроить алерты

---

## 📊 Метрики и KPI

### Текущее состояние:
- ❌ Refresh Token: НЕ реализован
- ✅ Access Token: Реализован (JWT)
- ✅ Password Hashing: argon2
- ✅ Role-Based Access Control (RBAC): Реализован
- ✅ Permission-Based Access Control: Реализован
- ✅ Rate Limiting: Реализован

### После внедрения Refresh Token:
- ✅ Improved UX (автоматическое обновление токенов)
- ✅ Better Security (короткий TTL для access token)
- ✅ Token Revocation (logout инвалидирует refresh token)
- ✅ Scalable Architecture

---

## 🔗 Связанные Файлы (для изменения)

### Критичные:
1. `src/users/schemas/user.schema.ts` - добавить поля
2. `src/auth/auth.service.ts` - основная логика
3. `src/auth/auth.controller.ts` - новые эндпоинты
4. `src/auth/dto/auth.dto.ts` - новые DTOs
5. `src/config/app-config.service.ts` - конфигурация

### Новые файлы:
1. `src/auth/strategies/jwt-refresh.strategy.ts`
2. `src/auth/guards/jwt-refresh.guard.ts`

### Обновить:
1. `src/auth/auth.module.ts` - регистрация новых провайдеров
2. `README.md` - обновить документацию API

---

## 🎨 Swagger Documentation Schema

### Обновленная схема для `/auth/login`:

```json
{
  "responses": {
    "200": {
      "description": "Successful login",
      "schema": {
        "type": "object",
        "properties": {
          "accessToken": {
            "type": "string",
            "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          },
          "refreshToken": {
            "type": "string",
            "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          }
        }
      }
    }
  }
}
```

### Новый эндпоинт `/auth/refresh`:

```json
{
  "summary": "Refresh access token",
  "requestBody": {
    "required": true,
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "properties": {
            "refreshToken": {
              "type": "string",
              "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
          }
        }
      }
    }
  },
  "responses": {
    "200": {
      "description": "Tokens refreshed successfully",
      "schema": {
        "type": "object",
        "properties": {
          "accessToken": { "type": "string" },
          "refreshToken": { "type": "string" }
        }
      }
    },
    "401": {
      "description": "Invalid or expired refresh token"
    }
  }
}
```

---

## ⚠️ Потенциальные Проблемы и Риски

### 1. Breaking Changes:
- ❗ Frontend должен обновить логику авторизации
- ❗ Старые клиенты могут не работать (нужна версионность API)

### 2. Database Migration:
- ⚠️ Существующие пользователи: refreshToken будет null (норма)
- ⚠️ Индексы: добавить без downtime

### 3. Performance:
- 🔍 Дополнительные запросы в БД при refresh
- 🔍 Хеширование refresh token (argon2 медленный, но безопасный)

### 4. Security:
- 🛡️ XSS атаки (если токен в localStorage)
- 🛡️ CSRF атаки (если токен в cookie)
- 🛡️ Token leakage (логирование, мониторинг)

---

## 📖 Дополнительные Ресурсы

### Документация:
- [NestJS JWT](https://docs.nestjs.com/security/authentication)
- [Passport JWT](http://www.passportjs.org/packages/passport-jwt/)
- [RFC 6749 - OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [OWASP JWT Security](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

### Best Practices:
- [Auth0 Refresh Token Guide](https://auth0.com/docs/secure/tokens/refresh-tokens)
- [JWT Handbook](https://auth0.com/resources/ebooks/jwt-handbook)

---

## 📌 Выводы

**Текущее состояние:**
- ✅ Solid foundation (NestJS + Mongoose + JWT)
- ✅ Good architecture (модульная структура)
- ✅ Security basics (argon2, guards, rate limiting)
- ❌ Missing refresh token mechanism

**Рекомендации:**
1. **Приоритет 1:** Внедрить refresh token (улучшит UX и безопасность)
2. **Приоритет 2:** Добавить cron job для очистки устаревших токенов
3. **Приоритет 3:** Рассмотреть httpOnly cookies для web клиентов
4. **Приоритет 4:** Добавить мониторинг и алерты на подозрительную активность

**Сложность внедрения:** СРЕДНЯЯ  
**Время на реализацию:** 2-3 дня (с тестами)  
**Риски:** НИЗКИЕ (при правильной реализации)

---

**Подготовлено:** Senior Архитектор  
**Дата:** February 7, 2026  
**Версия документа:** 1.0

