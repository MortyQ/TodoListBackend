# Деплой на Vercel

## Подготовка проекта

Проект уже настроен для деплоя на Vercel. Все необходимые файлы присутствуют:
- `vercel.json` - конфигурация Vercel
- `api/index.ts` - serverless функция для Vercel
- `.env.example` - пример переменных окружения

## Шаги для деплоя

### 1. Установите Vercel CLI (опционально)

```bash
npm i -g vercel
```

### 2. Деплой через веб-интерфейс

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите "Add New" → "Project"
3. Импортируйте ваш GitHub репозиторий
4. Vercel автоматически определит настройки

### 3. Настройка переменных окружения

В настройках проекта на Vercel добавьте следующие переменные:

#### Обязательные переменные:

```
MONGODB_URI=your_mongodb_connection_string
DB_NAME=todoapp
JWT_SECRET=your_secure_random_secret
```

#### Дополнительные переменные:

```
PORT=3030
JWT_EXPIRES_IN=0
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_TTL=900
RATE_LIMIT_LIMIT=100
```

### 4. MongoDB Atlas

Убедитесь, что в MongoDB Atlas:
1. Whitelist IP адреса Vercel (или используйте `0.0.0.0/0` для всех)
2. Connection string правильно настроен
3. База данных создана

### 5. CORS

Для работы с вашим фронтендом на `localhost:3000` установите:

```
CORS_ORIGINS=http://localhost:3000
```

Для production фронтенда:

```
CORS_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

### 6. Деплой

После настройки переменных окружения:
1. Нажмите "Deploy" в Vercel
2. Дождитесь окончания деплоя
3. Получите URL вашего API

### 7. Проверка

После деплоя проверьте:
- Health endpoint: `https://your-app.vercel.app/api/health`
- Swagger docs: `https://your-app.vercel.app/docs`

## Важные замечания

### Swagger на Vercel

Swagger может работать некорректно на Vercel из-за serverless архитектуры. Если `/docs` не работает, используйте Postman или другие инструменты для тестирования API.

### Холодный старт

Serverless функции на Vercel имеют "холодный старт" - первый запрос может быть медленнее.

### Лимиты бесплатного плана

- Execution time: 10 секунд
- Deployments: 100/день
- Bandwidth: 100GB/месяц

## Альтернатива: Деплой через CLI

```bash
# Логин
vercel login

# Деплой в production
vercel --prod

# Добавить переменные окружения
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add CORS_ORIGINS
```

## Структура URL

После деплоя все эндпоинты будут доступны с префиксом `/api`:

- `https://your-app.vercel.app/api/health` - health check
- `https://your-app.vercel.app/api/auth/register` - регистрация
- `https://your-app.vercel.app/api/auth/login` - логин
- `https://your-app.vercel.app/api/lists` - списки задач
- `https://your-app.vercel.app/api/tasks` - задачи

## Troubleshooting

### Ошибка 404

Проверьте:
1. `vercel.json` настроен правильно
2. Путь к файлу `api/index.ts` корректен
3. В настройках Vercel правильно указан Root Directory

### CORS ошибки

Убедитесь, что:
1. `CORS_ORIGINS` включает URL вашего фронтенда
2. Используете правильный протокол (http/https)
3. Нет лишних слэшей в конце URL

### MongoDB connection timeout

Проверьте:
1. IP whitelist в MongoDB Atlas
2. Connection string корректен
3. База данных существует

### Swagger не работает

Это нормально для Vercel. Используйте:
1. Postman коллекцию из папки `postman/`
2. Или другой API клиент

## Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [NestJS on Vercel](https://vercel.com/guides/deploying-nestjs-with-vercel)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

