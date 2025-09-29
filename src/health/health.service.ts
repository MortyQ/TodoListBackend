import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class HealthService {
  constructor(
    @InjectConnection() private connection: Connection,
  ) {}

  async check() {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();

    try {
      // Проверяем подключение к MongoDB
      const dbState = this.connection.readyState;

      // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (dbState !== 1) {
        throw new ServiceUnavailableException({
          status: 'error',
          timestamp,
          database: 'disconnected',
          uptime,
          message: 'Database connection is not available',
        });
      }

      // Дополнительная проверка - выполняем простой запрос к базе
      await this.connection.db.admin().ping();

      return {
        status: 'ok',
        timestamp,
        database: 'connected',
        uptime: Math.floor(uptime),
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp,
        database: 'error',
        uptime: Math.floor(uptime),
        message: 'Database health check failed',
        error: error.message,
      });
    }
  }
}
