import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './app-config.service';

@Module({
  imports: [ConfigModule],
  providers: [AppConfigService],
  exports: [AppConfigService], // экспортируем для использования в других модулях
})
export class AppConfigModule {}
