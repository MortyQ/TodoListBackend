import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';

// Импортируем все модули приложения
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ListsModule } from './lists/lists.module';
import { TasksModule } from './tasks/tasks.module';
import { HealthModule } from './health/health.module';

// Импортируем конфигурацию и общие компоненты
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    // Подключаем конфигурацию из .env файла
    ConfigModule.forRoot({
      isGlobal: true, // делаем ConfigService доступным везде
      envFilePath: '.env',
    }),

    // Подключаем модуль конфигурации
    AppConfigModule,

    // Подключаемся к MongoDB с помощью Mongoose
    MongooseModule.forRootAsync({
      imports: [AppConfigModule], // импортируем модуль с AppConfigService
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        uri: configService.mongodbUri,
        dbName: configService.dbName,
      }),
    }),

    // Настраиваем rate limiting (защита от спама запросов)
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule], // импортируем модуль с AppConfigService
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        ttl: configService.rateLimitTtl, // время окна в секундах
        limit: configService.rateLimitLimit, // максимум запросов в окне
      }),
    }),

    // Подключаем все функциональные модули
    AuthModule,
    UsersModule,
    ListsModule,
    TasksModule,
    HealthModule,
  ],
  providers: [
    // Глобальный фильтр для обработки всех исключений
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    // Глобальный guard для rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
