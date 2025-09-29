# MuzalovTodoApp - Backend API

Полноценный Todo Backend API, построенный на **NestJS + TypeScript + Mongoose** для обучения фронтенд-разработчиков.

## 🚀 Особенности

- **JWT аутентификация** без истечения токенов (для учебных целей)
- **Роли пользователей** - `user` и `admin` с разными правами доступа
- **CRUD операции** для списков задач и самих задач
- **Мощная фильтрация** задач по статусу, тегам, датам, поиску по тексту
- **Пагинация и сортировка** для всех списков данных
- **Swagger документация** доступна на `/docs`
- **Rate Limiting** защита от спама запросов
- **Готовые тестовые данные** через команду `npm run seed`
- **Postman коллекция** для быстрого тестирования API

## 📋 Требования

- **Node.js** v18+ (LTS рекомендуется)
- **MongoDB Atlas** аккаунт (бесплатный)
- **npm** или **yarn**

## ⚡ Быстрый старт

### 1. Клонирование и установка

```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd TodoBackend

# Установите зависимости
npm install
```

### 2. Настройка окружения

Скопируйте `.env.example` в `.env` и заполните переменные:

```bash
cp .env.example .env
```

Отредактируйте `.env` файл:

```env
# Server Configuration
PORT=3000

# Database Configuration - ОБЯЗАТЕЛЬНО ЗАПОЛНИТЬ!
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/
DB_NAME=todoapp

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=0

# CORS Configuration
CORS_ORIGINS=*

# Rate Limiting Configuration
RATE_LIMIT_TTL=900
RATE_LIMIT_LIMIT=100
```

### 3. Создание MongoDB Atlas базы

