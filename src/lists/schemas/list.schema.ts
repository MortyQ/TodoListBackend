import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/schemas/user.schema';

// Схема списка задач для MongoDB
@Schema({
  timestamps: true, // автоматически добавляет createdAt и updatedAt
  collection: 'lists',
})
export class List extends Document {
  @ApiProperty({
    description: 'Название списка',
    example: 'Рабочие задачи'
  })
  @Prop({
    required: true,
    trim: true,
    maxlength: 100, // ограничиваем длину названия
  })
  title: string;

  @ApiProperty({
    description: 'ID владельца списка',
    example: '507f1f77bcf86cd799439011'
  })
  @Prop({
    type: Types.ObjectId,
    ref: 'User', // ссылка на модель User для populate
    required: true,
    index: true, // индекс для быстрого поиска списков пользователя
  })
  ownerId: Types.ObjectId | User;

  @ApiProperty({
    description: 'Дата создания списка',
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
export const ListSchema = SchemaFactory.createForClass(List);

// Настраиваем индексы для оптимизации запросов
ListSchema.index({ ownerId: 1 }); // для поиска списков конкретного пользователя
ListSchema.index({ createdAt: -1 }); // для сортировки по дате создания (новые первые)

// Настраиваем JSON трансформацию
ListSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
