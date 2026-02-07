import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

// DTO для регистрации нового пользователя
export class CreateUserDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters)',
    example: 'SecurePass123',
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: 'User name (optional)',
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
    description: 'User email',
    example: 'user@example.com'
  })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123'
  })
  @IsString()
  password: string;
}

// DTO для ответа при успешном логине
export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for authorization (short-lived)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for obtaining new access tokens (long-lived)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;
}

// DTO для обновления токенов
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token obtained from login',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  refreshToken: string;
}

// DTO для ответа при обновлении токенов
export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  accessToken: string;

  @ApiProperty({
    description: 'New JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refreshToken: string;
}
