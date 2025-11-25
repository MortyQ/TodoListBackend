# MuzalovTodoApp - Backend API

Повноцінний Todo Backend API, побудований на **NestJS + TypeScript + Mongoose** для навчання фронтенд-розробників.

## 🚀 Особливості

- **JWT автентифікація** без закінчення термінів дії токенів (для навчальних цілей)
- **Ролі користувачів** - `user` та `admin` з різними правами доступу
- **CRUD операції** для списків завдань та самих завдань
- **Потужна фільтрація** завдань за статусом, тегами, датами, пошуком по тексту
- **Пагінація та сортування** для всіх списків даних
- **Swagger документація** доступна на `/docs`
- **Rate Limiting** захист від спаму запитів
- **Готові тестові дані** через команду `npm run seed`
- **Postman колекція** для швидкого тестування API

## 📋 Вимоги

- **Node.js** v18+ (LTS рекомендується)
- **MongoDB Atlas** підключення (отримати у викладача)
- **npm** або **yarn**

## ⚡ Швидкий старт

### 1. Клонування та встановлення

```bash
# Клонуйте репозиторій
git clone <your-repo-url>
cd TodoBackend

# Встановіть залежності
npm install
```

### 2. Налаштування оточення

Скопіюйте `.env.example` в `.env` та заповніть змінні:

```bash
cp .env.example .env
```

Відредагуйте `.env` файл:

```env
# Server Configuration
PORT=3030

# Database Configuration - ОБОВ'ЯЗКОВО ЗАПОВНИТИ!
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

### 3. Отримання підключення до бази даних

**Ключ підключення можна отримати у викладача** - всі підключаються до однієї спільної бази даних MongoDB Atlas.

Після отримання підключення:
1. Замініть `MONGODB_URI` в файлі `.env` на отримані дані
2. Переконайтеся, що `DB_NAME` встановлено правильно

### 4. Запуск застосунку

```bash
# Режим розробки з hot-reload
npm run start:dev

# Заповнення бази тестовими даними (опціонально)
npm run seed

# Звичайний запуск
npm start