1. Зарегистрируйтесь на [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Создайте бесплатный кластер
3. Создайте пользователя базы данных
4. Получите connection string и вставьте в `MONGODB_URI`

### 4. Запуск приложения

```bash
# Разработческий режим с hot-reload
npm run start:dev

# Заполнение базы тестовыми данными (опционально)
npm run seed

# Обычный запуск
npm start

# Продакшн сборка
npm run build
npm run start:prod
```

Приложение будет доступно на:
- **API**: http://localhost:3000
- **Swagger документация**: http://localhost:3000/docs

## 🔐 Тестовые пользователи (после seed)

После выполнения `npm run seed` будут созданы:

| Email | Пароль | Роль | Описание |
|-------|--------|------|----------|
| `admin@example.com` | `Passw0rd!` | admin | Может управлять всеми пользователями и их данными |
| `user@example.com` | `Passw0rd!` | user | Обычный пользователь с тестовыми списками и задачами |

## 📖 Как использовать API

### Пошаговый гайд для фронтенд-разработчика

1. **Регистрация нового пользователя**
   ```bash
   POST /auth/register
   {
     "email": "test@example.com",
     "password": "MySecretPassword",
     "name": "Test User"
   }
   ```

2. **Авторизация**
   ```bash
   POST /auth/login
   {
     "email": "test@example.com", 
     "password": "MySecretPassword"
   }
   # Получите accessToken и используйте в заголовке: Authorization: Bearer <token>
   ```

3. **Создание списка задач**
   ```bash
   POST /lists
   Authorization: Bearer <your-token>
   {
     "title": "Мой рабочий список"
   }
   ```

4. **Добавление задач в список**
   ```bash
   POST /lists/{listId}/tasks
   Authorization: Bearer <your-token>
   {
     "title": "Написать код",
     "description": "Реализовать компонент",
     "priority": "high",
     "tags": ["frontend", "react"],
     "dueDate": "2024-01-15T10:00:00.000Z"
   }
   ```

5. **Фильтрация задач**
   ```bash
   GET /lists/{listId}/tasks?status=todo&tag=frontend&q=код&sort=priority&order=desc
   ```

6. **Изменение статуса задачи**
   ```bash
   PATCH /tasks/{taskId}
   {
     "status": "done"
   }
   # или быстро завершить:
   PATCH /tasks/{taskId}/complete
   ```

## 🗃️ Структура данных

### Модель пользователя (User)
```typescript
{
  id: string
  email: string           // уникальный
  name?: string
  role: 'user' | 'admin'  // роль пользователя
  createdAt: Date
  updatedAt: Date
}
```

### Модель списка (List)
```typescript
{
  id: string
  title: string           // название списка
  ownerId: string         // ID владельца
  createdAt: Date
  updatedAt: Date
}
```

### Модель задачи (Task)
```typescript
{
  id: string
  listId: string                                    // ID списка
  title: string                                     // название
  description?: string                              // короткое описание
  longDescription?: string                          // детальное описание
  status: 'todo' | 'in_progress' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high'
  order?: number                                    // порядок (для drag&drop)
  tags?: string[]                                   // теги
  dueDate?: Date                                    // срок выполнения
  completedAt?: Date                                // время завершения
  deletedAt?: Date                                  // мягкое удаление
  createdAt: Date
  updatedAt: Date
}
```

## 🔒 Права доступа

### Обычный пользователь (`user`)
- ✅ Регистрация, авторизация
- ✅ Управление своим профилем
- ✅ CRUD своих списков и задач
- ❌ Доступ к чужим данным
- ❌ Административные функции

### Администратор (`admin`)
- ✅ Все возможности обычного пользователя
- ✅ Просмотр всех пользователей
- ✅ Изменение ролей пользователей
- ✅ Удаление пользователей
- ✅ Доступ ко всем спискам и задачам

## 📊 API Endpoints

### Аутентификация
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `GET /auth/profile` - Профиль текущего пользователя

### Профиль
- `GET /me` - Мой профиль
- `PATCH /me` - Обновить профиль

### Списки задач
- `POST /lists` - Создать список
- `GET /lists` - Мои списки (с пагинацией)
- `GET /lists/:id` - Конкретный список
- `PATCH /lists/:id` - Обновить список
- `DELETE /lists/:id` - Удалить список

### Задачи
- `POST /lists/:listId/tasks` - Создать задачу
- `GET /lists/:listId/tasks` - Задачи в списке (с фильтрами)
- `GET /tasks/:taskId` - Конкретная задача
- `PATCH /tasks/:taskId` - Обновить задачу
- `PATCH /tasks/:taskId/complete` - Завершить задачу
- `DELETE /tasks/:taskId` - Удалить задачу (мягко)

### Администрирование (только admin)
- `GET /users` - Все пользователи
- `GET /users/:id` - Пользователь по ID
- `PATCH /users/:id/role` - Изменить роль
- `DELETE /users/:id` - Удалить пользователя

### Системные
- `GET /health` - Проверка работоспособности

## 🎯 Фильтры и параметры

### Пагинация (для всех списков)
- `limit` - количество записей (1-100, по умолчанию 20)
- `offset` - смещение (по умолчанию 0)
- `sort` - поле сортировки (`createdAt`, `updatedAt`)
- `order` - порядок (`asc`, `desc`, по умолчанию `desc`)

### Фильтры задач
- `status` - статус (`todo`, `in_progress`, `done`, `archived`)
- `tag` - фильтр по тегу
- `priority` - приоритет (`low`, `medium`, `high`)
- `dueFrom` - срок выполнения от (ISO дата)
- `dueTo` - срок выполнения до (ISO дата)
- `q` - поиск по тексту (title, description, longDescription)

### Сортировка задач
- `createdAt` - по дате создания
- `dueDate` - по сроку выполнения
- `priority` - по приоритету (high → medium → low)
- `order` - по порядковому номеру

## 🔧 Как это устроено (для новичков)

### Архитектура приложения
```
src/
├── auth/           # Аутентификация (JWT, пароли)
├── users/          # Управление пользователями
├── lists/          # Списки задач
├── tasks/          # Задачи
├── health/         # Проверка состояния
├── common/         # Общие компоненты (фильтры, guards, DTO)
└── config/         # Конфигурация приложения
```

### Как работает авторизация
1. Пользователь отправляет email+password на `/auth/login`
2. Сервер проверяет пароль (хэшированный argon2)
3. Если правильно, генерируется JWT токен с данными пользователя
4. Фронтенд сохраняет токен и отправляет в заголовке `Authorization: Bearer <token>`
5. Guard проверяет токен и добавляет данные пользователя в запрос

### Связи между данными
- **User** ← (ownerId) → **List** ← (listId) → **Task**
- Один пользователь может иметь много списков
- Один список может содержать много задач
- При удалении списка удаляются все его задачи
- При удалении пользователя удаляются все его списки и задачи

### Мягкое удаление (Soft Delete)
Задачи удаляются мягко - устанавливается `deletedAt: Date`. Это позволяет:
- Восстановить случайно удаленные задачи
- Вести статистику
- Избежать потери связанных данных

## 🐛 Траблшутинг

### Ошибки подключения к MongoDB
```
MongooseError: Could not connect to MongoDB
```
**Решение:**
1. Проверьте правильность `MONGODB_URI` в `.env`
2. Убедитесь, что добавили свой IP в whitelist в MongoDB Atlas
3. Проверьте логин/пароль пользователя базы данных

### CORS ошибки
```
Access to fetch blocked by CORS policy
```
**Решение:**
1. Для разработки установите `CORS_ORIGINS=*`
2. Для продакшна укажите конкретные домены: `CORS_ORIGINS=http://localhost:3000,https://myapp.com`

### JWT токен не работает
**Решение:**
1. Проверьте заголовок: `Authorization: Bearer <token>`
2. Убедитесь, что токен не поврежден при копировании
3. Проверьте, что `JWT_SECRET` одинаковый при генерации и проверке

### Валидационные ошибки
API возвращает детальные ошибки валидации:
```json
{
  "message": "Validation failed",
  "code": "VALIDATION_ERROR", 
  "details": [
    "email must be a valid email",
    "password must be longer than or equal to 8 characters"
  ]
}
```

## 📦 Postman коллекция

Импортируйте `/postman/todo-api.postman_collection.json` в Postman для быстрого тестирования:

1. Откройте Postman
2. File → Import → выберите файл коллекции
3. Настройте переменные окружения:
   - `baseUrl`: `http://localhost:3000`
   - `accessToken`: автоматически заполнится после логина

## 🚀 Деплой (Railway/Render)

### Подготовка
```bash
# Убедитесь, что есть npm scripts:
npm run build    # создает папку dist/
npm run start:prod    # запускает из dist/
```

### Переменные окружения на сервере
```env
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
DB_NAME=todoapp-prod
JWT_SECRET=super-secure-production-secret
JWT_EXPIRES_IN=0
CORS_ORIGINS=https://your-frontend-app.com,http://localhost:3000
RATE_LIMIT_TTL=900
RATE_LIMIT_LIMIT=100
```

### Railway.app (рекомендуется)
1. Подключите GitHub репозиторий
2. Установите переменные окружения
3. Railway автоматически определит Node.js и запустит

## 📝 Полезные команды

```bash
# Разработка
npm run start:dev        # запуск с hot-reload
npm run seed            # заполнение тестовыми данными

# Линтинг и форматирование  
npm run lint            # проверка кода
npm run format          # форматирование кода

# Сборка
npm run build           # TypeScript → JavaScript в dist/
npm run start:prod      # запуск продакшн версии
```

## ❓ FAQ

**Q: Можно ли использовать с PostgreSQL/MySQL?**
A: Сейчас проект заточен под MongoDB. Для других БД нужно заменить Mongoose на TypeORM.

**Q: Почему JWT без истечения?**
A: Это учебный проект для фронтенд-разработчиков. В продакшне используйте `JWT_EXPIRES_IN=1h` или меньше.

**Q: Как добавить новые поля в задачи?**
A: Отредактируйте схему в `src/tasks/schemas/task.schema.ts` и DTO в `src/tasks/dto/task.dto.ts`.

**Q: Как настроить email уведомления?**
A: Добавьте почтовый сервис (Nodemailer + Gmail/SendGrid) в отдельный модуль.

---

🎯 **Проект готов к использованию для изучения фронтенд-фреймворков!**

Если у вас есть вопросы или предложения по улучшению, создавайте Issues в репозитории.
