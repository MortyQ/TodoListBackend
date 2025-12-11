/**
 * Migration Script: Add Permissions to Existing Users
 *
 * This script adds the permissions field to all existing users in the database
 * who don't have permissions yet.
 *
 * Usage:
 *   npm run seed:permissions
 *   or
 *   ts-node src/scripts/migrate-permissions.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from '../users/schemas/user.schema';
import { ROLE_PERMISSIONS } from '../common/constants/permissions.constants';

async function migratePermissions() {
  console.log('🔄 Starting permissions migration...');

  // Bootstrap the NestJS application
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get the User model
    const userModel = app.get<Model<User>>(getModelToken(User.name));

    // Find all users without permissions field or with empty permissions
    const usersToMigrate = await userModel.find({
      $or: [
        { permissions: { $exists: false } },
        { permissions: { $size: 0 } },
      ],
    });

    console.log(`📊 Found ${usersToMigrate.length} users to migrate`);

    if (usersToMigrate.length === 0) {
      console.log('✅ No users need migration. All users already have permissions.');
      await app.close();
      return;
    }

    // Update each user with default permissions based on their role
    let adminCount = 0;
    let userCount = 0;

    for (const user of usersToMigrate) {
      const defaultPermissions =
        user.role === UserRole.ADMIN
          ? ROLE_PERMISSIONS.ADMIN
          : ROLE_PERMISSIONS.USER;

      user.permissions = defaultPermissions as any;
      await user.save();

      if (user.role === UserRole.ADMIN) {
        adminCount++;
        console.log(`  ✓ Migrated admin: ${user.email}`);
      } else {
        userCount++;
        console.log(`  ✓ Migrated user: ${user.email}`);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`  - Total migrated: ${usersToMigrate.length}`);
    console.log(`  - Admins: ${adminCount}`);
    console.log(`  - Users: ${userCount}`);
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the migration
migratePermissions()
  .then(() => {
    console.log('\n🎉 Process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Process failed:', error);
    process.exit(1);
  });

