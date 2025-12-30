import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdateUserRoleDto, UpdateUserPermissionsDto, UserProfileDto } from './dto/user.dto';
import { UserPaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constants';
import { UserRole } from './schemas/user.schema';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard) // все эндпоинты требуют авторизации
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Админские эндпоинты для управления пользователями
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users (admin only)',
    description: `
Retrieve paginated list of all users with sorting and search capabilities.

**Sorting options:**
- \`createdAt\` - Sort by registration date
- \`updatedAt\` - Sort by last update date  
- \`email\` - Sort alphabetically by email
- \`name\` - Sort alphabetically by name
- \`role\` - Sort by user role (admin/user)

**Example requests:**
- \`GET /users?sort=email&order=asc\` - Users sorted by email A-Z
- \`GET /users?sort=createdAt&order=desc&limit=10\` - 10 newest users
- \`GET /users?q=gmail&sort=name&order=asc\` - Search gmail users, sorted by name
    `
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of records (1-100)',
    example: 20,
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset for pagination',
    example: 0,
    schema: { type: 'integer', minimum: 0, maximum: 10000, default: 0 }
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Field to sort by',
    example: 'createdAt',
    schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'email', 'name', 'role'], default: 'createdAt' }
  })
  @ApiQuery({
    name: 'order',
    required: false,
    description: 'Sort direction',
    example: 'desc',
    schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search by email (case-insensitive)',
    example: 'gmail'
  })
  @ApiResponse({
    status: 200,
    description: 'Users list with pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              email: { type: 'string', example: 'user@example.com' },
              name: { type: 'string', example: 'John Doe' },
              role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
              permissions: { type: 'array', items: { type: 'string' }, example: ['read:dashboard', 'create:list'] },
              isAdmin: { type: 'boolean', example: false },
              createdAt: { type: 'string', format: 'date-time', example: '2024-12-01T10:00:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2024-12-20T15:30:00.000Z' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 100, description: 'Total number of records' },
            limit: { type: 'integer', example: 20, description: 'Records per page' },
            offset: { type: 'integer', example: 0, description: 'Current offset' },
            hasMore: { type: 'boolean', example: true, description: 'Whether more records exist' },
            currentPage: { type: 'integer', example: 1, description: 'Current page number' },
            totalPages: { type: 'integer', example: 5, description: 'Total number of pages' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - admin role required'
  })
  async findAll(
    @Query() paginationDto: UserPaginationDto,
  ) {
    return this.usersService.findAll(paginationDto);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission(PERMISSIONS.READ_USERS)
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
  @RequirePermission(PERMISSIONS.MANAGE_ROLES)
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

  @Patch(':id/permissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission(PERMISSIONS.MANAGE_PERMISSIONS)
  @ApiOperation({ summary: 'Update user permissions (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User permissions updated',
    type: UserProfileDto
  })
  @ApiResponse({
    status: 404,
    description: 'User not found'
  })
  async updatePermissions(
    @Param('id') id: string,
    @Body() updatePermissionsDto: UpdateUserPermissionsDto,
  ) {
    return this.usersService.updatePermissions(id, updatePermissionsDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @RequirePermission(PERMISSIONS.DELETE_USER)
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
