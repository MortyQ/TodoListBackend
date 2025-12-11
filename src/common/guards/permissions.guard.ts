import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRole } from '../../users/schemas/user.schema';

/**
 * Guard для проверки разрешений пользователя
 *
 * Логика:
 * 1. Если разрешения не указаны в декораторе - доступ разрешен
 * 2. Если пользователь - админ (role === ADMIN) - доступ разрешен всегда
 * 3. Иначе - проверяем наличие хотя бы одного из требуемых разрешений в массиве permissions
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Получаем разрешения из декоратора @RequirePermission()
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Если разрешения не указаны, доступ разрешен
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Получаем пользователя из запроса (установлен JWT Guard'ом)
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Админы имеют доступ ко всем эндпоинтам
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Проверяем, есть ли у пользователя хотя бы одно из требуемых разрешений
    const userPermissions = user.permissions || [];
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}