# Продакшн збірка
npm run build
npm run start:prod
```

Застосунок буде доступний на:
- **API**: http://localhost:3000
- **Swagger документація**: http://localhost:3000/docs

## 🔐 Тестові користувачі (після seed)

Після виконання `npm run seed` будуть створені:

| Email | Пароль | Роль | Опис |
|-------|--------|------|------|
| `admin@example.com` | `Passw0rd!` | admin | Може керувати всіма користувачами та їх даними |
| `user@example.com` | `Passw0rd!` | user | Звичайний користувач з тестовими списками та завданнями |

## 📖 Як використовувати API

### Покрокова інструкція для фронтенд-розробника

1. **Реєстрація нового користувача**
   ```bash
   POST /auth/register
   {
     "email": "test@example.com",
     "password": "MySecretPassword",
     "name": "Test User"
   }
   ```

2. **Авторизація**
   ```bash
   POST /auth/login
   {
     "email": "test@example.com", 
     "password": "MySecretPassword"
   }
   # Отримайте accessToken та використовуйте в заголовку: Authorization: Bearer <token>
   ```

3. **Створення списку завдань**
   ```bash
   POST /lists
   Authorization: Bearer <your-token>
   {
     "title": "Мій робочий список"
   }
   ```

4. **Додавання завдань до списку**
   ```bash
   POST /lists/{listId}/tasks
   Authorization: Bearer <your-token>
   {
     "title": "Написати код",
     "description": "Реалізувати компонент",
     "priority": "high",
     "tags": ["frontend", "react"],
     "dueDate": "2024-01-15T10:00:00.000Z"
   }
   ```

5. **Фільтрація завдань**
   ```bash
   GET /lists/{listId}/tasks?status=todo&tag=frontend&q=код&sort=priority&order=desc
   ```

6. **Зміна статусу завдання**
   ```bash
   PATCH /tasks/{taskId}
   {
     "status": "done"
   }
   # або швидко завершити:
   PATCH /tasks/{taskId}/complete
   ```

## 🗃️ Структура даних

### Модель користувача (User)
```typescript
{
  id: string
  email: string           // унікальний
  name?: string
  role: 'user' | 'admin'  // роль користувача
  createdAt: Date
  updatedAt: Date
}
```

### Модель списку (List)
```typescript
{
  id: string
  title: string           // назва списку
  ownerId: string         // ID власника
  createdAt: Date
  updatedAt: Date
}
```

### Модель завдання (Task)
```typescript
{
  id: string
  listId: string                                    // ID списку
  title: string                                     // назва
  description?: string                              // короткий опис
  longDescription?: string                          // детальний опис
  status: 'todo' | 'in_progress' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high'
  order?: number                                    // порядок (для drag&drop)
  tags?: string[]                                   // теги
  dueDate?: Date                                    // термін виконання
  completedAt?: Date                                // час завершення
  deletedAt?: Date                                  // м'яке видалення
  createdAt: Date
  updatedAt: Date
}
```

## 🔒 Права доступу

### Звичайний користувач (`user`)
- ✅ Реєстрація, авторизація
- ✅ Керування своїм профілем
- ✅ CRUD своїх списків та завдань
- ❌ Доступ до чужих даних
- ❌ Адміністративні функції

### Адміністратор (`admin`)
- ✅ Всі можливості звичайного користувача
- ✅ Перегляд всіх користувачів
- ✅ Зміна ролей користувачів
- ✅ Видалення користувачів
- ✅ Доступ до всіх списків та завдань

## 📊 API Endpoints

### Автентифікація
- `POST /auth/register` - Реєстрація
- `POST /auth/login` - Вхід
- `GET /auth/profile` - Профіль поточного користувача

### Профіль
- `GET /me` - Мій профіль
- `PATCH /me` - Оновити профіль

### Списки завдань
- `POST /lists` - Створити список
- `GET /lists` - Мої списки (з пагінацією)
- `GET /lists/:id` - Конкретний список
- `PATCH /lists/:id` - Оновити список
- `DELETE /lists/:id` - Видалити список

### Завдання
- `POST /lists/:listId/tasks` - Створити завдання
- `GET /lists/:listId/tasks` - Завдання в списку (з фільтрами)
- `GET /tasks/:taskId` - Конкретне завдання
- `PATCH /tasks/:taskId` - Оновити завдання
- `PATCH /tasks/:taskId/complete` - Завершити завдання
- `DELETE /tasks/:taskId` - Видалити завдання (м'яко)

### Адміністрування (тільки admin)
- `GET /users` - Всі користувачі
- `GET /users/:id` - Користувач по ID
- `PATCH /users/:id/role` - Змінити роль
- `DELETE /users/:id` - Видалити користувача

### Системні
- `GET /health` - Перевірка працездатності

## 🎯 Фільтри та параметри

### Пагінація (для всіх списків)
- `limit` - кількість записів (1-100, за замовчуванням 20)
- `offset` - зміщення (за замовчуванням 0)
- `sort` - поле сортування (`createdAt`, `updatedAt`)
- `order` - порядок (`asc`, `desc`, за замовчуванням `desc`)

### Фільтри завдань
- `status` - статус (`todo`, `in_progress`, `done`, `archived`)
- `tag` - фільтр по тегу
- `priority` - пріоритет (`low`, `medium`, `high`)
- `dueFrom` - термін виконання від (ISO дата)
- `dueTo` - термін виконання до (ISO дата)
- `q` - пошук по тексту (title, description, longDescription)

### Сортування завдань
- `createdAt` - за датою створення
- `dueDate` - за терміном виконання
- `priority` - за пріоритетом (high → medium → low)
- `order` - за порядковим номером

## 🔧 Як це влаштовано (для новачків)

### Архітектура застосунку
```
src/
├── auth/           # Автентифікація (JWT, паролі)
├── users/          # Керування користувачами
├── lists/          # Списки завдань
├── tasks/          # Завдання
├── health/         # Перевірка стану
├── common/         # Спільні компоненти (фільтри, guards, DTO)
└── config/         # Конфігурація застосунку
```

### Як працює авторизація
1. Користувач відправляє email+password на `/auth/login`
2. Сервер перевіряє пароль (хешований argon2)
3. Якщо правильно, генерується JWT токен з даними користувача
4. Фронтенд зберігає токен та відправляє в заголовку `Authorization: Bearer <token>`
5. Guard перевіряє токен та додає дані користувача в запит

### Зв'язки між даними
- **User** ← (ownerId) → **List** ← (listId) → **Task**
- Один користувач може мати багато списків
- Один список може містити багато завдань
- При видаленні списку видаляються всі його завдання
- При видаленні користувача видаляються всі його списки та завдання

### М'яке видалення (Soft Delete)
Завдання видаляються м'яко - встановлюється `deletedAt: Date`. Це дозволяє:
- Відновити випадково видалені завдання
- Вести статистику
- Уникнути втрати пов'язаних даних

## 🐛 Вирішення проблем

### Помилки підключення до MongoDB
```
MongooseError: Could not connect to MongoDB
```
**Рішення:**
1. Перевірте правильність `MONGODB_URI` в `.env`
2. Переконайтесь, що отримали правильні дані підключення від викладача
3. Перевірте логін/пароль користувача бази даних

### CORS помилки
```
Access to fetch blocked by CORS policy
```
**Рішення:**
1. Для розробки встановіть `CORS_ORIGINS=*`
2. Для продакшну вкажіть конкретні домени: `CORS_ORIGINS=http://localhost:3000,https://myapp.com`

