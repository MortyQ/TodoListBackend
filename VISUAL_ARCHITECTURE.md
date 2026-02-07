# 🎨 Visual Architecture: Refresh Token Flow

## 📊 Current vs Future State

```
╔══════════════════════════════════════════════════════════════════════╗
║                         CURRENT STATE (БЕЗ REFRESH TOKEN)             ║
╚══════════════════════════════════════════════════════════════════════╝

┌────────────┐         ┌──────────────┐         ┌──────────────┐
│            │  Login  │              │  Query  │              │
│   Client   ├────────►│    Server    ├────────►│   MongoDB    │
│            │         │              │         │              │
└─────┬──────┘         └──────┬───────┘         └──────────────┘
      │                       │
      │    accessToken        │
      │◄──────────────────────┤
      │                       │
      │                       │
      │  Use API (Bearer)     │
      ├──────────────────────►│
      │                       │
      │  ❌ Access Token      │
      │     Expires           │
      │  ➡️  Must Login Again │
      │                       │


╔══════════════════════════════════════════════════════════════════════╗
║                    FUTURE STATE (С REFRESH TOKEN)                     ║
╚══════════════════════════════════════════════════════════════════════╝

┌────────────┐         ┌──────────────┐         ┌──────────────┐
│            │  Login  │              │  Query  │              │
│   Client   ├────────►│    Server    ├────────►│   MongoDB    │
│            │         │              │         │              │
└─────┬──────┘         └──────┬───────┘         └──────────────┘
      │                       │
      │  { accessToken,       │
      │    refreshToken }     │
      │◄──────────────────────┤
      │                       │
      │  Store both tokens    │
      │                       │
      │  Use API (Bearer)     │
      ├──────────────────────►│
      │                       │
      │  ⚠️  Access Token     │
      │     Expires (15min)   │
      │                       │
      │  ✅ Send Refresh      │
      │     Token             │
      ├──────────────────────►│
      │                       │
      │  { new accessToken,   │
      │    new refreshToken } │
      │◄──────────────────────┤
      │                       │
      │  Continue working     │
      │  (seamless UX!)       │
```

---

## 🔄 Detailed Flow Diagrams

### 1️⃣ LOGIN FLOW (Updated)

```
┌─────────┐                                              ┌──────────┐
│ Client  │                                              │ Database │
└────┬────┘                                              └────┬─────┘
     │                                                        │
     │  1. POST /api/auth/login                              │
     │     { email, password }                               │
     ├──────────────────────────────────────────┐            │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │             │    │
     │                                    │  Validate   │    │
     │                                    │  Password   │    │
     │                                    │  (argon2)   │    │
     │                                    │             │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │  Generate   │    │
     │                                    │  Access     │    │
     │                                    │  Token      │    │
     │                                    │  (15 min)   │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │  Generate   │    │
     │                                    │  Refresh    │    │
     │                                    │  Token      │    │
     │                                    │  (7 days)   │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │   Hash      │    │
     │                                    │  Refresh    │    │
     │                                    │  (argon2)   │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                                           ▼            │
     │                                    Save to DB ────────►│
     │                                                        │
     │  2. Response:                                         │
     │  {                                                    │
     │    accessToken: "eyJ...",                             │
     │    refreshToken: "eyJ..."                             │
     │  }                                                    │
     │◄──────────────────────────────────────────            │
     │                                                        │
     │  3. Store both tokens                                 │
     │     (localStorage/cookie)                             │
     │                                                        │
```

---

### 2️⃣ REFRESH TOKEN FLOW (New)

```
┌─────────┐                                              ┌──────────┐
│ Client  │                                              │ Database │
└────┬────┘                                              └────┬─────┘
     │                                                        │
     │  Access token expired!                                │
     │  (401 Unauthorized)                                   │
     │                                                        │
     │  1. POST /api/auth/refresh                            │
     │     { refreshToken: "eyJ..." }                        │
     ├──────────────────────────────────────────┐            │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │  Verify JWT │    │
     │                                    │  Signature  │    │
     │                                    │             │    │
     │                                    │  ✅ Valid?  │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                                           ▼            │
     │                               Find user by ID ────────►│
     │                               (select +refreshToken)   │
     │                                           │            │
     │                                           ◄────────────┤
     │                                           │  User data │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │  Compare    │    │
     │                                    │  Hashes     │    │
     │                                    │  argon2     │    │
     │                                    │  .verify()  │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                                    ✅ Match?           │
     │                                           │            │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │  Check      │    │
     │                                    │  Expiration │    │
     │                                    │  Date       │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                                    ✅ Not expired?     │
     │                                           │            │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │  Generate   │    │
     │                                    │  NEW Access │    │
     │                                    │  Token      │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │  Generate   │    │
     │                                    │  NEW Refresh│    │
     │                                    │  Token      │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │  Hash NEW   │    │
     │                                    │  Refresh    │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                              Update DB with new ──────►│
     │                              hashed refresh token      │
     │                                           │            │
     │                                           ◄────────────┤
     │                                           │  Success   │
     │  2. Response:                                         │
     │  {                                                    │
     │    accessToken: "eyJ...",  (NEW)                      │
     │    refreshToken: "eyJ..."  (NEW)                      │
     │  }                                                    │
     │◄──────────────────────────────────────────            │
     │                                                        │
     │  3. Replace old tokens with new ones                  │
     │     Old refresh token is now INVALID                  │
     │                                                        │
```

