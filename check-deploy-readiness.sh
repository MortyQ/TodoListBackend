#!/bin/bash

# Скрипт перевірки готовності проекту до деплою

echo "🔍 Перевірка готовності проекту до деплою на Render.com"
echo "=================================================="
echo ""

# Колір для виведення
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Лічильник помилок
ERRORS=0
WARNINGS=0

# 1. Перевірка package.json
echo "📦 Перевірка package.json..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json існує"

    # Перевірка наявності необхідних скриптів
    if grep -q '"start:prod"' package.json; then
        echo -e "${GREEN}✓${NC} Скрипт 'start:prod' знайдено"
    else
        echo -e "${RED}✗${NC} Скрипт 'start:prod' не знайдено!"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q '"build"' package.json; then
        echo -e "${GREEN}✓${NC} Скрипт 'build' знайдено"
    else
        echo -e "${RED}✗${NC} Скрипт 'build' не знайдено!"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} package.json не знайдено!"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Перевірка .env.example
echo "🔐 Перевірка змінних оточення..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓${NC} .env.example існує"

    # Перевірка наявності критичних змінних
    required_vars=("PORT" "MONGODB_URI" "DB_NAME" "JWT_SECRET" "CORS_ORIGINS")
    for var in "${required_vars[@]}"; do
        if grep -q "$var" .env.example; then
            echo -e "${GREEN}✓${NC} Змінна $var знайдена"
        else
            echo -e "${RED}✗${NC} Змінна $var відсутня в .env.example!"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${RED}✗${NC} .env.example не знайдено!"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. Перевірка .gitignore
echo "🚫 Перевірка .gitignore..."
if [ -f ".gitignore" ]; then
    echo -e "${GREEN}✓${NC} .gitignore існує"

    if grep -q "node_modules" .gitignore; then
        echo -e "${GREEN}✓${NC} node_modules в .gitignore"
    else
        echo -e "${YELLOW}⚠${NC} node_modules не в .gitignore"
        WARNINGS=$((WARNINGS + 1))
    fi

    if grep -q ".env" .gitignore; then
        echo -e "${GREEN}✓${NC} .env в .gitignore"
    else
        echo -e "${RED}✗${NC} .env не в .gitignore! Секрети можуть потрапити в репозиторій!"
        ERRORS=$((ERRORS + 1))
    fi

    if grep -q "dist" .gitignore; then
        echo -e "${GREEN}✓${NC} dist в .gitignore"
    else
        echo -e "${YELLOW}⚠${NC} dist не в .gitignore"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗${NC} .gitignore не знайдено!"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Перевірка render.yaml
echo "🚀 Перевірка конфігурації Render..."
if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✓${NC} render.yaml існує"
else
    echo -e "${YELLOW}⚠${NC} render.yaml не знайдено (опціонально)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 5. Перевірка документації
echo "📚 Перевірка документації..."
if [ -f "README.md" ]; then
    echo -e "${GREEN}✓${NC} README.md існує"
else
    echo -e "${YELLOW}⚠${NC} README.md не знайдено"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "DEPLOYMENT.md" ]; then
    echo -e "${GREEN}✓${NC} DEPLOYMENT.md існує"
else
    echo -e "${YELLOW}⚠${NC} DEPLOYMENT.md не знайдено"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 6. Перевірка залежностей
echo "📦 Перевірка залежностей..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules встановлено"
else
    echo -e "${YELLOW}⚠${NC} node_modules не встановлено. Запустіть: npm install"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 7. Спроба локальної збірки
echo "🔨 Тестова збірка проекту..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Проект успішно збирається"
else
    echo -e "${RED}✗${NC} Помилка збірки проекту!"
    echo "Запустіть 'npm run build' для деталей"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 8. Перевірка TypeScript
echo "📘 Перевірка TypeScript конфігурації..."
if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✓${NC} tsconfig.json існує"
else
    echo -e "${RED}✗${NC} tsconfig.json не знайдено!"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Підсумок
echo "=================================================="
echo "📊 Результати перевірки:"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Проект повністю готовий до деплою!${NC}"
    echo ""
    echo "Наступні кроки:"
    echo "1. git add ."
    echo "2. git commit -m 'Prepare for deployment'"
    echo "3. git push origin main"
    echo "4. Перейдіть на render.com та створіть Web Service"
    echo ""
    echo "Детальні інструкції: DEPLOYMENT.md"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Проект готовий до деплою з ${WARNINGS} попередженням(и)${NC}"
    echo ""
    echo "Можна продовжувати, але рекомендується виправити попередження."
    exit 0
else
    echo -e "${RED}❌ Знайдено ${ERRORS} помилка(и) та ${WARNINGS} попередження(я)${NC}"
    echo ""
    echo "Виправте помилки перед деплоєм!"
    exit 1
fi

