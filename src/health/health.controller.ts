import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Проверка работоспособности API и подключения к базе данных' })
  @ApiResponse({
    status: 200,
    description: 'Система работает нормально',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        database: { type: 'string', example: 'connected' },
        uptime: { type: 'number', example: 12345 }
      }
    }
  })
  @ApiResponse({
    status: 503,
    description: 'Проблемы с подключением к базе данных'
  })
  async check() {
    return this.healthService.check();
  }
}
