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
  @ApiOperation({ summary: 'Создание нового списка' })
  @ApiResponse({
    status: 201,
    description: 'Список успешно создан',
    type: ListResponseDto
  })
  async create(@Body() createListDto: CreateListDto, @Req() req: any) {
    return this.listsService.create(createListDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Получение всех списков пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Список всех списков пользователя с пагинацией'
  })
  async findAll(@Query() paginationDto: PaginationDto, @Req() req: any) {
    return this.listsService.findAll(req.user.id, req.user.role, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получение конкретного списка' })
  @ApiResponse({
    status: 200,
    description: 'Детали списка',
    type: ListResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Список не найден'
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - не ваш список'
  })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.listsService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновление списка' })
  @ApiResponse({
    status: 200,
    description: 'Список успешно обновлен',
    type: ListResponseDto
  })
  @ApiResponse({
    status: 404,
    description: 'Список не найден'
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - не ваш список'
  })
  async update(
    @Param('id') id: string,
    @Body() updateListDto: UpdateListDto,
    @Req() req: any,
  ) {
    return this.listsService.update(id, updateListDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удаление списка и всех его задач' })
  @ApiResponse({
    status: 200,
    description: 'Список и задачи успешно удалены'
  })
  @ApiResponse({
    status: 404,
    description: 'Список не найден'
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен - не ваш список'
  })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.listsService.remove(id, req.user.id, req.user.role);
    return { message: 'List and all its tasks deleted successfully' };
  }
}
