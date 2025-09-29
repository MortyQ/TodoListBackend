import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './schemas/task.schema';
import { List, ListSchema } from '../lists/schemas/list.schema';

@Module({
  imports: [
    // Подключаем схемы Task и List (нужно для проверки доступа к списку)
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: List.name, schema: ListSchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService], // экспортируем для использования в других модулях
})
export class TasksModule {}
