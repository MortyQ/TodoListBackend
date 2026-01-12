import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskFiltersDto } from './dto/task.dto';
import { TaskPaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constants';
import { Task } from './schemas/task.schema';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Применяем JWT и Permissions guards
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('/lists/:listId')
  @ApiOperation({ summary: 'Create new task in list' })
  @ApiResponse({
    status: 201,
    description: 'Task successfully created',
    type: Task
  })
  @ApiResponse({
    status: 404,
    description: 'List not found'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - not your list'
  })
  async create(
    @Param('listId') listId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.create(listId, createTaskDto, req.user.id, req.user.role);
  }

  @Get('/lists/:listId')
  @ApiOperation({
    summary: 'Get all tasks in list with filters',
    description: `
Retrieve paginated list of tasks with advanced sorting, filtering and search.

**Sorting options:**
- \`createdAt\` - Sort by creation date
- \`updatedAt\` - Sort by last update date
- \`dueDate\` - Sort by due date
- \`deadline\` - Sort by deadline
- \`priority\` - Sort by priority (high → medium → low)
- \`order\` - Sort by manual order (drag & drop)
- \`title\` - Sort alphabetically by title
- \`status\` - Sort by status

**Filter options:**
- \`status\` - Filter by task status (todo, in_progress, done, archived)
- \`tag\` - Filter by tag name
- \`isStarred\` - Filter starred/important tasks only
- \`dueFrom\` / \`dueTo\` - Filter by due date range
- \`q\` - Full-text search in title, description, longDescription

**Example requests:**
- \`GET /tasks/lists/:id?sort=priority&order=desc\` - High priority tasks first
- \`GET /tasks/lists/:id?sort=deadline&order=asc&status=todo\` - Todo tasks by nearest deadline
- \`GET /tasks/lists/:id?isStarred=true&sort=createdAt&order=desc\` - Starred tasks, newest first
- \`GET /tasks/lists/:id?q=report&sort=title&order=asc\` - Search "report", sorted by title
    `
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records (1-100)',
    example: 20,
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination',
    example: 0,
    schema: { type: 'integer', minimum: 0, maximum: 10000, default: 0 }
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Field to sort by',
    example: 'createdAt',
    schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'dueDate', 'deadline', 'priority', 'order', 'title', 'status'], default: 'createdAt' }
  })
  @ApiQuery({
    name: 'order',
    required: false,
    description: 'Sort direction',
    example: 'desc',
    schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by task status',
    schema: { type: 'string', enum: ['todo', 'in_progress', 'done', 'archived'] }
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    description: 'Filter by tag name',
    example: 'urgent'
  })
  @ApiQuery({
    name: 'isStarred',
    required: false,
    description: 'Filter by starred/important tasks',
    type: Boolean,
    example: true
  })
  @ApiQuery({
    name: 'dueFrom',
    required: false,
    description: 'Due date from (ISO date)',
    example: '2024-12-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'dueTo',
    required: false,
    description: 'Due date to (ISO date)',
    example: '2024-12-31T23:59:59.000Z'
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search in title, description and longDescription',
    example: 'report'
  })
  @ApiResponse({
    status: 200,
    description: 'Tasks list with pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              listId: { type: 'string', example: '507f1f77bcf86cd799439012' },
              title: { type: 'string', example: 'Write report' },
              description: { type: 'string', example: 'Monthly sales report', nullable: true },
              longDescription: { type: 'string', example: 'Detailed analysis...', nullable: true },
              status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'archived'], example: 'todo' },
              priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
              order: { type: 'integer', example: 1 },
              tags: { type: 'array', items: { type: 'string' }, example: ['urgent', 'work'] },
              isStarred: { type: 'boolean', example: true },
              dueDate: { type: 'string', format: 'date-time', example: '2024-12-25T12:00:00.000Z', nullable: true },
              deadline: { type: 'string', format: 'date-time', example: '2024-12-31T23:59:59.000Z', nullable: true },
              createdAt: { type: 'string', format: 'date-time', example: '2024-12-01T10:00:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2024-12-20T15:30:00.000Z' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 50, description: 'Total number of tasks' },
            limit: { type: 'integer', example: 20, description: 'Records per page' },
            offset: { type: 'integer', example: 0, description: 'Current offset' },
            hasMore: { type: 'boolean', example: true, description: 'Whether more records exist' },
            currentPage: { type: 'integer', example: 1, description: 'Current page number' },
            totalPages: { type: 'integer', example: 3, description: 'Total number of pages' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'List not found'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - not your list'
  })
  async findAllInList(
    @Param('listId') listId: string,
    @Query() paginationDto: TaskPaginationDto,
    @Query() filtersDto: TaskFiltersDto,
    @Req() req: any,
  ) {
    return this.tasksService.findAllInList(
      listId,
      req.user.id,
      req.user.role,
      paginationDto,
      filtersDto,
    );
  }

  // Получение конкретной задачи
  @Get('/:taskId')
  @RequirePermission(PERMISSIONS.READ_TASK)
  @ApiOperation({ summary: 'Get specific task' })
  @ApiResponse({
    status: 200,
    description: 'Task details',
    type: Task
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - task from another user list'
  })
  async findOne(@Param('taskId') taskId: string, @Req() req: any) {
    return this.tasksService.findOne(taskId, req.user.id, req.user.role);
  }

  @Patch('/:taskId')
  @RequirePermission(PERMISSIONS.UPDATE_TASK)
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({
    status: 200,
    description: 'Task successfully updated',
    type: Task
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - task from another user list'
  })
  async update(
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Req() req: any,
  ) {
    return this.tasksService.update(taskId, updateTaskDto, req.user.id, req.user.role);
  }

  // Быстрое завершение задачи
  @Patch('/:taskId/complete')
  @RequirePermission(PERMISSIONS.UPDATE_TASK)
  @ApiOperation({ summary: 'Mark task as completed' })
  @ApiResponse({
    status: 200,
    description: 'Task marked as completed',
    type: Task
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - task from another user list'
  })
  async complete(@Param('taskId') taskId: string, @Req() req: any) {
    return this.tasksService.complete(taskId, req.user.id, req.user.role);
  }

  // Получение важных (starred) задач из всех списков
  @Get('/starred/all')
  @RequirePermission(PERMISSIONS.READ_TASK)
  @ApiOperation({ summary: 'Get all starred/important tasks from all user lists (Top Important Tasks)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results (default: 10)', example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of starred tasks'
  })
  async getStarredTasks(@Query('limit') limit: string, @Req() req: any) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.tasksService.getStarredTasks(req.user.id, req.user.role, limitNum);
  }

  // Получение задач с дедлайнами (upcoming / range)
  @Get('/deadlines')
  @RequirePermission(PERMISSIONS.READ_TASK)
  @ApiOperation({ summary: 'Get tasks with upcoming deadlines (or within date range)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit results (default: 20)', example: 20 })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)', example: '2023-01-01' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)', example: '2023-12-31' })
  @ApiResponse({
    status: 200,
    description: 'List of tasks with deadlines'
  })
  async getTasksWithDeadlines(
    @Query('limit') limit: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: any
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.tasksService.getTasksWithDeadlines(req.user.id, req.user.role, limitNum, startDate, endDate);
  }

  // Переключение статуса isStarred (add/remove from starred)
  @Patch('/:taskId/toggle-star')
  @RequirePermission(PERMISSIONS.UPDATE_TASK)
  @ApiOperation({ summary: 'Toggle task starred status (add/remove from important tasks)' })
  @ApiResponse({
    status: 200,
    description: 'Task starred status toggled',
    type: Task
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - task from another user list'
  })
  async toggleStar(@Param('taskId') taskId: string, @Req() req: any) {
    return this.tasksService.toggleStar(taskId, req.user.id, req.user.role);
  }

  // Методы для Weekly Goals (Фокус недели)

  @Get('/weekly-goals')
  @RequirePermission(PERMISSIONS.READ_TASK)
  @ApiOperation({ summary: 'Get current weekly focus goals' })
  @ApiResponse({
    status: 200,
    description: 'List of weekly goals',
    type: [Task]
  })
  async getWeeklyGoals(@Req() req: any) {
    return this.tasksService.getWeeklyGoals(req.user.id, req.user.role);
  }

  @Patch('/:taskId/toggle-weekly-goal')
  @RequirePermission(PERMISSIONS.UPDATE_TASK)
  @ApiOperation({ summary: 'Toggle task weekly goal status (add/remove from focus)' })
  @ApiResponse({
    status: 200,
    description: 'Task weekly goal status toggled',
    type: Task
  })
  @ApiResponse({
    status: 403,
    description: 'Maximum 3 weekly goals allowed or Access denied'
  })
  async toggleWeeklyGoal(@Param('taskId') taskId: string, @Req() req: any) {
    return this.tasksService.toggleWeeklyGoal(taskId, req.user.id, req.user.role);
  }

  @Delete('/:taskId')
  @RequirePermission(PERMISSIONS.DELETE_TASK)
  @ApiOperation({ summary: 'Delete task (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Task successfully deleted'
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - task from another user list'
  })
  async remove(@Param('taskId') taskId: string, @Req() req: any) {
    await this.tasksService.remove(taskId, req.user.id, req.user.role);
    return { message: 'Task deleted successfully' };
  }
}
