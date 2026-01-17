#!/bin/bash

# Скрипт для запуску сервера і тестів deadlines endpoint

echo "🚀 Starting test environment..."

# Кольори для виводу
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Перевіряємо, чи запущений сервер
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓${NC} Server is already running on port 3000"
    SERVER_WAS_RUNNING=true
else
    echo -e "${YELLOW}⚠${NC} Server is not running. Starting server..."

    # Запускаємо сервер у фоновому режимі
    npm run start:dev > server.log 2>&1 &
    SERVER_PID=$!
    SERVER_WAS_RUNNING=false

    echo "⏳ Waiting for server to start (30 seconds)..."

    # Чекаємо, поки сервер запуститься (максимум 30 секунд)
    for i in {1..30}; do
        if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
            echo -e "${GREEN}✓${NC} Server started successfully"
            break
        fi

        if [ $i -eq 30 ]; then
            echo -e "${RED}✗${NC} Server failed to start within 30 seconds"
            echo "Check server.log for details:"
            tail -20 server.log
            exit 1
        fi

        sleep 1
    done

    # Додатково чекаємо 3 секунди для ініціалізації
    sleep 3
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Запускаємо тести
npm run test:deadlines
TEST_EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Зупиняємо сервер якщо ми його запускали
if [ "$SERVER_WAS_RUNNING" = false ]; then
    echo "🛑 Stopping server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null
    echo -e "${GREEN}✓${NC} Server stopped"
fi

# Повертаємо код виходу тестів
exit $TEST_EXIT_CODE
