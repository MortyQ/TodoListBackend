import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/schemas/user.schema';

// Декоратор для указания необходимых ролей на эндпоинте
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Guard для проверки ролей пользователя
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Получаем роли, указанные в декораторе @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Если роли не указаны, доступ разрешен
    if (!requiredRoles) {
      return true;
    }

    // Получаем пользователя из запроса (установлен JWT Guard'ом)
    const { user } = context.switchToHttp().getRequest();

    // Проверяем, есть ли у пользователя одна из необходимых ролей
    return requiredRoles.some((role) => user.role === role);
  }
}
