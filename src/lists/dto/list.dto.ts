import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsOptional } from 'class-validator';

// DTO для создания нового списка
export class CreateListDto {
  @ApiProperty({
    description: 'Название списка',
    example: 'Рабочие задачи',
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
    description: 'Название списка',
    example: 'Обновленные рабочие задачи',
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
    description: 'ID списка',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'Название списка',
    example: 'Рабочие задачи'
  })
  title: string;

  @ApiProperty({
    description: 'ID владельца списка',
    example: '507f1f77bcf86cd799439012'
  })
  ownerId: string;

  @ApiProperty({
    description: 'Дата создания',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления',
    example: '2023-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}
