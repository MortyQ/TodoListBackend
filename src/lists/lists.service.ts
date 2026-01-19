import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { List } from './schemas/list.schema';
import { Task, TaskStatus } from '../tasks/schemas/task.schema';
import { CreateListDto, UpdateListDto } from './dto/list.dto';
import { ListPaginationDto, createPaginationMeta } from '../common/dto/pagination.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class ListsService {
  constructor(
    @InjectModel(List.name) private listModel: Model<List>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
  ) {}

  // Helper to enrich lists with task counts
  private async enrichListsWithTaskCounts(lists: List[]): Promise<any[]> {
    if (!lists.length) return [];

    // Преобразуем все ID в ObjectId для правильного сравнения в MongoDB
    // Важно: получаем _id ДО вызова toObject/toJSON, так как toJSON удаляет _id
    const listIdsMap = new Map<string, any>();
    lists.forEach(list => {
      const id = list._id || list.id;
      const idStr = id.toString();
      listIdsMap.set(idStr, list);
    });

    const listIds = Array.from(listIdsMap.keys()).map(id => new Types.ObjectId(id));

    const taskStats = await this.taskModel.aggregate([
      {
        $match: {
          listId: { $in: listIds },
          deletedAt: null
        }
      },
      { $sort: { order: 1, createdAt: -1 } },
      {
        $group: {
          _id: '$listId',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', TaskStatus.DONE] }, 1, 0]
            }
          },
          tasks: {
            $push: {
              id: '$_id',
              title: '$title',
              status: '$status'
            }
          }
        }
      }
    ]);

    // Создаем Map для быстрого доступа к статистике по ID списка
    const statsMap = new Map(taskStats.map(s => [s._id.toString(), s]));

    return Array.from(listIdsMap.entries()).map(([listIdStr, list]) => {
      const listObj = list.toObject ? list.toObject() : list;
      const stats = statsMap.get(listIdStr) || { total: 0, completed: 0, tasks: [] };


      return {
        ...listObj,
        id: listIdStr, // Добавляем id обратно, так как toJSON его удаляет
        totalTasks: stats.total,
        completedTasks: stats.completed,
        tasks: stats.tasks || [],
      };
    });
  }

  // Создание нового списка
  async create(createListDto: CreateListDto, ownerId: string): Promise<any> {
    const list = new this.listModel({
      ...createListDto,
      ownerId,
      deadline: createListDto.deadline ? new Date(createListDto.deadline) : undefined,
    });

    const savedList = await list.save();
    return {
      ...savedList.toObject(),
      totalTasks: 0,
      completedTasks: 0
    };
  }

  // Получение всех списков пользователя с пагинацией
  async findAll(userId: string, userRole: string, paginationDto: ListPaginationDto) {
    const { limit, offset, sort, order, q, isOwn } = paginationDto;

    // Строим фильтр:
    // - Обычный пользователь всегда видит только свои списки
    // - Админ видит все списки, но может фильтровать по isOwn:
    //   * isOwn = true -> только свои
    //   * isOwn = false или undefined -> все листы
    let filter: any = {};

    if (userRole === UserRole.ADMIN) {
      // Админ: если isOwn = true, показываем только его листы
      if (isOwn === true) {
        filter.ownerId = userId;
      }
      // Если isOwn = false или не задан, показываем все листы (фильтр остается пустым)
    } else {
      // Обычный пользователь всегда видит только свои
      filter.ownerId = userId;
    }

    // Добавляем поиск по названию
    if (q) {
      filter.title = { $regex: q, $options: 'i' };
    }

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

    const enrichedLists = await this.enrichListsWithTaskCounts(lists);

    return {
      data: enrichedLists,
      pagination: createPaginationMeta(total, limit, offset),
    };
  }

  // Получение конкретного списка
  async findOne(id: string, userId: string, userRole: string): Promise<any> {
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

    const [enrichedList] = await this.enrichListsWithTaskCounts([list]);
    return enrichedList;
  }

  // Обновление списка
  async update(id: string, updateListDto: UpdateListDto, userId: string, userRole: string): Promise<any> {
    const list = await this.listModel.findById(id);

    if (!list) {
      throw new NotFoundException('List not found');
    }

    // Проверяем доступ: админ может редактировать все, пользователь - только свои
    if (userRole !== UserRole.ADMIN && list.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own lists');
    }

    // Подготавливаем данные для обновления
    const updateData: any = { ...updateListDto };

    // Преобразуем deadline в Date объект если передан
    if (updateListDto.deadline) {
      updateData.deadline = new Date(updateListDto.deadline);
    }

    const updatedList = await this.listModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    ).populate('ownerId', 'email name');

    const [enrichedList] = await this.enrichListsWithTaskCounts([updatedList]);
    return enrichedList;
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
