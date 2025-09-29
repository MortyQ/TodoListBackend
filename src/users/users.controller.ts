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
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiQuery({ name: 'q', required: false, description: 'Search by email' })
  @ApiResponse({
    status: 200,
    description: 'Users list with pagination'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - admin role required'
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
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserProfileDto
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Change user role (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User role changed',
    type: UserProfileDto
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot change your own role'
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
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User deleted'
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete your own account'
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
  @ApiOperation({ summary: 'Get own profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: UserProfileDto
  })
  async getProfile(@Req() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    type: UserProfileDto
  })
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() req: any,
  ) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }
}