---

### 3️⃣ LOGOUT FLOW (New)

```
┌─────────┐                                              ┌──────────┐
│ Client  │                                              │ Database │
└────┬────┘                                              └────┬─────┘
     │                                                        │
     │  1. POST /api/auth/logout                             │
     │     Authorization: Bearer <accessToken>               │
     ├──────────────────────────────────────────┐            │
     │                                           ▼            │
     │                                    ┌─────────────┐    │
     │                                    │  Verify     │    │
     │                                    │  Access     │    │
     │                                    │  Token      │    │
     │                                    │             │    │
     │                                    │  ✅ Valid?  │    │
     │                                    └──────┬──────┘    │
     │                                           │            │
     │                                           ▼            │
     │                                    Extract user ID    │
     │                                           │            │
     │                                           ▼            │
     │                              Update user in DB ───────►│
     │                              SET:                      │
     │                                refreshToken = null     │
     │                                refreshTokenExpiresAt = │
     │                                                        │
     │                                           ◄────────────┤
     │                                           │  Success   │
     │  2. Response:                                         │
     │  {                                                    │
     │    message: "Logged out successfully"                 │
     │  }                                                    │
     │◄──────────────────────────────────────────            │
     │                                                        │
     │  3. Clear tokens from storage                         │
     │     localStorage.removeItem('accessToken')            │
     │     localStorage.removeItem('refreshToken')           │
     │                                                        │
     │  ⚠️  Any attempt to use old refresh token = 401       │
     │                                                        │
```

---

## 🗂️ Database Schema Changes

### BEFORE (Current):

```
┌────────────────────────────────────────────────────┐
│               users Collection                     │
├────────────────────────────────────────────────────┤
│  _id:            ObjectId                          │
│  email:          string (unique, indexed)          │
│  name:           string (optional)                 │
│  passwordHash:   string (select: false)            │
│  role:           'user' | 'admin'                  │
│  permissions:    string[]                          │
│  createdAt:      Date                              │
│  updatedAt:      Date                              │
└────────────────────────────────────────────────────┘
```

### AFTER (With Refresh Token):

```
┌────────────────────────────────────────────────────┐
│               users Collection                     │
├────────────────────────────────────────────────────┤
│  _id:                   ObjectId                   │
│  email:                 string (unique, indexed)   │
│  name:                  string (optional)          │
│  passwordHash:          string (select: false)     │
│  role:                  'user' | 'admin'           │
│  permissions:           string[]                   │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃ refreshToken:        string (NEW!)         ┃   │
│  ┃                      (hashed, select: false)┃   │
│  ┃                                             ┃   │
│  ┃ refreshTokenExpiresAt: Date (NEW!)         ┃   │
│  ┃                      (indexed)              ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│  createdAt:             Date                       │
│  updatedAt:             Date                       │
└────────────────────────────────────────────────────┘
```

---

## 🏗️ File Structure Changes

```
src/
└── auth/
    ├── auth.module.ts           ✏️  EDIT (add JwtRefreshStrategy)
    ├── auth.service.ts          ✏️  EDIT (add refresh(), logout(), update login())
    ├── auth.controller.ts       ✏️  EDIT (add /refresh, /logout endpoints)
    │
    ├── dto/
    │   └── auth.dto.ts          ✏️  EDIT (add RefreshTokenDto, update LoginResponseDto)
    │
    ├── guards/
    │   ├── jwt-auth.guard.ts    ✅  EXISTS
    │   └── jwt-refresh.guard.ts ➕  CREATE NEW
    │
    └── strategies/
        ├── jwt.strategy.ts      ✅  EXISTS
        └── jwt-refresh.strategy.ts ➕  CREATE NEW

src/
└── users/
    └── schemas/
        └── user.schema.ts       ✏️  EDIT (add refreshToken, refreshTokenExpiresAt)

src/
└── config/
    └── app-config.service.ts    ✏️  EDIT (add jwtRefreshSecret, jwtRefreshExpiresIn)
```

