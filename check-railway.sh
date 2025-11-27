#!/bin/bash

# Railway Deployment Health Check Script
# Usage: ./check-railway.sh <your-railway-url>

if [ -z "$1" ]; then
  echo "❌ Error: Please provide your Railway URL"
  echo "Usage: ./check-railway.sh https://your-app.up.railway.app"
  exit 1
fi

RAILWAY_URL=$1
API_URL="${RAILWAY_URL}/api"

echo "🚂 Checking Railway deployment..."
echo "📍 URL: $RAILWAY_URL"
echo ""

# Check Health endpoint
echo "1️⃣ Checking Health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${API_URL}/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
  echo "   ✅ Health check: OK"
else
  echo "   ❌ Health check: Failed (HTTP $HEALTH_RESPONSE)"
fi

# Check Swagger docs
echo ""
echo "2️⃣ Checking Swagger documentation..."
DOCS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${RAILWAY_URL}/docs")
if [ "$DOCS_RESPONSE" = "200" ] || [ "$DOCS_RESPONSE" = "301" ]; then
  echo "   ✅ Swagger docs: OK"
  echo "   📚 Access at: ${RAILWAY_URL}/docs"
else
  echo "   ❌ Swagger docs: Failed (HTTP $DOCS_RESPONSE)"
fi

echo ""
echo "3️⃣ Available endpoints:"
echo "   - Health: ${API_URL}/health"
echo "   - Swagger: ${RAILWAY_URL}/docs"
echo "   - Auth Register: ${API_URL}/auth/register"
echo "   - Auth Login: ${API_URL}/auth/login"
echo "   - Lists: ${API_URL}/lists"
echo "   - Tasks: ${API_URL}/tasks"
echo ""
echo "✨ Deployment check completed!"

