import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from './schemas/user.schema';
import { UpdateProfileDto, UpdateUserRoleDto } from './dto/user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // Получение всех пользователей с пагинацией (только для админа)
  async findAll(paginationDto: PaginationDto, searchQuery?: string) {
    const { limit, offset, sort, order } = paginationDto;

    // Строим фильтр для поиска
    const filter: any = {};
    if (searchQuery) {
      filter.email = { $regex: searchQuery, $options: 'i' }; // поиск по email (регистронезависимый)
    }

    // Строим сортировку
    const sortOption: any = {};
    sortOption[sort] = order === 'asc' ? 1 : -1;

    // Выполняем запросы параллельно для оптимизации
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort(sortOption)
        .skip(offset)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  // Получение пользователя по ID (только для админа)
  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // Обновление профиля пользователя (самим пользователем)
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      updateProfileDto,
      { new: true }, // возвращаем обновленный документ
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Изменение роли пользователя (только админом)
  async updateRole(targetUserId: string, adminUserId: string, updateRoleDto: UpdateUserRoleDto): Promise<User> {
    // Проверяем, что админ не пытается изменить свою роль
    if (targetUserId === adminUserId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const user = await this.userModel.findByIdAndUpdate(
      targetUserId,
      { role: updateRoleDto.role },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Удаление пользователя (только админом)
  async remove(targetUserId: string, adminUserId: string): Promise<void> {
    // Проверяем, что админ не пытается удалить самого себя
    if (targetUserId === adminUserId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const user = await this.userModel.findById(targetUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Удаляем пользователя (простой вариант - hard delete)
    // В реальном проекте здесь бы также удалялись связанные списки и задачи
    await this.userModel.findByIdAndDelete(targetUserId);
  }

  // Получение пользователя по email (для внутренних нужд)
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }
}
