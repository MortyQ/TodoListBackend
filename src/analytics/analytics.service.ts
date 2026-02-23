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
      const listIdStrings = listIds.map(id => id.toString());
      taskFilter.listId = { $in: [...listIds, ...listIdStrings] };
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
      const listIdStrings = listIds.map(id => id.toString());
      matchStage.listId = { $in: [...listIds, ...listIdStrings] };
    }

    const tags = await this.taskModel.aggregate([
      { $match: matchStage },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { tag: '$_id', count: 1, _id: 0 } }
    ]);

    return tags;
  }

  async getTasksByPriority(userId: string, userRole: string) {
    let matchStage: any = { deletedAt: null };

    if (userRole !== UserRole.ADMIN) {
      const userLists = await this.listModel.find({ ownerId: userId }).select('_id');
      const listIds = userLists.map(list => list._id);
      const listIdStrings = listIds.map(id => id.toString());
      matchStage.listId = { $in: [...listIds, ...listIdStrings] };
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
      const listIdStrings = listIds.map(id => id.toString());
      filter.listId = { $in: [...listIds, ...listIdStrings] };
    }

    return this.taskModel.find(filter)
      .sort({ priority: -1, deadline: 1, createdAt: -1 }) // Сортировка: высокий приоритет, ближайший дедлайн, новые
      .limit(limit)
      .populate('listId', 'title')
      .exec();
  }

  async getDailyActivity(userId: string, userRole: string, startDate?: string, endDate?: string) {
    // Determine date range (default to last 7 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      start.setDate(end.getDate() - 7);
    }

    // Adjust start to beginning of day and end to end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    let matchStage: any = { deletedAt: null };

    if (userRole !== UserRole.ADMIN) {
      const userLists = await this.listModel.find({ ownerId: userId }).select('_id');
      const listIds = userLists.map(list => list._id);
      const listIdStrings = listIds.map(id => id.toString());
      matchStage.listId = { $in: [...listIds, ...listIdStrings] };
    }

    // Helper to group by date
    const groupByDate = (dateField: string) => [
      {
        $match: {
          ...matchStage,
          [dateField]: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } },
          count: { $sum: 1 }
        }
      }
    ];

    const [createdStats, completedStats] = await Promise.all([
      this.taskModel.aggregate(groupByDate('createdAt')),
      this.taskModel.aggregate(groupByDate('completedAt'))
    ]);

    // Merge logic to ensure all dates in range are present
    const activityMap = new Map<string, { date: string, created: number, completed: number }>();

    // Fill with empty data for all days in range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      activityMap.set(dateStr, { date: dateStr, created: 0, completed: 0 });
    }

    createdStats.forEach(stat => {
      const entry = activityMap.get(stat._id);
      if (entry) entry.created = stat.count;
    });

    completedStats.forEach(stat => {
      const entry = activityMap.get(stat._id);
      if (entry) entry.completed = stat.count;
    });

    // Return sorted array
    return Array.from(activityMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
}
