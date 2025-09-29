import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, IsArray, IsDateString, Length, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskStatus, TaskPriority } from '../schemas/task.schema';

// DTO for creating a new task
export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Write a report',
    maxLength: 200
  })
  @IsString()
  @Length(1, 200, { message: 'Task title must be between 1 and 200 characters' })
  title: string;

  @ApiProperty({
    description: 'Short task description',
    example: 'Prepare monthly sales report',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Extended task description',
    example: 'Detailed report should include sales analysis...',
    required: false
  })
  @IsOptional()
  @IsString()
  longDescription?: string;

  @ApiProperty({
    description: 'Task status',
    example: TaskStatus.TODO,
    enum: TaskStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @ApiProperty({
    description: 'Task priority',
    example: TaskPriority.MEDIUM,
    enum: TaskPriority,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Task tags',
    example: ['work', 'urgent'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];

  @ApiProperty({
    description: 'Task due date (ISO string)',
    example: '2023-12-31T23:59:59.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  dueDate?: string;

  @ApiProperty({
    description: 'Task order in list',
    example: 1,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  order?: number;
}

// DTO for updating a task (all fields are optional)
export class UpdateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Updated task title',
    required: false,
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @Length(1, 200, { message: 'Task title must be between 1 and 200 characters' })
  title?: string;

  @ApiProperty({
    description: 'Short task description',
    example: 'Updated description',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Extended task description',
    example: 'Updated detailed description...',
    required: false
  })
  @IsOptional()
  @IsString()
  longDescription?: string;

  @ApiProperty({
    description: 'Task status',
    example: TaskStatus.IN_PROGRESS,
    enum: TaskStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @ApiProperty({
    description: 'Task priority',
    example: TaskPriority.HIGH,
    enum: TaskPriority,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskPriority, { message: 'Invalid task priority' })
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Task tags',
    example: ['work', 'updated'],
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each tag must be a string' })
  tags?: string[];

  @ApiProperty({
    description: 'Task due date (ISO string)',
    example: '2023-12-31T23:59:59.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO date string' })
  dueDate?: string;

  @ApiProperty({
    description: 'Task order in list',
    example: 2,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  order?: number;
}

// DTO for filtering tasks
export class TaskFiltersDto {
  @ApiProperty({
    description: 'Filter by status',
    example: TaskStatus.TODO,
    enum: TaskStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid task status' })
  status?: TaskStatus;

  @ApiProperty({
    description: 'Filter by tag',
    example: 'work',
    required: false
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiProperty({
    description: 'Due date from (ISO string)',
    example: '2023-01-01T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due from must be a valid ISO date string' })
  dueFrom?: string;

  @ApiProperty({
    description: 'Due date to (ISO string)',
    example: '2023-12-31T23:59:59.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Due to must be a valid ISO date string' })
  dueTo?: string;

  @ApiProperty({
    description: 'Search in title, description or long description',
    example: 'report',
    required: false
  })
  @IsOptional()
  @IsString()
  q?: string;
}
