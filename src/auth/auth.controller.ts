import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto, LoginResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/schemas/user.schema';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
    type: User
  })
  @ApiResponse({
    status: 409,
    description: 'Пользователь с таким email уже существует'
  })
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Вход в систему' })
  @ApiResponse({
    status: 200,
    description: 'Успешный вход в систему',
    type: LoginResponseDto
  })
  @ApiResponse({
    status: 401,
    description: 'Неверный email или пароль'
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard) // Требуется авторизация
  @ApiBearerAuth() // Указываем, что нужен Bearer token в Swagger
  @ApiOperation({ summary: 'Получение профиля текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя',
    type: User
  })
  @ApiResponse({
    status: 401,
    description: 'Не авторизован'
  })
  async getProfile(@Req() req: any): Promise<User> {
    // req.user устанавливается JWT Guard'ом после проверки токена
    return this.authService.getProfile(req.user.id);
  }
}
