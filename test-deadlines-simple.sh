#!/bin/bash

# Test deadlines endpoint
# Usage: ./test-deadlines-simple.sh <your-access-token>

if [ -z "$1" ]; then
  echo "Usage: $0 <access-token>"
  echo "Example: $0 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  exit 1
fi

TOKEN="$1"
API_URL="http://localhost:3000"

echo "Testing GET /api/tasks/deadlines"
echo "URL: ${API_URL}/api/tasks/deadlines"
echo ""

curl -v -X GET "${API_URL}/api/tasks/deadlines" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"

echo ""
echo "Done!"

