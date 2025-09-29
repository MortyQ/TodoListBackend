import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AppConfigModule } from '../config/app-config.module';
import { AppConfigService } from '../config/app-config.service';

@Module({
  imports: [
    // Подключаем модуль конфигурации для доступа к AppConfigService
    AppConfigModule,

    // Подключаем схему User для работы с базой данных
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),

    // Настраиваем Passport для JWT аутентификации
    PassportModule,

    // Настраиваем JWT модуль
    JwtModule.registerAsync({
      imports: [AppConfigModule], // добавляем импорт для AppConfigService
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwtSecret,
        // Время жизни устанавливается динамически в сервисе
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService], // экспортируем для использования в других модулях
})
export class AuthModule {}
