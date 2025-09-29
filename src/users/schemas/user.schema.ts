import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// Enum для ролей пользователя
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// Схема пользователя для MongoDB
@Schema({
  timestamps: true, // автоматически добавляет createdAt и updatedAt
  collection: 'users',
})
export class User extends Document {
  @ApiProperty({
    description: 'Email пользователя (уникальный)',
    example: 'user@example.com'
  })
  @Prop({
    required: true,
    unique: true,
    lowercase: true, // автоматически преобразует в нижний регистр
    trim: true,
    index: true, // создаем индекс для быстрого поиска
  })
  email: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'John Doe',
    required: false
  })
  @Prop({
    required: false,
    trim: true,
  })
  name?: string;

  // Хэш пароля (не возвращается в API)
  @Prop({
    required: true,
    select: false, // по умолчанию не включается в результаты запросов
  })
  passwordHash: string;

  @ApiProperty({
    description: 'Роль пользователя',
    example: UserRole.USER,
    enum: UserRole
  })
  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Дата создания аккаунта',
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
export const UserSchema = SchemaFactory.createForClass(User);

// Настраиваем индексы для оптимизации запросов
UserSchema.index({ email: 1 }, { unique: true });

// Добавляем виртуальные поля (если нужно)
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Обеспечиваем что виртуальные поля включаются в JSON
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash; // никогда не отдаем хэш пароля
    return ret;
  },
});
