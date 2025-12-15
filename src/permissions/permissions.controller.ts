import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionsService, PermissionItem } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constants';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.MANAGE_PERMISSIONS)
  getAllPermissions(): PermissionItem[] {
    return this.permissionsService.getAllPermissions();
  }

  @Get('roles')
  @RequirePermission(PERMISSIONS.MANAGE_PERMISSIONS)
  getRolePermissions(): Record<string, readonly string[]> {
    return this.permissionsService.getRolePermissions();
  }
}

