import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get analytics summary (counts)' })
  @ApiResponse({
    status: 200,
    description: 'Summary statistics',
    schema: {
      type: 'object',
      properties: {
        lists: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 5 }
          }
        },
        tasks: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 50 },
            completed: { type: 'integer', example: 20 },
            archived: { type: 'integer', example: 5 },
            todo: { type: 'integer', example: 15 },
            inProgress: { type: 'integer', example: 10 }
          }
        }
      }
    }
  })
  async getSummary(@Req() req: any) {
    return this.analyticsService.getSummary(req.user.id, req.user.role);
  }

  @Get('popular-tags')
  @ApiOperation({ summary: 'Get most popular tags' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of tags to return',
    example: 10,
    schema: { type: 'integer', default: 10 }
  })
  @ApiResponse({
    status: 200,
    description: 'List of popular tags',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tag: { type: 'string', example: 'work' },
          count: { type: 'integer', example: 15 }
        }
      }
    }
  })
  async getPopularTags(@Req() req: any, @Query('limit') limit?: number) {
    return this.analyticsService.getPopularTags(req.user.id, req.user.role, limit ? Number(limit) : 10);
  }

  @Get('tasks-by-priority')
  @ApiOperation({ summary: 'Get tasks count by priority' })
  @ApiResponse({
    status: 200,
    description: 'Tasks count by priority',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          priority: { type: 'string', example: 'high' },
          count: { type: 'integer', example: 10 }
        }
      }
    }
  })
  async getTasksByPriority(@Req() req: any) {
    return this.analyticsService.getTasksByPriority(req.user.id, req.user.role);
  }

  @Get('daily-activity')
  @ApiOperation({ summary: 'Get daily task activity (created vs completed)' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (YYYY-MM-DD)',
    example: '2023-01-01'
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (YYYY-MM-DD)',
    example: '2023-01-07'
  })
  @ApiResponse({
    status: 200,
    description: 'Daily activity stats',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', example: '2023-01-01' },
          created: { type: 'integer', example: 5 },
          completed: { type: 'integer', example: 3 }
        }
      }
    }
  })
  async getDailyActivity(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getDailyActivity(req.user.id, req.user.role, startDate, endDate);
  }
}

