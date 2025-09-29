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
  @ApiOperation({ summary: 'Создание новой задачи в списке' })
  @ApiResponse({
    status: 201,
    description: 'Задача успешно создана',
    type: Task
  })
  @ApiResponse({
    status: 404,
    description: 'Список не найден'
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - не ваш список'
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
  @ApiOperation({ summary: 'Получение всех задач в списке с фильтрами' })
  @ApiQuery({ name: 'status', required: false, description: 'Фильтр по статусу' })
  @ApiQuery({ name: 'tag', required: false, description: 'Фильтр по тегу' })
  @ApiQuery({ name: 'dueFrom', required: false, description: 'Срок выполнения от (ISO дата)' })
  @ApiQuery({ name: 'dueTo', required: false, description: 'Срок выполнения до (ISO дата)' })
  @ApiQuery({ name: 'q', required: false, description: 'Поиск по тексту' })
  @ApiResponse({
    status: 200,
    description: 'Список задач с пагинацией и фильтрами'
  })
  @ApiResponse({
    status: 404,
    description: 'Список не найден'
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - не ваш список'
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
  @ApiOperation({ summary: 'Получение конкретной задачи' })
  @ApiResponse({
    status: 200,
    description: 'Детали задачи',
    type: Task
  })
  @ApiResponse({
    status: 404,
    description: 'Задача не найдена'
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - задача из чужого списка'
  })
  async findOne(@Param('taskId') taskId: string, @Req() req: any) {
    return this.tasksService.findOne(taskId, req.user.id, req.user.role);
  }

  // Обновление задачи
  @Patch('/tasks/:taskId')
  @ApiOperation({ summary: 'Обновление задачи' })
  @ApiResponse({
    status: 200,
    description: 'Задача успешно обновлена',
    type: Task
  })
  @ApiResponse({
    status: 404,
    description: 'Задача не найдена'
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - задача из чужого списка'
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
  @ApiOperation({ summary: 'Пометить задачу как завершенную' })
  @ApiResponse({
    status: 200,
    description: 'Задача помечена как завершенная',
    type: Task
  })
  @ApiResponse({
    status: 404,
    description: 'Задача не найдена'
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - задача из чужого списка'
  })
  async complete(@Param('taskId') taskId: string, @Req() req: any) {
    return this.tasksService.complete(taskId, req.user.id, req.user.role);
  }

  // Мягкое удаление задачи
  @Delete('/tasks/:taskId')
  @ApiOperation({ summary: 'Удаление задачи (мягкое удаление)' })
  @ApiResponse({
    status: 200,
    description: 'Задача успешно удалена'
  })
  @ApiResponse({
    status: 404,
    description: 'Задача не найдена'
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - задача из чужого списка'
  })
  async remove(@Param('taskId') taskId: string, @Req() req: any) {
    await this.tasksService.remove(taskId, req.user.id, req.user.role);
    return { message: 'Task deleted successfully' };
  }
}
