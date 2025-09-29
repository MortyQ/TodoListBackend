import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Создаем NestJS приложение
  const app = await NestFactory.create(AppModule);

  // Получаем сервис конфигурации
  const configService = app.get(AppConfigService);

  // Настраиваем глобальную валидацию данных
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // удаляет поля, не описанные в DTO
      forbidNonWhitelisted: true, // выбрасывает ошибку при лишних полях
      transform: true, // автоматически преобразует типы (string -> number и т.д.)
      transformOptions: {
        enableImplicitConversion: true, // автоматическое преобразование типов
      },
    }),
  );

  // Настраиваем CORS для фронтенд приложений
  app.enableCors({
    origin: configService.corsOrigins, // домены из конфигурации
    credentials: true, // поддержка cookies
  });

  // Настраиваем Swagger документацию
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MuzalovTodoApp')
    .setDescription('Todo Backend API built with NestJS + TypeScript + Mongoose for frontend developers learning')
    .setVersion('1.0')
    .addBearerAuth() // поддержка JWT токенов в Swagger UI
    .addTag('Authentication', 'Registration, login and profile management')
    .addTag('Users', 'User management (admin only)')
    .addTag('Profile', 'Profile management')
    .addTag('Lists', 'Todo lists management')
    .addTag('Tasks', 'Tasks management')
    .addTag('Health', 'API health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'MuzalovTodoApp API Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #e53e3e; }
    `,
  });

  // Запускаем сервер
  const port = configService.port;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
  logger.log(`💾 Database: ${configService.dbName}`);
  logger.log(`🔒 CORS origins: ${JSON.stringify(configService.corsOrigins)}`);
}

// Запускаем приложение и обрабатываем ошибки
bootstrap().catch((error) => {
  Logger.error('Failed to start application', error, 'Bootstrap');
  process.exit(1);
});
