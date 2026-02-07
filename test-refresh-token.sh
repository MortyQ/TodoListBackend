#!/bin/bash

# 🧪 Test Script for Refresh Token Implementation
# This script tests all new refresh token endpoints

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"

echo "🚀 Starting Refresh Token Tests..."
echo "=================================="
echo ""

# 1. Register a test user
echo "📝 Step 1: Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "refreshtest@example.com",
    "password": "testpass123",
    "name": "Refresh Test User"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "email"; then
  echo -e "${GREEN}✓ User registered successfully${NC}"
else
  echo -e "${YELLOW}⚠ User might already exist (continuing...)${NC}"
fi
echo ""

# 2. Login to get tokens
echo "🔐 Step 2: Logging in to get tokens..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "refreshtest@example.com",
    "password": "testpass123"
  }')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ] && [ -n "$REFRESH_TOKEN" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "  Access Token: ${ACCESS_TOKEN:0:50}..."
  echo "  Refresh Token: ${REFRESH_TOKEN:0:50}..."
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi
echo ""

# 3. Test access token works
echo "🔑 Step 3: Testing access token..."
PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "email"; then
  echo -e "${GREEN}✓ Access token works${NC}"
else
  echo -e "${RED}✗ Access token failed${NC}"
  echo "Response: $PROFILE_RESPONSE"
  exit 1
fi
echo ""

# 4. Test refresh endpoint
echo "🔄 Step 4: Testing refresh endpoint..."
REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
NEW_REFRESH_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$NEW_ACCESS_TOKEN" ] && [ -n "$NEW_REFRESH_TOKEN" ]; then
  echo -e "${GREEN}✓ Refresh successful (Token Rotation works!)${NC}"
  echo "  New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
  echo "  New Refresh Token: ${NEW_REFRESH_TOKEN:0:50}..."
else
  echo -e "${RED}✗ Refresh failed${NC}"
  echo "Response: $REFRESH_RESPONSE"
  exit 1
fi
echo ""

# 5. Test old refresh token is invalidated
echo "🚫 Step 5: Testing old refresh token (should fail)..."
OLD_REFRESH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

if echo "$OLD_REFRESH_RESPONSE" | grep -q "401"; then
  echo -e "${GREEN}✓ Old refresh token correctly invalidated${NC}"
else
  echo -e "${RED}✗ Old refresh token still works (Token Rotation FAILED!)${NC}"
  echo "Response: $OLD_REFRESH_RESPONSE"
  exit 1
fi
echo ""

# 6. Test new access token works
echo "🔑 Step 6: Testing new access token..."
NEW_PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN")

if echo "$NEW_PROFILE_RESPONSE" | grep -q "email"; then
  echo -e "${GREEN}✓ New access token works${NC}"
else
  echo -e "${RED}✗ New access token failed${NC}"
  echo "Response: $NEW_PROFILE_RESPONSE"
  exit 1
fi
echo ""

# 7. Test logout
echo "👋 Step 7: Testing logout..."
LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN")

if echo "$LOGOUT_RESPONSE" | grep -q "successfully"; then
  echo -e "${GREEN}✓ Logout successful${NC}"
else
  echo -e "${RED}✗ Logout failed${NC}"
  echo "Response: $LOGOUT_RESPONSE"
  exit 1
fi
echo ""

# 8. Test refresh token is invalidated after logout
echo "🚫 Step 8: Testing refresh token after logout (should fail)..."
AFTER_LOGOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$NEW_REFRESH_TOKEN\"
  }")

if echo "$AFTER_LOGOUT_RESPONSE" | grep -q "401"; then
  echo -e "${GREEN}✓ Refresh token correctly invalidated after logout${NC}"
else
  echo -e "${RED}✗ Refresh token still works after logout (Logout FAILED!)${NC}"
  echo "Response: $AFTER_LOGOUT_RESPONSE"
  exit 1
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
echo "=================================="
echo ""
echo "✅ Checklist:"
echo "  ✓ Login returns both tokens"
echo "  ✓ Access token works"
echo "  ✓ Refresh endpoint works"
echo "  ✓ Token rotation works (old token invalidated)"
echo "  ✓ New tokens work"
echo "  ✓ Logout works"
echo "  ✓ Tokens invalidated after logout"
echo ""
echo "🎯 Refresh Token implementation is COMPLETE and WORKING!"

