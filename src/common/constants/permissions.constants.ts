/**
 * Константы для разрешений в системе
 * Используйте эти константы при назначении разрешений пользователям
 * и при защите эндпоинтов декоратором @RequirePermission()
 */

// Разрешения для списков (Lists)
export const PERMISSIONS = {
  // Lists
  CREATE_LIST: 'create:list',
  READ_LIST: 'read:list',
  UPDATE_LIST: 'update:list',
  DELETE_LIST: 'delete:list',
  READ_ALL_LISTS: 'read:all-lists', // для админов - читать все списки всех пользователей

  // Tasks
  CREATE_TASK: 'create:task',
  READ_TASK: 'read:task',
  UPDATE_TASK: 'update:task',
  DELETE_TASK: 'delete:task',
  READ_ALL_TASKS: 'read:all-tasks', // для админов - читать все задачи всех пользователей

  // Users
  READ_USERS: 'read:users',
  UPDATE_USER: 'update:user',
  DELETE_USER: 'delete:user',
  MANAGE_ROLES: 'manage:roles',
  MANAGE_PERMISSIONS: 'manage:permissions',

  // Dashboard
  READ_DASHBOARD: 'read:dashboard',
  READ_ANALYTICS: 'read:analytics',
} as const;

// Тип для автокомплита
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Предустановленные наборы разрешений для ролей
export const ROLE_PERMISSIONS = {
  USER: [
    PERMISSIONS.CREATE_LIST,
    PERMISSIONS.READ_LIST,
    PERMISSIONS.UPDATE_LIST,
    PERMISSIONS.DELETE_LIST,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.READ_TASK,
    PERMISSIONS.UPDATE_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.READ_DASHBOARD,
  ],
  ADMIN: [
    // Админ имеет все разрешения автоматически через guard,
    // но можно явно их перечислить для документации
    ...Object.values(PERMISSIONS),
  ],
} as const;

