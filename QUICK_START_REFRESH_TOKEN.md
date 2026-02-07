# 🚀 Quick Start: Refresh Token Implementation

## 📋 Краткая Сводка (TL;DR)

**Цель:** Добавить Refresh Token механизм в существующую JWT аутентификацию

**Изменения:**
- ✅ 2 новых поля в User Schema
- ✅ 2 новых ENV переменных
- ✅ 3 новых DTO класса
- ✅ 2 новых файла (JwtRefreshStrategy, JwtRefreshGuard)
- ✅ 2 новых эндпоинта (POST /auth/refresh, POST /auth/logout)
- ✅ Обновление login() метода

**Время:** 2-3 часа работы + 1-2 часа тестирования

---

## 📂 Файлы для Изменения/Создания

### ✏️ ИЗМЕНИТЬ (6 файлов):

1. **`src/users/schemas/user.schema.ts`**
   - Добавить: `refreshToken?: string` (select: false)
   - Добавить: `refreshTokenExpiresAt?: Date`
   - Добавить индекс

2. **`src/config/app-config.service.ts`**
   - Добавить: `jwtRefreshSecret` getter
   - Добавить: `jwtRefreshExpiresIn` getter

3. **`src/auth/dto/auth.dto.ts`**
   - Обновить: `LoginResponseDto` (добавить refreshToken)
   - Создать: `RefreshTokenDto`
   - Создать: `RefreshTokenResponseDto`

4. **`src/auth/auth.service.ts`**
   - Обновить: `login()` - генерация 2 токенов
   - Создать: `refresh()` - обновление токенов
   - Создать: `logout()` - инвалидация
   - Создать: `generateAccessToken()`
   - Создать: `generateRefreshToken()`

5. **`src/auth/auth.controller.ts`**
   - Создать: `POST /auth/refresh` endpoint
   - Создать: `POST /auth/logout` endpoint

6. **`src/auth/auth.module.ts`**
   - Добавить: `JwtRefreshStrategy` в providers

---

### ➕ СОЗДАТЬ (2 файла):

7. **`src/auth/strategies/jwt-refresh.strategy.ts`** (НОВЫЙ)
   - Passport стратегия для валидации refresh токенов

8. **`src/auth/guards/jwt-refresh.guard.ts`** (НОВЫЙ)
   - Guard для защиты refresh endpoint

---

## 🔧 ENV Переменные

Добавить в `.env`:
```env
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-me
JWT_REFRESH_EXPIRES_IN=7d
```

---

## 📝 Чеклист Выполнения

### Phase 1: Schema & Config
- [ ] 1.1. Обновить User Schema (2 поля + индекс)
- [ ] 1.2. Обновить AppConfigService (2 метода)
- [ ] 1.3. Добавить ENV переменные

### Phase 2: DTOs
- [ ] 2.1. Обновить LoginResponseDto
- [ ] 2.2. Создать RefreshTokenDto
- [ ] 2.3. Создать RefreshTokenResponseDto

### Phase 3: Strategies & Guards
- [ ] 3.1. Создать JwtRefreshStrategy
- [ ] 3.2. Создать JwtRefreshGuard
- [ ] 3.3. Зарегистрировать в AuthModule

### Phase 4: Service Logic
- [ ] 4.1. Создать generateAccessToken()
- [ ] 4.2. Создать generateRefreshToken()
- [ ] 4.3. Обновить login() - генерация 2 токенов
- [ ] 4.4. Создать refresh() - валидация и rotation
- [ ] 4.5. Создать logout() - инвалидация

### Phase 5: Controller
- [ ] 5.1. Добавить POST /auth/refresh
- [ ] 5.2. Добавить POST /auth/logout
- [ ] 5.3. Обновить Swagger docs

### Phase 6: Testing
- [ ] 6.1. Unit tests для AuthService
- [ ] 6.2. E2E тест: login возвращает 2 токена
- [ ] 6.3. E2E тест: refresh работает корректно
- [ ] 6.4. E2E тест: logout инвалидирует токен
- [ ] 6.5. E2E тест: старый refresh token не работает

---

## 🧪 Быстрая Проверка

### 1. Login (должен вернуть 2 токена):
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Ожидаемый ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Refresh (обновить токены):
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Ожидаемый ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Logout (инвалидировать):
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```

**Ожидаемый ответ:**
```json
{
  "message": "Logged out successfully"
}
```

### 4. Проверка инвалидации (должен вернуть 401):
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<старый_refresh_token>"
  }'
```

**Ожидаемый ответ:**
```json
{
  "statusCode": 401,
  "message": "Invalid refresh token"
}
```

---

## 🔑 Ключевые Концепции

### Token Rotation (Обязательно!)
```typescript
// При каждом refresh:
// 1. Валидировать старый refresh token
// 2. Генерировать НОВЫЙ access token
// 3. Генерировать НОВЫЙ refresh token
// 4. Инвалидировать СТАРЫЙ refresh token
// 5. Сохранить новый refresh token в БД
```

### Hashing (Обязательно!)
```typescript
// НИКОГДА не храним plain text refresh token в БД!
const refreshTokenHash = await argon2.hash(refreshToken);

// Сравнение:
const isValid = await argon2.verify(storedHash, providedToken);
```

### TTL Settings
```typescript
// Short-lived Access Token (защита при утечке)
JWT_EXPIRES_IN=15m

// Long-lived Refresh Token (удобство для пользователя)
JWT_REFRESH_EXPIRES_IN=7d
```

