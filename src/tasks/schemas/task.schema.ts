import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { List } from '../../lists/schemas/list.schema';

// Enum для статусов задач
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  ARCHIVED = 'archived',
}

// Enum для приоритетов задач
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// Схема задачи для MongoDB
@Schema({
  timestamps: true, // автоматически добавляет createdAt и updatedAt
  collection: 'tasks',
})
export class Task extends Document {
  @ApiProperty({
    description: 'ID списка, к которому принадлежит задача',
    example: '507f1f77bcf86cd799439011'
  })
  @Prop({
    type: Types.ObjectId,
    ref: 'List', // ссылка на модель List
    required: true,
    index: true, // индекс для быстрого поиска задач в списке
  })
  listId: Types.ObjectId | List;

  @ApiProperty({
    description: 'Название задачи',
    example: 'Написать отчет'
  })
  @Prop({
    required: true,
    trim: true,
    maxlength: 200, // ограничиваем длину названия
  })
  title: string;

  @ApiProperty({
    description: 'Короткое описание задачи',
    example: 'Подготовить месячный отчет по продажам',
    required: false
  })
  @Prop({
    required: false,
    trim: true,
    maxlength: 500,
  })
  description?: string;

  @ApiProperty({
    description: 'Расширенное описание задачи (для отдельной страницы)',
    example: 'Детальный отчет должен включать...',
    required: false
  })
  @Prop({
    required: false,
    trim: true,
  })
  longDescription?: string;

  @ApiProperty({
    description: 'Статус задачи',
    example: TaskStatus.TODO,
    enum: TaskStatus
  })
  @Prop({
    required: true,
    enum: TaskStatus,
    default: TaskStatus.TODO,
    index: true, // индекс для фильтрации по статусу
  })
  status: TaskStatus;

  @ApiProperty({
    description: 'Приоритет задачи',
    example: TaskPriority.MEDIUM,
    enum: TaskPriority
  })
  @Prop({
    required: true,
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    index: true, // индекс для фильтрации по приоритету
  })
  priority: TaskPriority;

  @ApiProperty({
    description: 'Порядок задачи в списке (для drag&drop)',
    example: 1,
    required: false
  })
  @Prop({
    required: false,
    type: Number,
  })
  order?: number;

  @ApiProperty({
    description: 'Теги задачи',
    example: ['работа', 'срочно'],
    required: false,
    type: [String]
  })
  @Prop({
    required: false,
    type: [String],
    index: true, // индекс для поиска по тегам
  })
  tags?: string[];

  @ApiProperty({
    description: 'Срок выполнения задачи',
    example: '2023-12-31T23:59:59.000Z',
    required: false
  })
  @Prop({
    required: false,
    type: Date,
  })
  dueDate?: Date;

  @ApiProperty({
    description: 'Дата завершения задачи',
    example: '2023-01-15T10:30:00.000Z',
    required: false
  })
  @Prop({
    required: false,
    type: Date,
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Дата мягкого удаления задачи (soft delete)',
    example: null,
    required: false
  })
  @Prop({
    required: false,
    type: Date,
    default: null,
  })
  deletedAt?: Date;

  @ApiProperty({
    description: 'Дата создания задачи',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата последнего обновления',
    example: '2023-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}

// Создаем схему Mongoose из декораторов
export const TaskSchema = SchemaFactory.createForClass(Task);

// Настраиваем сложные индексы для оптимизации запросов
TaskSchema.index({ listId: 1, status: 1, order: 1 }); // для сортировки задач в списке
TaskSchema.index({ listId: 1, dueDate: 1 }, {
  partialFilterExpression: { dueDate: { $exists: true, $ne: null } }
}); // только для задач с установленным сроком
TaskSchema.index({ tags: 1 }); // для поиска по тегам
TaskSchema.index({ deletedAt: 1 }); // для фильтрации удаленных задач

// Настраиваем JSON трансформацию
TaskSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
