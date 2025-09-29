import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateUserRoleDto, UserProfileDto } from './dto/user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { UserRole } from './schemas/user.schema';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard) // все эндпоинты требуют авторизации
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Админские эндпоинты для управления пользователями
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Получение всех пользователей (только админ)' })
  @ApiQuery({ name: 'q', required: false, description: 'Поиск по email' })
  @ApiResponse({
    status: 200,
    description: 'Список пользователей с пагинацией'
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - требуется роль admin'
  })
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query('q') searchQuery?: string,
  ) {
    return this.usersService.findAll(paginationDto, searchQuery);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Получение пользователя по ID (только админ)' })
  @ApiResponse({
    status: 200,
    description: 'Профиль пользователя',
    type: UserProfileDto
  })
  @ApiResponse({
    status: 404,
    description: 'Пользователь не найден'
  })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Изменение роли пользователя (только админ)' })
  @ApiResponse({
    status: 200,
    description: 'Роль пользователя изменена',
    type: UserProfileDto
  })
  @ApiResponse({
    status: 403,
    description: 'Нельзя изменить свою роль'
  })
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Req() req: any,
  ) {
    return this.usersService.updateRole(id, req.user.id, updateRoleDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Удаление пользователя (только админ)' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь удален'
  })
  @ApiResponse({
    status: 403,
    description: 'Нельзя удалить свой аккаунт'
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.usersService.remove(id, req.user.id);
    return { message: 'User deleted successfully' };
  }
}

// Отдельный контроллер для личного профиля
@ApiTags('Profile')
@Controller('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Получение своего профиля' })
  @ApiResponse({
    status: 200,
    description: 'Профиль текущего пользователя',
    type: UserProfileDto
  })
  async getProfile(@Req() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Обновление своего профиля' })
  @ApiResponse({
    status: 200,
    description: 'Профиль обновлен',
    type: UserProfileDto
  })
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() req: any,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }
}