---

## ⚠️ Частые Ошибки

### ❌ НЕ ДЕЛАЙ ТАК:

1. **Хранить plain text refresh token в БД**
   ```typescript
   // ❌ ПЛОХО
   user.refreshToken = refreshToken;
   
   // ✅ ХОРОШО
   user.refreshToken = await argon2.hash(refreshToken);
   ```

2. **Не обновлять refresh token при refresh**
   ```typescript
   // ❌ ПЛОХО: возвращаем тот же refresh token
   return { accessToken: newAccessToken, refreshToken: oldRefreshToken };
   
   // ✅ ХОРОШО: генерируем новый refresh token
   const newRefreshToken = this.generateRefreshToken(user);
   ```

3. **Использовать один секрет для обоих токенов**
   ```typescript
   // ❌ ПЛОХО
   secret: JWT_SECRET
   
   // ✅ ХОРОШО: разные секреты
   accessToken: JWT_SECRET
   refreshToken: JWT_REFRESH_SECRET
   ```

4. **Не проверять expiration в БД**
   ```typescript
   // ✅ ХОРОШО: двойная проверка
   if (user.refreshTokenExpiresAt < new Date()) {
     throw new UnauthorizedException('Refresh token expired');
   }
   ```

---

## 📊 Архитектурная Схема

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  - Stores: accessToken, refreshToken (localStorage/cookie)  │
└─────────────┬───────────────────────────────┬───────────────┘
              │                               │
              │ 1. POST /auth/login           │ 2. Access API
              │    (email, password)          │    (Bearer accessToken)
              ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVER                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AuthController                                      │   │
│  │  - login()    → Generate 2 tokens                    │   │
│  │  - refresh()  → Rotate tokens                        │   │
│  │  - logout()   → Invalidate refresh token             │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                            │
│  ┌──────────────▼──────────────────────────────────────┐   │
│  │  AuthService                                         │   │
│  │  - generateAccessToken()  (15min)                    │   │
│  │  - generateRefreshToken() (7days)                    │   │
│  │  - Hashing: argon2                                   │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                            │
│  ┌──────────────▼──────────────────────────────────────┐   │
│  │  Guards & Strategies                                 │   │
│  │  - JwtAuthGuard      (validates access token)        │   │
│  │  - JwtRefreshGuard   (validates refresh token)       │   │
│  └──────────────┬──────────────────────────────────────┘   │
└─────────────────┼──────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE (MongoDB)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  users Collection                                    │   │
│  │  - email                                             │   │
│  │  - passwordHash                                      │   │
│  │  - refreshToken (HASHED!)                            │   │
│  │  - refreshTokenExpiresAt                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Успешная Реализация = Выполнены Все Критерии

### Функциональность:
- ✅ Login возвращает `{ accessToken, refreshToken }`
- ✅ Refresh принимает `refreshToken`, возвращает новую пару
- ✅ Logout инвалидирует refresh token в БД
- ✅ Старый refresh token не работает после refresh (rotation)

### Безопасность:
- ✅ Refresh token хешируется в БД (argon2)
- ✅ Access token TTL = 15 минут
- ✅ Refresh token TTL = 7 дней
- ✅ Разные секреты для access и refresh токенов

### Качество:
- ✅ TypeScript типизация без any
- ✅ class-validator валидация во всех DTOs
- ✅ Swagger документация обновлена
- ✅ Error handling с правильными статус кодами
- ✅ Тесты написаны и проходят

---

## 📚 Полезные Ссылки

**Детальная документация:**
- `PROJECT_ARCHITECTURE.md` - полная структура проекта
- `REFRESH_TOKEN_IMPLEMENTATION_PROMPT.md` - детальный промпт с примерами кода

**NestJS Docs:**
- https://docs.nestjs.com/security/authentication
- https://docs.nestjs.com/recipes/passport

**Security:**
- https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html

---

## 💬 Промпт для AI (копируй целиком)

```
Внедри Refresh Token функционал в TodoBackend API (NestJS + TypeScript + MongoDB).

КОНТЕКСТ:
- Текущая аутентификация: только JWT access token
- Нужно: добавить refresh token с rotation и logout

ТРЕБОВАНИЯ:
1. User Schema: добавь refreshToken (hashed, select: false) и refreshTokenExpiresAt
2. Config: добавь JWT_REFRESH_SECRET и JWT_REFRESH_EXPIRES_IN
3. DTOs: обнови LoginResponseDto, создай RefreshTokenDto и RefreshTokenResponseDto
4. Создай JwtRefreshStrategy и JwtRefreshGuard
5. AuthService: обнови login() (генерация 2 токенов), создай refresh() (с rotation) и logout()
6. AuthController: добавь POST /auth/refresh и POST /auth/logout
7. AuthModule: зарегистрируй JwtRefreshStrategy

SECURITY:
- Access Token: 15min TTL
- Refresh Token: 7d TTL
- Hash refresh tokens (argon2)
- Token rotation (новый refresh при каждом обновлении)

ДЕТАЛИ: см. REFRESH_TOKEN_IMPLEMENTATION_PROMPT.md

Начни с обновления User Schema.
```

---

**Удачи в реализации! 🚀**

*P.S. Если что-то непонятно - читай REFRESH_TOKEN_IMPLEMENTATION_PROMPT.md (там все с примерами кода).*