**Legend:**
- ✅ EXISTS - файл уже существует, не трогаем
- ✏️  EDIT - нужно отредактировать
- ➕  CREATE NEW - создать новый файл

**Total changes:**
- 6 files to EDIT
- 2 files to CREATE

---

## 🔐 Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      TOKEN LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════╗
║                        ACCESS TOKEN                              ║
╠══════════════════════════════════════════════════════════════════╣
║  Purpose:         Access protected resources                     ║
║  Storage:         Client (memory/localStorage)                   ║
║  Lifetime:        15 minutes (SHORT!)                            ║
║  Contains:        { sub, email, role, permissions, type }        ║
║  Secret:          JWT_SECRET                                     ║
║  If stolen:       ✅ Low risk (expires quickly)                  ║
║  Transmission:    Authorization: Bearer <token>                  ║
╚══════════════════════════════════════════════════════════════════╝

                              VS

╔══════════════════════════════════════════════════════════════════╗
║                        REFRESH TOKEN                             ║
╠══════════════════════════════════════════════════════════════════╣
║  Purpose:         Get new access tokens                          ║
║  Storage:         Client (httpOnly cookie OR localStorage)       ║
║  Lifetime:        7 days (LONG!)                                 ║
║  Contains:        { sub, type }                                  ║
║  Secret:          JWT_REFRESH_SECRET (different!)                ║
║  Database:        ✅ Hashed copy stored in DB                    ║
║  If stolen:       ⚠️  Medium risk (can be invalidated via logout)║
║  Transmission:    Request body OR Cookie                         ║
║  Rotation:        ✅ NEW token on every refresh                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 🛡️ Security Layers

```
┌───────────────────────────────────────────────────────────┐
│  Layer 1: JWT Signature Validation                       │
│  ✓ Ensures token wasn't tampered with                    │
│  ✓ Uses different secrets for access/refresh             │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────────────────┐
│  Layer 2: Database Comparison                             │
│  ✓ Compare provided refresh token with hashed version    │
│  ✓ Uses argon2 (secure hashing)                          │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────────────────┐
│  Layer 3: Expiration Check                                │
│  ✓ Check JWT exp claim                                   │
│  ✓ Check refreshTokenExpiresAt in DB                     │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌───────────────────────────────────────────────────────────┐
│  Layer 4: Token Rotation                                  │
│  ✓ Generate NEW refresh token on every use               │
│  ✓ Invalidate old refresh token                          │
│  ✓ Detect token reuse (potential attack)                 │
└───────────────────────────────────────────────────────────┘
```

---

## 📱 Client-Side Integration Example

### React/Next.js Client:

```typescript
// ─────────────────────────────────────────────────────────
// 1. Login
// ─────────────────────────────────────────────────────────
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  const { accessToken, refreshToken } = await response.json();
  
  // Store tokens
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

// ─────────────────────────────────────────────────────────
// 2. API Request with Auto-Refresh
// ─────────────────────────────────────────────────────────
const apiRequest = async (url: string, options = {}) => {
  let accessToken = localStorage.getItem('accessToken');
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  // If 401, try refresh
  if (response.status === 401) {
    const newTokens = await refreshTokens();
    if (newTokens) {
      // Retry original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newTokens.accessToken}`,
        },
      });
    }
  }
  
  return response;
};

// ─────────────────────────────────────────────────────────
// 3. Refresh Tokens
// ─────────────────────────────────────────────────────────
const refreshTokens = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    // Redirect to login
    window.location.href = '/login';
    return null;
  }
  
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) throw new Error('Refresh failed');
    
    const { accessToken, refreshToken: newRefreshToken } = 
      await response.json();
    
    // Update stored tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    // Refresh failed, redirect to login
    window.location.href = '/login';
    return null;
  }
};

