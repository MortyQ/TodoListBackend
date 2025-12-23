import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto, ListResponseDto } from './dto/list.dto';
import { ListPaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constants';

@ApiTags('Lists')
@Controller('lists')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Применяем JWT и Permissions guards
@ApiBearerAuth()
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
  @RequirePermission(PERMISSIONS.CREATE_LIST)
  @ApiOperation({ summary: 'Create new list' })
  @ApiResponse({
    status: 201,
    description: 'List successfully created',
    type: ListResponseDto
  })
  async create(@Body() createListDto: CreateListDto, @Req() req: any) {
    return this.listsService.create(createListDto, req.user.id);
  }

  @Get()
  @RequirePermission(PERMISSIONS.READ_LIST)
  @ApiOperation({
    summary: 'Get all user lists',
    description: `
Retrieve paginated list of todo lists with sorting capabilities.
Regular users see only their lists, admins see all lists.

**Sorting options:**
- \`createdAt\` - Sort by creation date
- \`updatedAt\` - Sort by last update date  
- \`title\` - Sort alphabetically by title
- \`deadline\` - Sort by deadline date

**Example requests:**
- \`GET /lists?sort=title&order=asc\` - Lists sorted by title A-Z
- \`GET /lists?sort=deadline&order=asc\` - Lists with nearest deadlines first
- \`GET /lists?sort=createdAt&order=desc&limit=5\` - 5 most recent lists
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
    schema: { type: 'string', enum: ['createdAt', 'updatedAt', 'title', 'deadline'], default: 'createdAt' }
  })
  @ApiQuery({
    name: 'order',
    required: false,
    description: 'Sort direction',
    example: 'desc',
    schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' }
  })
  @ApiResponse({
    status: 200,
    description: 'Lists with pagination',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              title: { type: 'string', example: 'Work Tasks' },
              deadline: { type: 'string', format: 'date-time', example: '2024-12-31T23:59:59.000Z', nullable: true },
              ownerId: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  email: { type: 'string', example: 'user@example.com' },
                  name: { type: 'string', example: 'John Doe' }
                }
              },
              createdAt: { type: 'string', format: 'date-time', example: '2024-12-01T10:00:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2024-12-20T15:30:00.000Z' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 25, description: 'Total number of lists' },
            limit: { type: 'integer', example: 20, description: 'Records per page' },
            offset: { type: 'integer', example: 0, description: 'Current offset' },
            hasMore: { type: 'boolean', example: true, description: 'Whether more records exist' },
            currentPage: { type: 'integer', example: 1, description: 'Current page number' },
            totalPages: { type: 'integer', example: 2, description: 'Total number of pages' }
          }
        }
      }
    }
  })
  async findAll(@Query() paginationDto: ListPaginationDto, @Req() req: any) {
    return this.listsService.findAll(req.user.id, req.user.role, paginationDto);
  }

  @Get(':listId')
  @RequirePermission(PERMISSIONS.READ_LIST)
  @ApiOperation({ summary: 'Get specific list' })
  @ApiResponse({
    status: 200,
    description: 'List details',
    type: ListResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'List not found'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - not your list'
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.listsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':listId')
  @RequirePermission(PERMISSIONS.UPDATE_LIST)
  @ApiOperation({ summary: 'Update list' })
  @ApiResponse({
    status: 200,
    description: 'List successfully updated',
    type: ListResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'List not found'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - not your list'
  })
  async update(
    @Param('listId') id: string,
    @Body() updateListDto: UpdateListDto,
    @Req() req: any,
  ) {
    return this.listsService.update(id, updateListDto, req.user.id, req.user.role);
  }

  @Delete(':listId')
  @RequirePermission(PERMISSIONS.DELETE_LIST)
  @ApiOperation({ summary: 'Delete list and all its tasks' })
  @ApiResponse({
    status: 200,
    description: 'List and tasks successfully deleted'
  })
  @ApiResponse({
    status: 404,
    description: 'List not found'
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - not your list'
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.listsService.remove(id, req.user.id, req.user.role);
    return { message: 'List and all its tasks deleted successfully' };
  }
}
