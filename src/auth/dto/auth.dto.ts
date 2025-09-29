import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

// DTO для регистрации нового пользователя
export class CreateUserDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @ApiProperty({
    description: 'Пароль (минимум 8 символов)',
    example: 'SecurePass123',
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'Имя пользователя (опционально)',
    example: 'John Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;
}

// DTO для входа в систему
export class LoginDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'SecurePass123'
  })
  @IsString()
  password: string;
}

// DTO для ответа при успешном логине
export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT токен для авторизации',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;
}