### JWT токен не працює
**Рішення:**
1. Перевірте заголовок: `Authorization: Bearer <token>`
2. Переконайтесь, що токен не пошкоджений при копіюванні
3. Перевірте, що `JWT_SECRET` однаковий при генерації та перевірці

### Помилки валідації
API повертає детальні помилки валідації:
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

## 📦 Postman колекція

Імпортуйте `/postman/todo-api.postman_collection.json` в Postman для швидкого тестування:

1. Відкрийте Postman
2. File → Import → виберіть файл колекції
3. Налаштуйте змінні оточення:
   - `baseUrl`: `http://localhost:3000`
   - `accessToken`: автоматично заповниться після логіну

## 🚀 Деплой на Render.com

### Підготовка проекту
Проект вже підготовлений до деплою! Перевірте наявність:
- ✅ `render.yaml` - конфігурація для автоматичного деплою
- ✅ `.node-version` - версія Node.js
- ✅ `npm run start:prod` - production скрипт

### Крок 1: Створіть MongoDB Atlas базу даних (безкоштовно)

1. Зареєструйтесь на [MongoDB Atlas](https://cloud.mongodb.com)
2. Створіть новий кластер (безкоштовний M0 Shared)
3. Створіть користувача бази даних (Database Access):
   - Username: `todoapp-user`
   - Password: згенеруйте або створіть власний
4. Додайте IP адресу (Network Access):
   - Натисніть "Add IP Address"
   - Виберіть "Allow Access from Anywhere" (0.0.0.0/0)
5. Отримайте Connection String:
   - Натисніть "Connect" → "Connect your application"
   - Скопіюйте URI (виглядає як: `mongodb+srv://todoapp-user:<password>@cluster0.xxxxx.mongodb.net/`)
   - Замініть `<password>` на реальний пароль

### Крок 2: Підготовка репозиторію

```bash
# Переконайтесь, що всі зміни збережено
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Крок 3: Деплой на Render.com

1. **Реєстрація**
   - Перейдіть на [render.com](https://render.com)
   - Натисніть "Get Started for Free"
   - Виберіть "Sign up with GitHub"
   - Авторизуйте доступ до репозиторіїв

2. **Створення Web Service**
   - На dashboard натисніть "New +" → "Web Service"
   - Виберіть репозиторій `TodoBackend`
   - Натисніть "Connect"

3. **Налаштування сервісу**
   - **Name**: `todolist-backend` (або інше ім'я)
   - **Region**: `Frankfurt (EU Central)` (найближчий до України)
   - **Branch**: `main`
   - **Root Directory**: залиште порожнім
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: `Free`

4. **Додайте змінні оточення (Environment Variables)**
   
   Натисніть "Add Environment Variable" та додайте:
   
   ```
   NODE_ENV = production
   
   MONGODB_URI = mongodb+srv://todoapp-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/
   
   DB_NAME = todoapp
   
   JWT_SECRET = [згенеруйте: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"]
   
   JWT_EXPIRES_IN = 7d
   
   CORS_ORIGINS = https://mortyq.github.io
   
   RATE_LIMIT_TTL = 900
   
   RATE_LIMIT_LIMIT = 100
   ```
   
   **Важливо**: 
   - `MONGODB_URI` - використайте Connection String з MongoDB Atlas
   - `JWT_SECRET` - згенеруйте надійний ключ!
   - `CORS_ORIGINS` - додайте URL вашого фронтенду

5. **Запустіть деплой**
   - Натисніть "Create Web Service"
   - Render почне збирати та деплоїти проект
   - Слідкуйте за логами в реальному часі
   - Після успіху отримаєте URL: `https://todolist-backend.onrender.com`

### Крок 4: Перевірка роботи

```bash
# Перевірте health endpoint
curl https://todolist-backend.onrender.com/api/health

# Очікуваний результат:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

### Крок 5: Оновіть фронтенд

У вашому фронтенд проекті змініть API URL:

```typescript
// Старий (локальний)
const API_URL = 'http://localhost:3030/api';

// Новий (production)
const API_URL = 'https://todolist-backend.onrender.com/api';
```

### Автоматичні оновлення

Render автоматично оновлює застосунок при кожному `git push` в гілку `main`! 🎉

### ⚠️ Важливо знати про безкоштовний тариф

- **Сервіс "засипає"** після 15 хвилин неактивності
- **Перший запит** після "сну" займе 30-50 секунд (cold start)
- **750 годин роботи** на місяць безкоштовно (достатньо для 1 сервісу)
- **Автоматичне пробудження** при будь-якому запиті

### 🔧 Вирішення проблем при деплої

**Помилка збірки (Build failed)**
```bash
# Перевірте локально:
npm install
npm run build
npm run start:prod
```

**База даних не підключається**
- Перевірте IP whitelist в MongoDB Atlas (має бути 0.0.0.0/0)
- Перевірте правильність MONGODB_URI
- Перевірте пароль користувача бази даних

**CORS помилки**
- Додайте URL фронтенду в `CORS_ORIGINS`
- Приклад: `CORS_ORIGINS=https://mortyq.github.io,https://yourdomain.com`

**Логи та моніторинг**
- Переглядайте логи в Render dashboard → "Logs"
- Перевірте статус: "Events" та "Metrics"

### 💰 Якщо потрібна краща продуктивність

Платний тариф ($7/міс):
- ✅ Без засипання
- ✅ Більше ресурсів (512 MB RAM → 2 GB)
- ✅ Швидший запуск
- ✅ Більше годин роботи

Альтернативи:
- **Railway.app** - $5 кредитів на місяць
- **Fly.io** - безкоштовний тариф з хорошою продуктивністю
- **Vercel** - для serverless функцій

## 📝 Корисні команди

```bash
# Розробка
npm run start:dev        # запуск з hot-reload
npm run seed            # заповнення тестовими даними

# Лінтинг та форматування  
npm run lint            # перевірка коду
npm run format          # форматування коду

# Збірка
npm run build           # TypeScript → JavaScript в dist/
npm run start:prod      # запуск продакшн версії
```

## ❓ FAQ

**Q: Чи можна використовувати з PostgreSQL/MySQL?**
A: Зараз проект налаштований під MongoDB. Для інших БД потрібно замінити Mongoose на TypeORM.

**Q: Чому JWT без закінчення терміну дії?**
A: Це навчальний проект для фронтенд-розробників. У продакшні використовуйте `JWT_EXPIRES_IN=1h` або менше.

**Q: Як додати нові поля в завдання?**
A: Відредагуйте схему в `src/tasks/schemas/task.schema.ts` та DTO в `src/tasks/dto/task.dto.ts`.

**Q: Як налаштувати email сповіщення?**
A: Додайте поштовий сервіс (Nodemailer + Gmail/SendGrid) в окремий модуль.

---

🎯 **Проект готовий до використання для вивчення фронтенд-фреймворків!**

Якщо у вас є питання або пропозиції щодо покращення, створюйте Issues в репозиторії.
