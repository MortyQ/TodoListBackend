import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, IsArray, IsDateString, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';

// DTO для создания новой задачи
export class CreateTaskDto {
  @ApiProperty({
    description: 'Название задачи',
    example: 'Написать отчет',
    maxLength: 200
  })
  @IsString()
  @Length(1, 200, { message: 'Task title must be between 1 and 200 characters' })
  title: string;

  @ApiProperty({
    description: 'Короткое описание задачи',
    example: 'Подготовить месячный отчет по продажам',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Расширенное описание задачи',
    example: 'Детальный отчет должен включать анализ продаж...',
    required: false
  })
  @IsOptional()
  @IsString()
  longDescription?: string;

  @ApiProperty({
    description: 'Статус задачи',
    example: TaskStatus.TODO,
    enum: TaskStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @ApiProperty({
    description: 'Приоритет задачи',
    example: TaskPriority.MEDIUM,
    enum: TaskPriority,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Теги задачи',
    example: ['работа', 'срочно'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];

  @ApiProperty({
    description: 'Срок выполнения задачи (ISO строка)',
    example: '2023-12-31T23:59:59.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  dueDate?: string;

  @ApiProperty({
    description: 'Порядок задачи в списке',
    example: 1,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  order?: number;
}

// DTO для обновления задачи (все поля опциональны)
export class UpdateTaskDto {
  @ApiProperty({
    description: 'Название задачи',
    example: 'Обновленное название задачи',
    required: false,
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @Length(1, 200, { message: 'Task title must be between 1 and 200 characters' })
  title?: string;

  @ApiProperty({
    description: 'Короткое описание задачи',
    example: 'Обновленное описание',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Расширенное описание задачи',
    example: 'Обновленное детальное описание...',
    required: false
  })
  @IsOptional()
  @IsString()
  longDescription?: string;

  @ApiProperty({
    description: 'Статус задачи',
    example: TaskStatus.IN_PROGRESS,
    enum: TaskStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @ApiProperty({
    description: 'Приоритет задачи',
    example: TaskPriority.HIGH,
    enum: TaskPriority,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Теги задачи',
    example: ['работа', 'обновлено'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];

  @ApiProperty({
    description: 'Срок выполнения задачи (ISO строка)',
    example: '2023-12-31T23:59:59.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  dueDate?: string;

  @ApiProperty({
    description: 'Порядок задачи в списке',
    example: 2,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  order?: number;
}

// DTO для фильтрации задач
export class TaskFiltersDto {
  @ApiProperty({
    description: 'Фильтр по статусу',
    example: TaskStatus.TODO,
    enum: TaskStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @ApiProperty({
    description: 'Фильтр по тегу',
    example: 'работа',
    required: false
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({
    description: 'Срок выполнения от (ISO строка)',
    example: '2023-01-01T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due from must be a valid ISO date string' })
  dueFrom?: string;

  @ApiProperty({
    description: 'Срок выполнения до (ISO строка)',
    example: '2023-12-31T23:59:59.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due to must be a valid ISO date string' })
  dueTo?: string;

  @ApiProperty({
    description: 'Поиск по названию, описанию или расширенному описанию',
    example: 'отчет',
    required: false
  })
  @IsOptional()
  @IsString()
  q?: string;
}
