import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController, ProfileController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    // Подключаем схему User для работы с пользователями
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController, ProfileController], // два контроллера: админский и профильный
  providers: [UsersService],
  exports: [UsersService], // экспортируем для использования в других модулях
})
export class UsersModule {}
