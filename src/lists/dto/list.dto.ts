import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional, IsDateString } from 'class-validator';

// DTO для создания нового списка
export class CreateListDto {
  @ApiProperty({
    description: 'List title',
    example: 'Work tasks',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @Length(1, 100, { message: 'List title must be between 1 and 100 characters' })
  title: string;

  @ApiProperty({
    description: 'List deadline (ISO string)',
    example: '2023-12-31T23:59:59.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Deadline must be a valid ISO date string' })
  deadline?: string;

  @ApiProperty({
    description: 'List color in HEX format',
    example: '#FF5733',
    required: false
  })
  @IsOptional()
  @IsString()
  hexColor?: string;
}

// DTO для обновления списка
export class UpdateListDto {
  @ApiProperty({
    description: 'List title',
    example: 'Updated work tasks',
    required: false,
    minLength: 1,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'List title must be between 1 and 100 characters' })
  title?: string;

  @ApiProperty({
    description: 'List deadline (ISO string)',
    example: '2023-12-31T23:59:59.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'Deadline must be a valid ISO date string' })
  deadline?: string;

  @ApiProperty({
    description: 'List color in HEX format',
    example: '#FF5733',
    required: false
  })
  @IsOptional()
  @IsString()
  hexColor?: string;
}

// DTO для ответа со списком
export class ListResponseDto {
  @ApiProperty({
    description: 'List ID',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'List title',
    example: 'Work tasks'
  })
  title: string;

  @ApiProperty({
    description: 'List owner ID',
    example: '507f1f77bcf86cd799439012'
  })
  ownerId: string;

  @ApiProperty({
    description: 'List deadline',
    example: '2023-12-31T23:59:59.000Z',
    required: false
  })
  deadline?: Date;

  @ApiProperty({
    description: 'List color in HEX format',
    example: '#FF5733',
    required: false
  })
  hexColor?: string;

  @ApiProperty({
    description: 'Creation date',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-01-01T00:00:00.000Z'
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Total number of tasks in the list',
    example: 10
  })
  totalTasks: number;

  @ApiProperty({
    description: 'Number of completed tasks in the list',
    example: 5
  })
  completedTasks: number;

  @ApiProperty({
    description: 'Simplified tasks list',
    example: [{ id: '507f1f77bcf86cd799439011', title: 'Buy milk', status: 'todo' }],
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string' }
      }
    }
  })
  tasks?: {
    id: string;
    title: string;
    status: string;
  }[];
}
