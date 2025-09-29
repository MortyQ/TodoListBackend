import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { List } from './schemas/list.schema';
import { Task } from '../tasks/schemas/task.schema';
import { CreateListDto, UpdateListDto } from './dto/list.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class ListsService {
  constructor(
    @InjectModel(List.name) private listModel: Model<List>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {}

  // Создание нового списка
  async create(createListDto: CreateListDto, ownerId: string): Promise<List> {
    const list = new this.listModel({
      ...createListDto,
      ownerId,
    });

    return list.save();
  }

  // Получение всех списков пользователя с пагинацией
  async findAll(userId: string, userRole: string, paginationDto: PaginationDto) {
    const { limit, offset, sort, order } = paginationDto;

    // Строим фильтр: админ видит все списки, обычный пользователь - только свои
    const filter: any = userRole === UserRole.ADMIN ? {} : { ownerId: userId };

    // Строим сортировку
    const sortOption: any = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    // Выполняем запросы параллельно
    const [lists, total] = await Promise.all([
      this.listModel
        .find(filter)
        .sort(sortOption)
        .skip(offset)
        .limit(limit)
        .populate('ownerId', 'email name') // подгружаем информацию о владельце
        .exec(),
      this.listModel.countDocuments(filter),
    ]);

    return {
      data: lists,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  // Получение конкретного списка
  async findOne(id: string, userId: string, userRole: string): Promise<List> {
    const list = await this.listModel
      .findById(id)
      .populate('ownerId', 'email name');

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Проверяем доступ: админ может видеть все, пользователь - только свои
    if (userRole !== UserRole.ADMIN && list.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only access your own lists');
    }

    return list;
  }

  // Обновление списка
  async update(id: string, updateListDto: UpdateListDto, userId: string, userRole: string): Promise<List> {
    const list = await this.listModel.findById(id);

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Проверяем доступ: админ может редактировать все, пользователь - только свои
    if (userRole !== UserRole.ADMIN && list.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own lists');
    }

    const updatedList = await this.listModel.findByIdAndUpdate(
      id,
      updateListDto,
      { new: true },
    ).populate('ownerId', 'email name');

    return updatedList;
  }

  // Удаление списка
  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const list = await this.listModel.findById(id);

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Проверяем доступ
    if (userRole !== UserRole.ADMIN && list.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own lists');
    }

    // Удаляем список и все связанные задачи (hard delete для простоты)
    await Promise.all([
      this.listModel.findByIdAndDelete(id),
      this.taskModel.deleteMany({ listId: id }),
    ]);
  }

  // Проверка, принадлежит ли список пользователю (для внутренних нужд)
  async checkOwnership(listId: string, userId: string, userRole: string): Promise<boolean> {
    if (userRole === UserRole.ADMIN) {
      return true; // админ имеет доступ ко всем спискам
    }

    const list = await this.listModel.findById(listId);
    return list && list.ownerId.toString() === userId;
  }
}