// ─────────────────────────────────────────────────────────
// 4. Logout
// ─────────────────────────────────────────────────────────
const logout = async () => {
  const accessToken = localStorage.getItem('accessToken');
  
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  // Clear stored tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  // Redirect to login
  window.location.href = '/login';
};
```

---

## 📊 Comparison Matrix

```
╔═══════════════════════╦═════════════════╦═════════════════╗
║      Feature          ║  Access Token   ║  Refresh Token  ║
╠═══════════════════════╬═════════════════╬═════════════════╣
║  Lifetime             ║  15 minutes     ║  7 days         ║
║  Purpose              ║  API access     ║  Get new access ║
║  Stored in DB?        ║  ❌ No          ║  ✅ Yes (hashed)║
║  Can be revoked?      ║  ❌ No          ║  ✅ Yes         ║
║  Contains user data?  ║  ✅ Yes (full)  ║  ⚠️  Minimal    ║
║  Secret               ║  JWT_SECRET     ║  JWT_REFRESH_   ║
║                       ║                 ║  SECRET         ║
║  If stolen            ║  Low risk       ║  Medium risk    ║
║  Used for             ║  Every API call ║  Refresh only   ║
║  Rotation?            ║  ❌ No          ║  ✅ Yes         ║
╚═══════════════════════╩═════════════════╩═════════════════╝
```

---

## 🎯 Implementation Checklist (Visual)

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: Database & Config                             │
├─────────────────────────────────────────────────────────┤
│  ☐  Update User Schema                                  │
│      ├─ Add refreshToken field                          │
│      ├─ Add refreshTokenExpiresAt field                 │
│      └─ Add index on refreshTokenExpiresAt              │
│                                                          │
│  ☐  Update AppConfigService                             │
│      ├─ Add jwtRefreshSecret getter                     │
│      └─ Add jwtRefreshExpiresIn getter                  │
│                                                          │
│  ☐  Add ENV variables                                   │
│      ├─ JWT_REFRESH_SECRET                              │
│      └─ JWT_REFRESH_EXPIRES_IN                          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: DTOs & Interfaces                             │
├─────────────────────────────────────────────────────────┤
│  ☐  Update LoginResponseDto                             │
│      └─ Add refreshToken field                          │
│                                                          │
│  ☐  Create RefreshTokenDto                              │
│      └─ Define refreshToken field with validation       │
│                                                          │
│  ☐  Create RefreshTokenResponseDto                      │
│      └─ Define accessToken + refreshToken fields        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 3: Strategies & Guards                           │
├─────────────────────────────────────────────────────────┤
│  ☐  Create JwtRefreshStrategy                           │
│      ├─ Extend PassportStrategy                         │
│      ├─ Extract token from body                         │
│      └─ Validate token type                             │
│                                                          │
│  ☐  Create JwtRefreshGuard                              │
│      └─ Extend AuthGuard('jwt-refresh')                 │
│                                                          │
│  ☐  Register in AuthModule                              │
│      └─ Add JwtRefreshStrategy to providers             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 4: Service Logic                                 │
├─────────────────────────────────────────────────────────┤
│  ☐  Create generateAccessToken()                        │
│  ☐  Create generateRefreshToken()                       │
│                                                          │
│  ☐  Update login() method                               │
│      ├─ Generate both tokens                            │
│      ├─ Hash refresh token                              │
│      ├─ Save to database                                │
│      └─ Return both tokens                              │
│                                                          │
│  ☐  Create refresh() method                             │
│      ├─ Verify JWT signature                            │
│      ├─ Find user in DB                                 │
│      ├─ Compare hashes                                  │
│      ├─ Check expiration                                │
│      ├─ Generate new tokens                             │
│      ├─ Update DB                                       │
│      └─ Return new tokens                               │
│                                                          │
│  ☐  Create logout() method                              │
│      ├─ Find user                                       │
│      └─ Clear refresh token in DB                       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 5: Controller Endpoints                          │
├─────────────────────────────────────────────────────────┤
│  ☐  Add POST /auth/refresh                              │
│      ├─ Validate RefreshTokenDto                        │
│      ├─ Call authService.refresh()                      │
│      └─ Add Swagger docs                                │
│                                                          │
│  ☐  Add POST /auth/logout                               │
│      ├─ Add JwtAuthGuard                                │
│      ├─ Call authService.logout()                       │
│      └─ Add Swagger docs                                │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 6: Testing                                       │
├─────────────────────────────────────────────────────────┤
│  ☐  Unit Tests (AuthService)                            │
│      ├─ Test login() with refresh token                 │
│      ├─ Test refresh() success case                     │
│      ├─ Test refresh() error cases                      │
│      ├─ Test logout()                                   │
│      └─ Test token rotation                             │
│                                                          │
│  ☐  E2E Tests                                           │
│      ├─ Test /auth/login returns both tokens            │
│      ├─ Test /auth/refresh works                        │
│      ├─ Test /auth/refresh fails with invalid token     │
│      ├─ Test /auth/logout invalidates token             │
│      └─ Test old refresh token doesn't work             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
                    ✅ DONE!
```

---

## 🚨 Common Pitfalls & Solutions

