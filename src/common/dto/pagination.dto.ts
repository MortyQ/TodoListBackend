import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum CommonSortFields {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

// Специальный enum для сортировки задач с дополнительными полями
export enum TaskSortFields {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DUE_DATE = 'dueDate',
  PRIORITY = 'priority',
  ORDER = 'order',
}

export class PaginationDto {
  @ApiProperty({
    description: 'Количество записей для получения',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Смещение от начала (для пагинации)',
    example: 0,
    minimum: 0,
    maximum: 10000,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  @Max(10000)
  offset?: number = 0;

  @ApiProperty({
    description: 'Поле для сортировки',
    example: 'createdAt',
    enum: CommonSortFields,
    required: false
  })
  @IsOptional()
  @IsEnum(CommonSortFields)
  sort?: CommonSortFields = CommonSortFields.CREATED_AT;

  @ApiProperty({
    description: 'Порядок сортировки',
    example: 'desc',
    enum: SortOrder,
    required: false
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}

// Специальный DTO для пагинации задач с расширенными полями сортировки
export class TaskPaginationDto {
  @ApiProperty({
    description: 'Количество записей для получения',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Смещение от начала (для пагинации)',
    example: 0,
    minimum: 0,
    maximum: 10000,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  @Max(10000)
  offset?: number = 0;

  @ApiProperty({
    description: 'Поле для сортировки задач',
    example: 'createdAt',
    enum: TaskSortFields,
    required: false
  })
  @IsOptional()
  @IsEnum(TaskSortFields)
  sort?: TaskSortFields = TaskSortFields.CREATED_AT;

  @ApiProperty({
    description: 'Порядок сортировки',
    example: 'desc',
    enum: SortOrder,
    required: false
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;
}
