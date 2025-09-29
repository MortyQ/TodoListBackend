import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskFiltersDto } from './dto/task.dto';
import { TaskPaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Task } from './schemas/task.schema';

@ApiTags('Tasks')
@Controller() // добавляю обязательный декоратор @Controller()
@UseGuards(JwtAuthGuard) // все эндпоинты требуют авторизации
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Создание задачи в конкретном списке
  @Post('/lists/:listId/tasks')
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

  // Получение всех задач в списке с фильтрами
  @Get('/lists/:listId/tasks')
  @ApiOperation({ summary: 'Get all tasks in list with filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiQuery({ name: 'dueFrom', required: false, description: 'Due date from (ISO date)' })
  @ApiQuery({ name: 'dueTo', required: false, description: 'Due date to (ISO date)' })
  @ApiQuery({ name: 'q', required: false, description: 'Search in text' })
  @ApiResponse({
    status: 200,
    description: 'Tasks list with pagination and filters'
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
  @Get('/tasks/:taskId')
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

  // Обновление задачи
  @Patch('/tasks/:taskId')
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
  @Patch('/tasks/:taskId/complete')
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

  // Мягкое удаление задачи
  @Delete('/tasks/:taskId')
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
