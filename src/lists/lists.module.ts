import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListsService } from './lists.service';
import { ListsController } from './lists.controller';
import { List, ListSchema } from './schemas/list.schema';
import { Task, TaskSchema } from '../tasks/schemas/task.schema';

@Module({
  imports: [
    // Подключаем схемы List и Task (нужно для удаления связанных задач)
    MongooseModule.forFeature([
      { name: List.name, schema: ListSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [ListsController],
  providers: [ListsService],
  exports: [ListsService], // экспортируем для использования в TasksModule
})
export class ListsModule {}
