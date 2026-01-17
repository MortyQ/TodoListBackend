import { ApiProperty } from '@nestjs/swagger';
import {IsOptional, IsInt, Min, Max, IsIn, IsString, IsEnum} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../users/schemas/user.schema';

// ===== ENUMS =====

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

// ===== BASE PAGINATION =====

/**
 * Базовый DTO для пагинации
 * Содержит только limit и offset, без сортировки
 */
export class BasePaginationDto {
  @ApiProperty({
    description: 'Number of records to retrieve',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
    default: 20
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Offset from the beginning (for pagination)',
    example: 0,
    minimum: 0,
    maximum: 10000,
    required: false,
    default: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  @Max(10000)
  offset?: number = 0;

  @ApiProperty({
    description: 'Sort order',
    example: 'desc',
    enum: SortOrder,
    required: false,
    default: 'desc'
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: SortOrder = SortOrder.DESC;

  @ApiProperty({
      description: 'Search query (e.g. email, name, title)',
      required: false,
      example: 'gmail'
  })
  @IsOptional()
  @IsString()
  q?: string;
}

// ===== USER PAGINATION =====

export const UserSortFields = ['createdAt', 'updatedAt', 'email', 'name', 'role'] as const;
export type UserSortField = typeof UserSortFields[number];

export class UserPaginationDto extends BasePaginationDto {
  @ApiProperty({
    description: 'Field to sort users by',
    example: 'createdAt',
    enum: UserSortFields,
    required: false,
    default: 'createdAt'
  })
  @IsOptional()
  @IsIn(UserSortFields)
  sort?: UserSortField = 'createdAt';

  @ApiProperty({
    description: 'Filter by user role',
    example: UserRole.USER,
    enum: UserRole,
    required: false
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

// ===== LIST PAGINATION =====

export const ListSortFields = ['createdAt', 'updatedAt', 'title', 'deadline'] as const;
export type ListSortField = typeof ListSortFields[number];

export class ListPaginationDto extends BasePaginationDto {
  @ApiProperty({
    description: 'Field to sort lists by',
    example: 'createdAt',
    enum: ListSortFields,
    required: false,
    default: 'createdAt'
  })
  @IsOptional()
  @IsIn(ListSortFields)
  sort?: ListSortField = 'createdAt';

  @ApiProperty({
    description: 'Filter by ownership (only for admins). If true, shows only current user\'s lists. If false or not set, shows all lists (admin) or own lists (regular user)',
    example: true,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isOwn?: boolean;
}

// ===== TASK PAGINATION =====

export const TaskSortFields = ['createdAt', 'updatedAt', 'dueDate', 'deadline', 'priority', 'order', 'title', 'status'] as const;
export type TaskSortField = typeof TaskSortFields[number];

export class TaskPaginationDto extends BasePaginationDto {
  @ApiProperty({
    description: 'Field to sort tasks by',
    example: 'createdAt',
    enum: TaskSortFields,
    required: false,
    default: 'createdAt'
  })
  @IsOptional()
  @IsIn(TaskSortFields)
  sort?: TaskSortField = 'createdAt';
}

// ===== LEGACY SUPPORT (backward compatibility) =====

export enum CommonSortFields {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

/**
 * @deprecated Use UserPaginationDto, ListPaginationDto, or TaskPaginationDto instead
 */
export class PaginationDto extends BasePaginationDto {
  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
    enum: CommonSortFields,
    required: false
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt'])
  sort?: string = 'createdAt';
}

// ===== PAGINATION RESPONSE =====

/**
 * Стандартный интерфейс для ответа с пагинацией
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  // Дополнительные поля для удобства фронта
  currentPage?: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Хелпер для создания мета-информации пагинации
 */
export function createPaginationMeta(total: number, limit: number, offset: number): PaginationMeta {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
    currentPage,
    totalPages,
  };
}
