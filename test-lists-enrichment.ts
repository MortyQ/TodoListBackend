import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ListsService } from './src/lists/lists.service';

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const listsService = app.get(ListsService);

  console.log('Testing lists enrichment...\n');

  // Получаем админа из env
  const testUserId = '68da32114c9ad86827cf61f6'; // ID админа из токена
  const testRole = 'admin';

  try {
    const result = await listsService.findAll(testUserId, testRole, {
      limit: 5,
      offset: 0,
      sort: 'createdAt',
      order: 'desc',
      isOwn: false, // все листы
    });

    console.log('\n=== RESULT ===');
    console.log(`Found ${result.data.length} lists`);
    result.data.forEach((list, i) => {
      console.log(`\n${i + 1}. ${list.title}`);
      console.log(`   ID: ${list._id}`);
      console.log(`   Total tasks: ${list.totalTasks}`);
      console.log(`   Completed tasks: ${list.completedTasks}`);
      console.log(`   Tasks array length: ${list.tasks?.length || 0}`);
      if (list.tasks && list.tasks.length > 0) {
        list.tasks.forEach((task, j) => {
          console.log(`     ${j + 1}. ${task.title} [${task.status}]`);
        });
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }

  await app.close();
}

test();
