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
    description: 'User email (unique)',
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
    description: 'User name',
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

  // Хэш refresh token (не возвращается в API)
  @Prop({
    required: false,
    select: false, // по умолчанию не включается в результаты запросов
  })
  refreshToken?: string;

  // Дата истечения refresh token
  @Prop({
    required: false,
    type: Date,
  })
  refreshTokenExpiresAt?: Date;

  @ApiProperty({
    description: 'User role',
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
    description: 'User permissions array',
    example: ['read:dashboard', 'create:list', 'read:users'],
    type: [String],
    required: false
  })
  @Prop({
    type: [String],
    default: [],
  })
  permissions: string[];

  @ApiProperty({
    description: 'Is user an admin (convenience field)',
    example: false
  })
  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  @ApiProperty({
    description: 'Account creation date',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2023-01-01T00:00:00.000Z'
  })
  updatedAt: Date;
}

// Создаем схему Mongoose из декораторов
export const UserSchema = SchemaFactory.createForClass(User);

// Настраиваем индексы для оптимизации запросов
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ refreshTokenExpiresAt: 1 }); // для очистки устаревших refresh tokens

// Добавляем виртуальные поля (если нужно)
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Виртуальное поле isAdmin
UserSchema.virtual('isAdmin').get(function () {
  return this.role === UserRole.ADMIN;
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