```
╔═══════════════════════════════════════════════════════════╗
║  ❌ PITFALL #1: Storing plain text refresh token in DB   ║
╠═══════════════════════════════════════════════════════════╣
║  Problem:  If DB is compromised, attacker gets tokens    ║
║  Solution: ALWAYS hash with argon2 before storing        ║
╚═══════════════════════════════════════════════════════════╝

// ❌ BAD
user.refreshToken = refreshToken;

// ✅ GOOD
user.refreshToken = await argon2.hash(refreshToken);


╔═══════════════════════════════════════════════════════════╗
║  ❌ PITFALL #2: Not rotating refresh token               ║
╠═══════════════════════════════════════════════════════════╣
║  Problem:  Stolen refresh token works forever (7 days)   ║
║  Solution: Generate NEW refresh on every refresh          ║
╚═══════════════════════════════════════════════════════════╝

// ❌ BAD
return { accessToken: new, refreshToken: old };

// ✅ GOOD
const newRefreshToken = this.generateRefreshToken(user);
return { accessToken: new, refreshToken: newRefreshToken };


╔═══════════════════════════════════════════════════════════╗
║  ❌ PITFALL #3: Using same secret for both tokens        ║
╠═══════════════════════════════════════════════════════════╣
║  Problem:  If secret leaks, both tokens compromised      ║
║  Solution: Use different secrets                          ║
╚═══════════════════════════════════════════════════════════╝

// ❌ BAD
secret: JWT_SECRET

// ✅ GOOD
accessToken:  secret: JWT_SECRET
refreshToken: secret: JWT_REFRESH_SECRET


╔═══════════════════════════════════════════════════════════╗
║  ❌ PITFALL #4: Not checking expiration in DB            ║
╠═══════════════════════════════════════════════════════════╣
║  Problem:  JWT exp can be manipulated                    ║
║  Solution: Double-check with DB timestamp                 ║
╚═══════════════════════════════════════════════════════════╝

// ✅ GOOD
if (user.refreshTokenExpiresAt < new Date()) {
  throw new UnauthorizedException('Refresh token expired');
}
```

---

## 📈 Success Metrics

```
┌─────────────────────────────────────────────────────────┐
│  BEFORE Implementation                                  │
├─────────────────────────────────────────────────────────┤
│  ⚠️  Access token valid for long time (security risk)   │
│  ⚠️  User must re-login when token expires (bad UX)     │
│  ❌  No way to invalidate session (no logout)           │
│  ❌  Can't detect stolen tokens                         │
└─────────────────────────────────────────────────────────┘
                         │
                         │  IMPLEMENTATION
                         ▼
┌─────────────────────────────────────────────────────────┐
│  AFTER Implementation                                   │
├─────────────────────────────────────────────────────────┤
│  ✅  Short-lived access token (15min) = better security │
│  ✅  Seamless token refresh = great UX                  │
│  ✅  Full logout support = session control              │
│  ✅  Token rotation = detect theft                      │
│  ✅  Revocable sessions = compliance ready              │
└─────────────────────────────────────────────────────────┘
```

---

## 🎓 Key Takeaways

```
╭────────────────────────────────────────────────────────╮
│  1. TWO TOKENS, TWO PURPOSES                           │
│     • Access Token  = Short-lived, frequent use        │
│     • Refresh Token = Long-lived, rare use             │
╰────────────────────────────────────────────────────────╯

╭────────────────────────────────────────────────────────╮
│  2. DEFENSE IN DEPTH                                   │
│     • JWT signature validation                         │
│     • Database hash comparison                         │
│     • Expiration check (double)                        │
│     • Token rotation                                   │
╰────────────────────────────────────────────────────────╯

╭────────────────────────────────────────────────────────╮
│  3. NEVER STORE PLAIN TEXT REFRESH TOKENS              │
│     • Always hash with argon2                          │
│     • select: false on schema                          │
│     • Treat like passwords                             │
╰────────────────────────────────────────────────────────╯

╭────────────────────────────────────────────────────────╮
│  4. TOKEN ROTATION IS CRITICAL                         │
│     • New refresh token on every refresh               │
│     • Invalidate old token immediately                 │
│     • Detect reuse = potential attack                  │
╰────────────────────────────────────────────────────────╯

╭────────────────────────────────────────────────────────╮
│  5. SEPARATE SECRETS FOR SEPARATE CONCERNS             │
│     • JWT_SECRET for access tokens                     │
│     • JWT_REFRESH_SECRET for refresh tokens            │
│     • Never reuse secrets                              │
╰────────────────────────────────────────────────────────╯
```

---

**Готов к реализации? Начни с QUICK_START_REFRESH_TOKEN.md! 🚀**

