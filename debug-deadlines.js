const mongoose = require('mongoose');

// Подключение к MongoDB
const MONGO_URI = process.env.MONGO_URI || 'your-mongo-uri';

async function debug() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false }), 'tasks');
    const List = mongoose.model('List', new mongoose.Schema({}, { strict: false }), 'lists');

    // Получаем все списки
    const allLists = await List.find({}).lean();
    console.log('\n=== All Lists ===');
    console.log(JSON.stringify(allLists, null, 2));

    // Получаем все задачи с deadline
    const allTasksWithDeadlines = await Task.find({
      deadline: { $exists: true, $ne: null }
    }).lean();
    console.log('\n=== All Tasks with Deadlines ===');
    console.log(JSON.stringify(allTasksWithDeadlines, null, 2));

    // Проверяем типы данных
    if (allLists.length > 0) {
      console.log('\n=== List ownerId type ===');
      console.log('ownerId:', allLists[0].ownerId);
      console.log('ownerId type:', typeof allLists[0].ownerId);
      console.log('ownerId instanceof ObjectId:', allLists[0].ownerId instanceof mongoose.Types.ObjectId);
    }

    if (allTasksWithDeadlines.length > 0) {
      console.log('\n=== Task listId type ===');
      console.log('listId:', allTasksWithDeadlines[0].listId);
      console.log('listId type:', typeof allTasksWithDeadlines[0].listId);
      console.log('listId instanceof ObjectId:', allTasksWithDeadlines[0].listId instanceof mongoose.Types.ObjectId);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debug();

