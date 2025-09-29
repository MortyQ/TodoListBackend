import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ListsService } from './lists.service';
import { CreateListDto, UpdateListDto, ListResponseDto } from './dto/list.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Lists')
@Controller('lists')
@UseGuards(JwtAuthGuard) // все эндпоинты требуют авторизации
@ApiBearerAuth()
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post()
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
  @ApiOperation({ summary: 'Get all user lists' })
  @ApiResponse({
    status: 200,
    description: 'User lists with pagination'
  })
  async findAll(@Query() paginationDto: PaginationDto, @Req() req: any) {
    return this.listsService.findAll(req.user.id, req.user.role, paginationDto);
  }

  @Get(':id')
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

  @Patch(':id')
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
    @Param('id') id: string,
    @Body() updateListDto: UpdateListDto,
    @Req() req: any,
  ) {
    return this.listsService.update(id, updateListDto, req.user.id, req.user.role);
  }

  @Delete(':id')
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
