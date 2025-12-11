import { SetMetadata } from '@nestjs/common';

// Ключ для metadata с требуемыми разрешениями
export const PERMISSIONS_KEY = 'permissions';

/**
 * Декоратор для указания необходимых разрешений на эндпоинте
 * @param permissions - список требуемых разрешений (например: 'create:list', 'read:users')
 *
 * @example
 * @RequirePermission('create:list')
 * @Post()
 * createList() { ... }
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

