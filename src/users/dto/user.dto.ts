import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../schemas/user.schema';

// DTO для обновления профиля пользователя (самим пользователем)
export class UpdateProfileDto {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'John Doe Updated',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;
}

// DTO для изменения роли пользователя (только админом)
export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'Новая роль пользователя',
    example: UserRole.ADMIN,
    enum: UserRole
  })
  @IsEnum(UserRole, { message: 'Role must be either user or admin' })
  role: UserRole;
}

// DTO для получения профиля пользователя (ответ)
export class UserProfileDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: '507f1f77bcf86cd799439011'
  })
  id: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'John Doe',
    required: false
  })
  name?: string;

  @ApiProperty({
    description: 'Роль пользователя',
    example: UserRole.USER,
    enum: UserRole
  })
  role: UserRole;

  @ApiProperty({
    description: 'Дата создания аккаунта',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt: Date;
}
