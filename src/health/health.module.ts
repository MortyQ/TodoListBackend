import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthService } from './health.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Используем MongooseModule для получения подключения к MongoDB
    MongooseModule.forFeature([]), // пустой массив, так как нам нужно только подключение
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
