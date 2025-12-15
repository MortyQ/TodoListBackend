import { Injectable } from '@nestjs/common';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../common/constants/permissions.constants';

export interface PermissionItem {
  key: string;
  value: string;
  category: string;
  description: string;
}

@Injectable()
export class PermissionsService {
  getAllPermissions(): PermissionItem[] {
    return Object.entries(PERMISSIONS).map(([key, value]) => {
      const [action, resource] = value.split(':');
      return {
        key,
        value,
        category: resource || 'other',
        description: this.getDescription(key),
      };
    });
  }

  getRolePermissions(): Record<string, readonly string[]> {
    return ROLE_PERMISSIONS;
  }

  private getDescription(key: string): string {
    const descriptions: Record<string, string> = {
      CREATE_LIST: 'Create new lists',
      READ_LIST: 'View own lists',
      UPDATE_LIST: 'Update own lists',
      DELETE_LIST: 'Delete own lists',
      READ_ALL_LISTS: 'View all users lists (admin)',
      CREATE_TASK: 'Create new tasks',
      READ_TASK: 'View own tasks',
      UPDATE_TASK: 'Update own tasks',
      DELETE_TASK: 'Delete own tasks',
      READ_ALL_TASKS: 'View all users tasks (admin)',
      READ_USERS: 'View users list',
      UPDATE_USER: 'Update user profiles',
      DELETE_USER: 'Delete users',
      MANAGE_ROLES: 'Manage user roles',
      MANAGE_PERMISSIONS: 'Manage user permissions',
      READ_DASHBOARD: 'Access dashboard',
      READ_ANALYTICS: 'View analytics data',
    };
    return descriptions[key] || key;
  }
}

