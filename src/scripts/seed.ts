import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AppModule } from '../app.module';
import { User, UserRole } from '../users/schemas/user.schema';
import { List } from '../lists/schemas/list.schema';
import { Task, TaskStatus, TaskPriority } from '../tasks/schemas/task.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

async function seed() {
  const logger = new Logger('Seed');

  try {
    // Создаем NestJS приложение для доступа к базе данных
    const app = await NestFactory.createApplicationContext(AppModule);

    // Получаем модели для работы с базой данных
    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const listModel = app.get<Model<List>>(getModelToken(List.name));
    const taskModel = app.get<Model<Task>>(getModelToken(Task.name));

    logger.log('🌱 Starting database seeding...');

    // Очищаем существующие данные
    await Promise.all([
      userModel.deleteMany({}),
      listModel.deleteMany({}),
      taskModel.deleteMany({}),
    ]);
    logger.log('🗑️  Cleared existing data');

    // Создаем пароли (одинаковые для простоты тестирования)
    const passwordHash = await argon2.hash('Passw0rd!');

    // Создаем пользователей
    const adminUser = await userModel.create({
      email: 'admin@example.com',
      passwordHash,
      name: 'Admin User',
      role: UserRole.ADMIN,
    });

    const regularUser = await userModel.create({
      email: 'user@example.com',
      passwordHash,
      name: 'Regular User',
      role: UserRole.USER,
    });

    logger.log('👥 Created users: admin@example.com and user@example.com');

    // Создаем списки для обычного пользователя
    const workList = await listModel.create({
      title: 'Рабочие задачи',
      ownerId: regularUser._id,
    });

    const personalList = await listModel.create({
      title: 'Личные дела',
      ownerId: regularUser._id,
    });

    logger.log('📝 Created lists for regular user');

    // Создаем задачи для рабочего списка
    const workTasks = [
      {
        listId: workList._id,
        title: 'Написать отчет по продажам',
        description: 'Подготовить месячный отчет с анализом',
        longDescription: 'Детальный отчет должен включать: анализ продаж по регионам, сравнение с прошлым месяцем, прогнозы на следующий квартал. Требуется использовать данные из CRM системы и добавить графики для наглядности.',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        tags: ['работа', 'отчеты', 'срочно'],
        dueDate: new Date('2024-01-15'),
        order: 1,
      },
      {
        listId: workList._id,
        title: 'Провести совещание команды',
        description: 'Еженедельное планирование спринта',
        longDescription: 'Обсудить результаты прошлого спринта, планы на текущий, распределить задачи между участниками команды. Подготовить презентацию с основными метриками.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        tags: ['работа', 'команда', 'планирование'],
        dueDate: new Date('2024-01-10'),
        order: 2,
      },
      {
        listId: workList._id,
        title: 'Изучить новые технологии',
        description: 'React 18, Next.js 13, TypeScript best practices',
        longDescription: 'Глубокое изучение: новые features React 18 (Concurrent Features, Suspense), App Router в Next.js 13, продвинутые паттерны TypeScript. Создать демо-проект с использованием изученных технологий.',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        tags: ['обучение', 'технологии', 'frontend'],
        order: 3,
      },
      {
        listId: workList._id,
        title: 'Код-ревью Pull Request #234',
        description: 'Проверить реализацию новой функции аутентификации',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        tags: ['код-ревью', 'безопасность'],
        completedAt: new Date('2024-01-05'),
        order: 4,
      },
    ];

    // Создаем задачи для личного списка
    const personalTasks = [
      {
        listId: personalList._id,
        title: 'Записаться к врачу',
        description: 'Плановый осмотр у терапевта',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        tags: ['здоровье', 'личное'],
        dueDate: new Date('2024-01-20'),
        order: 1,
      },
      {
        listId: personalList._id,
        title: 'Купить продукты на неделю',
        description: 'Составить список и сходить в магазин',
        longDescription: 'Список покупок: молоко, хлеб, овощи для салатов, мясо для ужинов на неделю, фрукты, йогурт. Не забыть купить корм для кота и проверить акции.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        tags: ['покупки', 'дом', 'еда'],
        order: 2,
      },
      {
        listId: personalList._id,
        title: 'Прочитать книгу "Clean Code"',
        description: 'Изучить принципы написания чистого кода',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        tags: ['чтение', 'программирование', 'саморазвитие'],
        order: 3,
      },
      {
        listId: personalList._id,
        title: 'Сделать зарядку',
        description: '30 минут утренней гимнастики',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        tags: ['спорт', 'здоровье'],
        completedAt: new Date(),
        order: 4,
      },
      {
        listId: personalList._id,
        title: 'Позвонить родителям',
        description: 'Узнать как дела, обсудить планы на выходные',
        status: TaskStatus.ARCHIVED,
        priority: TaskPriority.LOW,
        tags: ['семья', 'связь'],
        order: 5,
      },
    ];

    // Сохраняем все задачи в базу данных
    await taskModel.insertMany([...workTasks, ...personalTasks]);

    logger.log('✅ Created tasks for both lists');
    logger.log('🎉 Database seeding completed successfully!');
    logger.log('');
    logger.log('🔐 Test users created:');
    logger.log('   Admin: admin@example.com / Passw0rd!');
    logger.log('   User:  user@example.com / Passw0rd!');
    logger.log('');
    logger.log('📋 Sample data includes:');
    logger.log('   - 2 lists with various tasks');
    logger.log('   - Different task statuses, priorities, and tags');
    logger.log('   - Tasks with due dates and descriptions');

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Запускаем скрипт заполнения данными
seed();
