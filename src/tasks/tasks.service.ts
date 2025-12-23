import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskStatus } from './schemas/task.schema';
import { List } from '../lists/schemas/list.schema';
import { CreateTaskDto, UpdateTaskDto, TaskFiltersDto } from './dto/task.dto';
import { TaskPaginationDto, createPaginationMeta } from '../common/dto/pagination.dto';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(List.name) private listModel: Model<List>,
  ) {}

  // Создание новой задачи в списке
  async create(listId: string, createTaskDto: CreateTaskDto, userId: string, userRole: string): Promise<Task> {
    // Проверяем, что список существует и пользователь имеет к нему доступ
    const list = await this.listModel.findById(listId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (userRole !== UserRole.ADMIN && list.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only create tasks in your own lists');
    }

    // Если order не указан, устанавливаем следующий по порядку
    let order = createTaskDto.order;
    if (!order) {
      const lastTask = await this.taskModel
        .findOne({ listId, deletedAt: null })
        .sort({ order: -1 });
      order = lastTask ? lastTask.order + 1 : 1;
    }

    const task = new this.taskModel({
      ...createTaskDto,
      listId,
      order,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : undefined,
      deadline: createTaskDto.deadline ? new Date(createTaskDto.deadline) : undefined,
    });

    return task.save();
  }

  // Получение задач в списке с фильтрами и пагинацией
  async findAllInList(
    listId: string,
    userId: string,
    userRole: string,
    paginationDto: TaskPaginationDto,
    filtersDto: TaskFiltersDto,
  ) {
    // Проверяем доступ к списку
    const list = await this.listModel.findById(listId);
    if (!list) {
      throw new NotFoundException('List not found');
    }

    if (userRole !== UserRole.ADMIN && list.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only access tasks from your own lists');
    }

    const { limit, offset, sort, order } = paginationDto;
    const { status, tag, dueFrom, dueTo, q, isStarred } = filtersDto;

    // Строим фильтр для поиска
    const filter: any = {
      listId,
      deletedAt: null, // не показываем мягко удаленные задачи
    };

    // Применяем фильтры
    if (status) {
      filter.status = status;
    }

    if (tag) {
      filter.tags = { $in: [tag] }; // задача содержит данный тег
    }

    if (typeof isStarred === 'boolean') {
      filter.isStarred = isStarred; // фильтр по важным задачам
    }

    if (dueFrom || dueTo) {
      filter.dueDate = {};
      if (dueFrom) {
        filter.dueDate.$gte = new Date(dueFrom);
      }
      if (dueTo) {
        filter.dueDate.$lte = new Date(dueTo);
      }
    }

    if (q) {
      // Поиск по названию, описанию или расширенному описанию
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { longDescription: { $regex: q, $options: 'i' } },
      ];
    }

    // Обычная сортировка для всех полей включая приоритет
    const sortOption: any = {};

    if (sort === 'priority') {
      // Для приоритета используем простую строковую сортировку
      // high будет первым, затем medium, затем low (алфавитная сортировка)
      sortOption.priority = order === 'asc' ? 1 : -1;
      // Добавляем вторичную сортировку по дате создания
      sortOption.createdAt = -1;
    } else {
      sortOption[sort] = order === 'asc' ? 1 : -1;
    }

    const [tasks, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .sort(sortOption)
        .skip(offset)
        .limit(limit)
        .exec(),
      this.taskModel.countDocuments(filter),
    ]);

    return {
      data: tasks,
      pagination: createPaginationMeta(total, limit, offset),
    };
  }

  // Получение конкретной задачи
  async findOne(taskId: string, userId: string, userRole: string): Promise<Task> {
    const task = await this.taskModel
      .findOne({ _id: taskId, deletedAt: null })
      .populate({
        path: 'listId',
        populate: { path: 'ownerId', select: 'email name' },
      });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Проверяем доступ через владельца списка
    const list = task.listId as any;
    if (userRole !== UserRole.ADMIN && list.ownerId._id.toString() !== userId) {
      throw new ForbiddenException('You can only access tasks from your own lists');
    }

    return task;
  }

  // Обновление задачи
  async update(taskId: string, updateTaskDto: UpdateTaskDto, userId: string, userRole: string): Promise<Task> {
    const task = await this.taskModel
      .findOne({ _id: taskId, deletedAt: null })
      .populate('listId');

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Проверяем доступ
    const list = task.listId as any;
    if (userRole !== UserRole.ADMIN && list.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update tasks from your own lists');
    }

    // Подготавливаем данные для обновления
    const updateData: any = { ...updateTaskDto };

    // Обрабатываем изменение статуса
    if (updateTaskDto.status) {
      if (updateTaskDto.status === TaskStatus.DONE) {
        updateData.completedAt = new Date(); // устанавливаем время завершения
      } else {
        updateData.completedAt = null; // сбрасываем время завершения
      }
    }

    // Преобразуем dueDate в Date объект если передан
    if (updateTaskDto.dueDate) {
      updateData.dueDate = new Date(updateTaskDto.dueDate);
    }

    // Преобразуем deadline в Date объект если передан
    if (updateTaskDto.deadline) {
      updateData.deadline = new Date(updateTaskDto.deadline);
    }

    const updatedTask = await this.taskModel.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true },
    ).populate('listId');

    return updatedTask;
  }

  // Помечаем задачу как завершенную (удобный метод)
  async complete(taskId: string, userId: string, userRole: string): Promise<Task> {
    return this.update(taskId, { status: TaskStatus.DONE }, userId, userRole);
  }

  // Мягкое удаление задачи
  async remove(taskId: string, userId: string, userRole: string): Promise<void> {
    const task = await this.taskModel
      .findOne({ _id: taskId, deletedAt: null })
      .populate('listId');

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Проверяем доступ
    const list = task.listId as any;
    if (userRole !== UserRole.ADMIN && list.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete tasks from your own lists');
    }

    // Мягкое удаление - помечаем deletedAt
    await this.taskModel.findByIdAndUpdate(taskId, {
      deletedAt: new Date(),
    });
  }

  // Получение важных (starred) задач из всех списков пользователя
  async getStarredTasks(userId: string, userRole: string, limit: number = 10) {
    // Получаем все списки пользователя
    const userLists = await this.listModel.find(
      userRole === UserRole.ADMIN ? {} : { ownerId: userId }
    ).select('_id');

    const listIds = userLists.map(list => list._id);

    // Ищем важные задачи из этих списков
    const starredTasks = await this.taskModel
      .find({
        listId: { $in: listIds },
        isStarred: true,
        deletedAt: null,
      })
      .populate('listId', 'title')
      .sort({ priority: -1, deadline: 1, createdAt: -1 }) // сортируем по приоритету, дедлайну и дате создания
      .limit(limit)
      .exec();

    return {
      data: starredTasks,
      total: starredTasks.length,
    };
  }

  // Переключение статуса isStarred для задачи
  async toggleStar(taskId: string, userId: string, userRole: string): Promise<Task> {
    const task = await this.taskModel
      .findOne({ _id: taskId, deletedAt: null })
      .populate('listId');

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Проверяем доступ
    const list = task.listId as any;
    if (userRole !== UserRole.ADMIN && list.ownerId.toString() !== userId) {
      throw new ForbiddenException('You can only update tasks from your own lists');
    }

    // Переключаем статус
    const updatedTask = await this.taskModel.findByIdAndUpdate(
      taskId,
      { isStarred: !task.isStarred },
      { new: true },
    ).populate('listId');

    return updatedTask;
  }
}
