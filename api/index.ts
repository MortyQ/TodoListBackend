import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';
import * as express from 'express';

const expressApp = express();
let cachedApp;

async function createApp() {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      { logger: ['error', 'warn', 'log'] }
    );

    app.setGlobalPrefix('api');

    const configService = app.get(AppConfigService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Настройка CORS для Vercel
    const corsOrigins = configService.corsOrigins;
    app.enableCors({
      origin: corsOrigins === '*' ? true : corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Authorization'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    // Swagger конфигурация
    const swaggerConfig = new DocumentBuilder()
      .setTitle('MuzalovTodoApp')
      .setDescription('Todo Backend API built with NestJS + TypeScript + Mongoose for frontend developers learning')
      .setVersion('1.0')
      .addBearerAuth()
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
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });

    await app.init();
    cachedApp = app;
  }

  return cachedApp;
}

export default async (req, res) => {
  await createApp();
  return expressApp(req, res);
};

