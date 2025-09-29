import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API health and database connection' })
  @ApiResponse({
    status: 200,
    description: 'System is working properly',
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
    description: 'Database connection issues'
  })
  async check() {
    return this.healthService.check();
  }
}
