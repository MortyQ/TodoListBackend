/**
 * Тест для ендпоінту GET /tasks/deadlines
 *
 * Використання:
 * node test-deadlines.js
 * або
 * npm run test:deadlines
 */

// Завантажуємо змінні оточення з .env файлу
require('dotenv').config();

const https = require('https');
const http = require('http');

// Конфігурація
const BASE_URL = process.env.API_URL || 'http://localhost:3030';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Перевірка наявності токена
if (!ACCESS_TOKEN) {
  console.error('❌ Error: ACCESS_TOKEN environment variable is not set!');
  console.error('Please set ACCESS_TOKEN in your .env file or pass it as environment variable.');
  console.error('\nExample:');
  console.error('  ACCESS_TOKEN="your-token" npm run test:deadlines');
  process.exit(1);
}

// Утиліта для HTTP запитів
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

// Тестові кейси
const tests = [
  {
    name: 'Test 1: Get upcoming deadlines (default)',
    path: '/api/tasks/deadlines',
    expectedStatus: 200,
    validate: (response) => {
      if (!response.data) return 'Missing data field';
      if (!Array.isArray(response.data)) return 'data is not an array';
      if (response.total === undefined) return 'Missing total field';

      // Перевіряємо, що всі задачі мають deadline
      for (const task of response.data) {
        if (!task.deadline) return `Task ${task._id} missing deadline`;
        if (task.status === 'done') return `Task ${task._id} is done (should be filtered out)`;

        // Перевіряємо, що deadline в майбутньому або сьогодні
        const deadlineDate = new Date(task.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate < today) return `Task ${task._id} has past deadline`;
      }

      return null;
    },
  },
  {
    name: 'Test 2: Get deadlines with limit',
    path: '/api/tasks/deadlines?limit=5',
    expectedStatus: 200,
    validate: (response) => {
      if (!response.data) return 'Missing data field';
      if (!Array.isArray(response.data)) return 'data is not an array';
      if (response.data.length > 5) return `Expected max 5 tasks, got ${response.data.length}`;
      return null;
    },
  },
  {
    name: 'Test 3: Get deadlines with date range',
    path: '/api/tasks/deadlines?startDate=2026-01-01&endDate=2026-12-31',
    expectedStatus: 200,
    validate: (response) => {
      if (!response.data) return 'Missing data field';
      if (!Array.isArray(response.data)) return 'data is not an array';

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      for (const task of response.data) {
        if (!task.deadline) return `Task ${task._id} missing deadline`;
        const deadlineDate = new Date(task.deadline);
        if (deadlineDate < startDate || deadlineDate > endDate) {
          return `Task ${task._id} deadline ${task.deadline} is outside range`;
        }
      }

      return null;
    },
  },
  {
    name: 'Test 4: Get deadlines sorted by date (nearest first)',
    path: '/api/tasks/deadlines?limit=10',
    expectedStatus: 200,
    validate: (response) => {
      if (!response.data) return 'Missing data field';
      if (!Array.isArray(response.data)) return 'data is not an array';

      // Перевіряємо сортування
      for (let i = 1; i < response.data.length; i++) {
        const prevDeadline = new Date(response.data[i - 1].deadline);
        const currDeadline = new Date(response.data[i].deadline);
        if (prevDeadline > currDeadline) {
          return `Tasks are not sorted by deadline correctly (position ${i})`;
        }
      }

      return null;
    },
  },
  {
    name: 'Test 5: Verify populated listId',
    path: '/api/tasks/deadlines?limit=3',
    expectedStatus: 200,
    validate: (response) => {
      if (!response.data || response.data.length === 0) {
        console.log('   ⚠️  No tasks to validate (this is OK if no tasks with deadlines exist)');
        return null;
      }

      const task = response.data[0];
      if (!task.listId) return 'listId is not populated';
      if (typeof task.listId === 'string') return 'listId is not populated (is string)';
      if (!task.listId.title) return 'listId.title is missing';

      return null;
    },
  },
];

// Запуск тестів
async function runTests() {
  console.log('🧪 Testing GET /tasks/deadlines endpoint\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Token: ${ACCESS_TOKEN.substring(0, 20)}...\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`Running: ${test.name}`);
      const response = await makeRequest(test.path);

      // Перевірка статус коду
      if (response.status !== test.expectedStatus) {
        console.log(`   ❌ FAILED: Expected status ${test.expectedStatus}, got ${response.status}`);
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));
        failed++;
        continue;
      }

      // Валідація відповіді
      if (test.validate) {
        const error = test.validate(response.data);
        if (error) {
          console.log(`   ❌ FAILED: ${error}`);
          console.log(`   Response:`, JSON.stringify(response.data, null, 2));
          failed++;
          continue;
        }
      }

      console.log(`   ✅ PASSED`);
      console.log(`   Found ${response.data.data.length} tasks with deadlines`);
      if (response.data.data.length > 0) {
        console.log(`   First task: "${response.data.data[0].title}" - deadline: ${response.data.data[0].deadline}`);
      }
      passed++;
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  // Підсумок
  console.log('━'.repeat(50));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Total:  ${tests.length}\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed');
    process.exit(1);
  }
}

// Запускаємо тести
runTests().catch(console.error);
