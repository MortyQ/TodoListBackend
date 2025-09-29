import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional } from 'class-validator';

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
    description: 'Creation date',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}
