import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskStatus } from '../tasks/schemas/task.schema';
import { List } from '../lists/schemas/list.schema';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(List.name) private listModel: Model<List>,
  ) {}

  async getSummary(userId: string, userRole: string) {
    // Если админ - считаем по всем, если юзер - только по его спискам
    // Но задачи привязаны к спискам, а списки к юзерам.
    // Поэтому для юзера нужно сначала найти его списки, а потом задачи в этих списках.

    let listFilter: any = {};
    let taskFilter: any = { deletedAt: null };

    if (userRole !== UserRole.ADMIN) {
      listFilter = { ownerId: userId };
      // Находим ID списков пользователя
      const userLists = await this.listModel.find({ ownerId: userId }).select('_id');
      const listIds = userLists.map(list => list._id);
      taskFilter.listId = { $in: listIds };
    }

    const [
      totalLists,
      totalTasks,
      completedTasks,
      archivedTasks,
      todoTasks,
      inProgressTasks
    ] = await Promise.all([
      this.listModel.countDocuments(listFilter),
      this.taskModel.countDocuments(taskFilter),
      this.taskModel.countDocuments({ ...taskFilter, status: TaskStatus.DONE }),
      this.taskModel.countDocuments({ ...taskFilter, status: TaskStatus.ARCHIVED }),
      this.taskModel.countDocuments({ ...taskFilter, status: TaskStatus.TODO }),
      this.taskModel.countDocuments({ ...taskFilter, status: TaskStatus.IN_PROGRESS }),
    ]);

    return {
      lists: {
        total: totalLists
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        archived: archivedTasks,
        todo: todoTasks,
        inProgress: inProgressTasks
      }
    };
  }

  async getPopularTags(userId: string, userRole: string, limit: number = 10) {
    let matchStage: any = { deletedAt: null };

    if (userRole !== UserRole.ADMIN) {
      const userLists = await this.listModel.find({ ownerId: userId }).select('_id');
      const listIds = userLists.map(list => list._id);
      matchStage.listId = { $in: listIds };
    }

    const tags = await this.taskModel.aggregate([
      { $match: matchStage },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);
  }

  async getTasksByPriority(userId: string, userRole: string) {
    let matchStage: any = { deletedAt: null };

    if (userRole !== UserRole.ADMIN) {
      const userLists = await this.listModel.find({ ownerId: userId }).select('_id');
      const listIds = userLists.map(list => list._id);
      matchStage.listId = { $in: listIds };
    }

    return this.taskModel.aggregate([
      { $match: matchStage },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $project: { priority: '$_id', count: 1, _id: 0 } }
    ]);
  }

  async getTopImportantTasks(userId: string, userRole: string, limit: number = 10) {
    let filter: any = { deletedAt: null, isStarred: true };

    if (userRole !== UserRole.ADMIN) {
      const userLists = await this.listModel.find({ ownerId: userId }).select('_id');
      const listIds = userLists.map(list => list._id);
      filter.listId = { $in: listIds };
    }

    return this.taskModel.find(filter)
      .sort({ priority: -1, deadline: 1, createdAt: -1 }) // Сортировка: высокий приоритет, ближайший дедлайн, новые
      .limit(limit)
      .populate('listId', 'title')
      .exec();
  }
}

