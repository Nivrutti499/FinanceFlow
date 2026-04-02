# FinanceFlow — Detailed Technical Report

**Project:** FinanceFlow Financial Management System  
**Type:** Full-Stack Web Application  
**Date:** April 2026  
**Stack:** React · Node.js · Express · Prisma · SQLite · JWT

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Decisions](#3-technology-decisions)
4. [Database Design](#4-database-design)
5. [Backend Implementation](#5-backend-implementation)
6. [Authentication & Security](#6-authentication--security)
7. [Role-Based Access Control](#7-role-based-access-control)
8. [REST API Design](#8-rest-api-design)
9. [Frontend Architecture](#9-frontend-architecture)
10. [State Management](#10-state-management)
11. [UI/UX Design System](#11-uiux-design-system)
12. [Validation & Error Handling](#12-validation--error-handling)
13. [Data Persistence Strategy](#13-data-persistence-strategy)
14. [Optional Enhancements Implemented](#14-optional-enhancements-implemented)
15. [Project File Reference](#15-project-file-reference)
16. [Known Limitations & Future Improvements](#16-known-limitations--future-improvements)

---

## 1. Executive Summary

FinanceFlow is a production-grade financial management web application demonstrating modern full-stack development practices. The system provides:

- **Secure authentication** using JSON Web Tokens (JWT)
- **Hierarchical role-based access control** with three roles: Viewer, Analyst, and Admin
- **Complete financial record management** with create, read, update, delete, filtering, search, and pagination
- **Dashboard analytics** including income/expense summaries, net balance, monthly trends, and category-level breakdowns
- **User lifecycle management** including creation, role assignment, activation, and deactivation

The application is split into a decoupled frontend (React/Vite on port 5173) and backend (Express/Node.js on port 5000), communicating exclusively via a RESTful JSON API. Data is persisted in a local SQLite database accessed through the Prisma ORM.

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│          React SPA (Vite Dev Server)             │
│               localhost:5173                     │
└────────────────────┬────────────────────────────┘
                     │ HTTP/REST (JSON)
                     │ Authorization: Bearer <JWT>
┌────────────────────▼────────────────────────────┐
│              Express.js API Server               │
│                localhost:5000                    │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ /auth    │ │ /records │ │ /dashboard       │ │
│  │ /users   │ │          │ │                  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           Middleware Pipeline            │   │
│  │  CORS → JSON Parser → Auth → Role Guard  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │         Prisma ORM Client               │   │
│  └──────────────────┬───────────────────────┘   │
└─────────────────────┼───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│              SQLite Database                     │
│           financeflow.db (file)                  │
│                                                  │
│   ┌────────────┐    ┌───────────────────────┐   │
│   │   users    │    │   financial_records   │   │
│   └────────────┘    └───────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Client Request
     │
     ▼
CORS Middleware (validates origin)
     │
     ▼
JSON Body Parser
     │
     ▼
Route Matching
     │
     ▼
authenticate() middleware (validates JWT, loads user)
     │
     ▼
requireRole() / requireMinRole() middleware
     │
     ▼
Input Validation (express-validator)
     │
     ▼
Route Handler (business logic)
     │
     ▼
Prisma Query (database)
     │
     ▼
JSON Response
     │
     ▼
errorHandler() (catches any thrown errors)
```

---

## 3. Technology Decisions

### Backend Framework: Express.js

Express was chosen for its:
- Minimal abstraction — middleware pipeline is explicitly visible and auditable
- Rich ecosystem with well-maintained libraries
- Simple request/response model suitable for REST APIs
- Wide industry adoption making the patterns recognizable

### Database: SQLite via Prisma

**SQLite** was selected over PostgreSQL or MySQL for:
- Zero infrastructure setup — single file database
- Suitable for development, demonstration, and single-server deployments
- Full SQL compliance for relational modeling

**Prisma ORM** was chosen over raw SQL for:
- Type-safe database queries with auto-generated client
- Schema-first workflow — `schema.prisma` is the single source of truth
- Prebuilt Rust-based query engine binary (no native compilation required on Windows)
- Clean, readable query syntax
- Built-in migration management via `prisma db push`

> **Note:** `better-sqlite3` was initially considered but rejected because it requires native C++ compilation via `node-gyp`, which requires Visual Studio Build Tools on Windows. Prisma's prebuilt binary avoids this entirely.

### Authentication: JWT

JSON Web Tokens (JWT) were chosen for:
- **Stateless** — no server-side session storage needed
- **Self-contained** — the token carries the user's id, email, and role
- **Standard** — widely understood, easy to test with tools like Postman
- **24-hour expiry** — balances security and usability

### Frontend Framework: React + Vite

- **React 18** for component-based UI with hooks
- **Vite** for instant HMR (Hot Module Replacement) and fast build times
- **React Router v6** for declarative client-side routing with nested routes
- **Axios** for HTTP with request/response interceptors for token injection and 401 handling

### Styling: Vanilla CSS with Design Tokens

Rather than a utility framework like Tailwind, a custom CSS design system was built using:
- CSS custom properties (variables) for a consistent color palette, spacing, and shadows
- A dark theme with glassmorphism accents
- Keyframe animations for page load effects and micro-interactions
- Component-scoped class naming (BEM-inspired)

---

## 4. Database Design

### Entity Relationship Diagram

```
users
─────────────────────────────────
id           INTEGER  PK
name         TEXT     NOT NULL
email        TEXT     UNIQUE NOT NULL
password_hash TEXT    NOT NULL
role         TEXT     DEFAULT 'viewer'
             CHECK IN ('viewer','analyst','admin')
status       TEXT     DEFAULT 'active'
             CHECK IN ('active','inactive')
created_at   DATETIME DEFAULT now()

financial_records
─────────────────────────────────
id           INTEGER  PK
amount       REAL     NOT NULL
type         TEXT     CHECK IN ('income','expense')
category     TEXT     NOT NULL
date         TEXT     NOT NULL  (YYYY-MM-DD)
notes        TEXT     NULL
created_by   INTEGER  FK → users(id)
deleted_at   DATETIME NULL      (soft delete)
created_at   DATETIME DEFAULT now()
updated_at   DATETIME UPDATED ON modification

Relationship: users 1 ──< financial_records
```

### Prisma Schema

```prisma
model User {
  id           Int       @id @default(autoincrement())
  name         String
  email        String    @unique
  passwordHash String    @map("password_hash")
  role         String    @default("viewer")
  status       String    @default("active")
  createdAt    DateTime  @default(now()) @map("created_at")
  records      FinancialRecord[]
  @@map("users")
}

model FinancialRecord {
  id          Int       @id @default(autoincrement())
  amount      Float
  type        String
  category    String
  date        String
  notes       String?
  createdById Int       @map("created_by")
  deletedAt   DateTime? @map("deleted_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  createdBy   User      @relation(fields: [createdById], references: [id])
  @@map("financial_records")
}
```

### Design Decisions

**Soft Delete** — Records are never physically removed. Setting `deleted_at` to the current timestamp marks them as deleted. All queries include `WHERE deleted_at IS NULL`. This preserves data integrity and allows potential recovery.

**Date as String** — The `date` field is stored as `TEXT` in `YYYY-MM-DD` format rather than a `DATETIME`. This avoids timezone complications for financial records where only the calendar date matters, not the time of day.

**Role as String** — Roles are stored as strings (`viewer`, `analyst`, `admin`) rather than a foreign key to a roles table. Given three fixed roles with no requirement for dynamic role creation, this is simpler without sacrificing integrity.

---

## 5. Backend Implementation

### Directory Structure

```
backend/src/
├── config/
│   ├── database.js     # Exports Prisma singleton
│   ├── jwt.js          # generateToken(), verifyToken()
│   └── seed.js         # Idempotent seed using upsert
├── middleware/
│   ├── auth.js         # authenticate() — JWT guard
│   ├── roles.js        # requireRole(), requireMinRole()
│   └── errorHandler.js # Global Express error handler
├── routes/
│   ├── auth.js         # /api/auth/*
│   ├── users.js        # /api/users/*
│   ├── records.js      # /api/records/*
│   └── dashboard.js    # /api/dashboard/*
└── index.js            # App bootstrap
```

### Express App Bootstrap (`index.js`)

```javascript
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/records',   recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);
```

Key design choices:
- CORS is locked to the frontend origin (port 5173) for security
- Route modules are self-contained — each imports its own middleware
- The global error handler is registered last, catching any unhandled errors

### Prisma Singleton Pattern

```javascript
// config/database.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
module.exports = prisma;
```

A single shared `PrismaClient` instance is exported and reused across all routes. This is the recommended pattern to avoid creating too many database connections.

---

## 6. Authentication & Security

### Password Hashing

All passwords are hashed with **bcryptjs** at a cost factor of 10 before storage:

```javascript
const passwordHash = await bcrypt.hash(password, 10);
```

Verification at login:
```javascript
const match = await bcrypt.compare(password, user.passwordHash);
```

A cost factor of 10 is the bcrypt standard recommendation, providing ~100ms hashing time on modern hardware — slow enough to resist brute-force attacks but fast enough for user experience.

### JWT Token Flow

```
1. Client POSTs credentials to /api/auth/login
2. Server validates credentials against bcrypt hash
3. Server signs a JWT: { id, email, role } with 24h expiry
4. Client stores token in localStorage
5. Client sends token in every request: Authorization: Bearer <token>
6. authenticate() middleware verifies and decodes token
7. Decoded user is attached to req.user for downstream use
```

JWT payload:
```json
{
  "id": 1,
  "email": "admin@financeflow.com",
  "role": "admin",
  "iat": 1743615000,
  "exp": 1743701400
}
```

### Status Check on Every Request

Even with a valid token, the `authenticate()` middleware re-fetches the user from the database on each request:

```javascript
const user = await prisma.user.findUnique({ where: { id: decoded.id } });
if (user.status === 'inactive') {
  return res.status(401).json({ error: 'Account deactivated.' });
}
```

This ensures that if an admin deactivates a user, that user's existing token immediately stops working — even before it expires.

### Axios Interceptor (Frontend)

The frontend Axios client automatically:
1. **Injects** the JWT token into every request header
2. **Redirects** to `/login` and clears storage on any 401 response

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ff_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

---

## 7. Role-Based Access Control

### Role Hierarchy

```
Admin (level 3)
  └── Can do everything

Analyst (level 2)
  └── Can view records and dashboard

Viewer (level 1)
  └── Can only view dashboard
```

### Backend Middleware Implementation

**`requireRole(...roles)`** — Exact role match (one of the listed roles):
```javascript
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required: ${roles.join(' or ')}`
      });
    }
    next();
  };
}
```

**`requireMinRole(minRole)`** — Hierarchical check (role level ≥ minimum):
```javascript
const ROLE_HIERARCHY = { viewer: 1, analyst: 2, admin: 3 };

function requireMinRole(minRole) {
  return (req, res, next) => {
    if (ROLE_HIERARCHY[req.user.role] < ROLE_HIERARCHY[minRole]) {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }
    next();
  };
}
```

### Access Control Matrix

| Endpoint                    | Viewer | Analyst | Admin |
|-----------------------------|--------|---------|-------|
| POST /api/auth/login        | ✅     | ✅      | ✅    |
| GET /api/auth/me            | ✅     | ✅      | ✅    |
| GET /api/dashboard/*        | ✅     | ✅      | ✅    |
| GET /api/records             | ❌     | ✅      | ✅    |
| POST /api/records            | ❌     | ❌      | ✅    |
| PUT /api/records/:id         | ❌     | ❌      | ✅    |
| DELETE /api/records/:id      | ❌     | ❌      | ✅    |
| GET /api/users               | ❌     | ❌      | ✅    |
| POST /api/users              | ❌     | ❌      | ✅    |
| PUT /api/users/:id           | ❌     | ❌      | ✅    |
| DELETE /api/users/:id        | ❌     | ❌      | ✅    |

### Frontend Route Guards

```jsx
// ProtectedRoute — must be logged in
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

// AdminRoute — must be logged in AND be admin
function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}
```

UI elements (buttons, sidebar links) are also hidden based on role:
```jsx
{isAdmin && <button>➕ New Transaction</button>}
{hasMinRole('analyst') && <NavLink to="/records">Transactions</NavLink>}
{currentUser?.role === 'admin' && <NavLink to="/users">Users</NavLink>}
```

---

## 8. REST API Design

### Design Principles

1. **Resource-based URLs** — nouns, not verbs (`/records`, not `/getRecords`)
2. **Standard HTTP methods** — GET (read), POST (create), PUT (update), DELETE (remove)
3. **Consistent response shapes** — success responses always include a `message` or data key
4. **Appropriate status codes:**
   - `200` — success
   - `201` — resource created
   - `400` — validation error / bad request
   - `401` — unauthenticated
   - `403` — authenticated but unauthorized (wrong role)
   - `404` — resource not found
   - `409` — conflict (e.g. duplicate email)
   - `500` — internal server error

### Query Parameter Filtering (Records)

The GET `/api/records` endpoint builds a dynamic Prisma `where` clause from optional query parameters:

```javascript
const where = { deletedAt: null };
if (req.query.type)      where.type = req.query.type;
if (req.query.category)  where.category = { contains: req.query.category };
if (req.query.startDate) where.date = { ...where.date, gte: req.query.startDate };
if (req.query.endDate)   where.date = { ...where.date, lte: req.query.endDate };
if (req.query.search)    where.OR = [
  { notes: { contains: req.query.search } },
  { category: { contains: req.query.search } }
];
```

### Pagination Implementation

```javascript
const page  = parseInt(req.query.page)  || 1;
const limit = parseInt(req.query.limit) || 15;
const skip  = (page - 1) * limit;

const [total, records] = await Promise.all([
  prisma.financialRecord.count({ where }),
  prisma.financialRecord.findMany({ where, skip, take: limit, orderBy: [...] })
]);

// Response includes pagination metadata
{
  records: [...],
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
}
```

Both `count` and `findMany` are run in parallel with `Promise.all` for efficiency.

### Dashboard Aggregation

Dashboard endpoints load all non-deleted records and compute aggregations in JavaScript rather than raw SQL, making the logic readable and database-agnostic:

```javascript
// Summary
const totalIncome   = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
const totalExpenses = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
const netBalance    = totalIncome - totalExpenses;

// Trends — group by YYYY-MM
for (const r of records) {
  const month = r.date.substring(0, 7); // "2026-03"
  if (!monthMap[month]) monthMap[month] = { month, income: 0, expenses: 0 };
  if (r.type === 'income') monthMap[month].income += r.amount;
  else monthMap[month].expenses += r.amount;
}
```

---

## 9. Frontend Architecture

### Component Hierarchy

```
App
├── AuthProvider (context)
└── BrowserRouter
    ├── /login        → LoginPage
    ├── /dashboard    → Layout > DashboardPage
    ├── /records      → Layout > RecordsPage
    └── /users        → Layout > UsersPage (admin only)

Layout
├── Sidebar (navigation, user info, logout)
└── <children> (page content)
    ├── Topbar (page title, action buttons)
    └── page-content (main body)
```

### Page Breakdown

**`LoginPage.jsx`**
- Controlled form with email and password fields
- `useAuth().login()` dispatches API call
- Error state displayed inline
- Demo account buttons auto-fill credentials

**`DashboardPage.jsx`**
- Fires 4 parallel API calls on mount: summary, trends, categories, recent
- Renders summary stat cards with gradient accent bars
- SVG-based bar chart for monthly trends
- Category breakdown with animated progress bars
- Recent activity feed

**`RecordsPage.jsx`**
- Filter bar: search input, type select, category select, date range pickers
- Paginated table with sort (date descending)
- Create/Edit modal — role-gated (admin only)
- Delete confirmation modal with record preview
- Page controls with numbered pagination buttons

**`UsersPage.jsx`**
- Full user listing table with avatar, role badge, status badge
- Create/Edit modal (admin only)
- Inline activate/deactivate toggle (cannot modify own account)
- Role legend panel explaining each access level

---

## 10. State Management

State is managed locally using React's built-in `useState` and `useEffect` hooks. No external state library (Redux, Zustand) was needed given the application's scope.

### AuthContext

The single piece of global state is the authenticated user, shared via React Context:

```jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on load
  useEffect(() => {
    const token = localStorage.getItem('ff_token');
    const user  = localStorage.getItem('ff_user');
    if (token && user) setCurrentUser(JSON.parse(user));
    setLoading(false);
  }, []);

  // Helpers exposed to consumers
  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, hasRole, hasMinRole }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**`hasRole(...roles)`** — checks if current user's role is in the list  
**`hasMinRole(minRole)`** — checks if current user's role is at least the given level

### Page-Level Data Fetching

Each page manages its own data fetching state:

```javascript
const [data, setData]       = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError]     = useState('');

useEffect(() => {
  async function load() {
    try {
      const res = await api.get('/records', { params });
      setData(res.data.records);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }
  load();
}, [dependencies]);
```

---

## 11. UI/UX Design System

### Design Philosophy

The UI follows a **premium dark-mode aesthetic** with:
- Deep navy/slate backgrounds (`#0a0e1a`, `#0f1629`, `#131929`)
- Vibrant accent colors for interactive elements and data visualizations
- Subtle glassmorphism effects on cards and modals
- Micro-animations (fade-in, slide-up) for page transitions and card renders
- Staggered animation delays on dashboard stat cards for a polished reveal

### Color Palette

```css
--bg-primary:    #0a0e1a  /* Page background */
--bg-secondary:  #0f1629  /* Section background */
--bg-card:       #131929  /* Card background */
--bg-sidebar:    #0c1020  /* Sidebar background */

--accent-blue:   #4f8ef7  /* Primary actions */
--accent-green:  #48bb78  /* Income / success */
--accent-red:    #f56565  /* Expense / danger */
--accent-purple: #9f7aea  /* Highlights */

--gradient-blue:   linear-gradient(135deg, #4f8ef7, #7b61ff)
--gradient-green:  linear-gradient(135deg, #48bb78, #38b2ac)
--gradient-red:    linear-gradient(135deg, #f56565, #ed8936)
```

### Typography

- Font: **Inter** (Google Fonts) — clean, readable, modern
- Scale: 11px (labels) → 12px (meta) → 13px (body) → 14px (primary) → 26px (headings)
- Letter-spacing on uppercase labels for readability

### Animation System

```css
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(30px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

Stat cards use staggered `animation-delay` (0ms, 60ms, 120ms, 180ms) to reveal in sequence. Modals use `slideInUp` with a spring-like `cubic-bezier(0.34, 1.56, 0.64, 1)` easing.

### Bar Chart

The monthly trend chart is implemented with pure CSS/HTML `div` elements rather than an external charting library:

```jsx
<div className="chart-bar income"
  style={{ height: `${(t.income / maxVal) * 100}%` }}
  title={`Income: ${fmt(t.income)}`}
/>
```

Each bar's height is computed as a percentage of the maximum value. CSS `transition: height 0.6s cubic-bezier(...)` animates bars on render.

---

## 12. Validation & Error Handling

### Backend Validation

All route handlers use `express-validator` to validate input before processing:

```javascript
// Example: POST /api/records validation chain
body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
body('category').trim().notEmpty().withMessage('Category is required'),
body('date').notEmpty().withMessage('Date is required'),
body('notes').optional().trim(),

// Check and respond early if errors found
const errors = validationResult(req);
if (!errors.isEmpty()) {
  return res.status(400).json({ error: 'Validation failed', details: errors.array() });
}
```

### Business Rule Validation

Beyond field-level validation, business rules are enforced:

| Rule | Enforcement |
|------|-------------|
| Cannot delete own account | `if (id === req.user.id) return 400` |
| Cannot deactivate own account | Same check |
| Duplicate email on user creation | Prisma `findUnique` before `create` |
| Edit non-existent record | `findFirst({ where: { id, deletedAt: null } })` check |

### Error Response Shape

All errors follow a consistent structure:

```json
// Simple error
{ "error": "User not found." }

// Validation error with field details
{
  "error": "Validation failed",
  "details": [
    { "field": "amount", "message": "Amount must be a positive number" },
    { "field": "date",   "message": "Date is required" }
  ]
}
```

### Frontend Error Display

Errors are displayed inline above forms using an `error-banner` component:

```jsx
{error && <div className="error-banner">⚠️ {error}</div>}
```

API errors are extracted from `err.response?.data?.error` with a fallback generic message.

---

## 13. Data Persistence Strategy

### SQLite Choice

SQLite was selected as the persistence layer for the following reasons:

1. **Zero setup** — no database server to install or configure
2. **Single file** — the entire database is `financeflow.db`, easily portable
3. **Full SQL support** — relational modeling with foreign keys, constraints, and indexes
4. **Prisma support** — first-class Prisma adapter with identical query syntax to PostgreSQL
5. **Production viability** — SQLite handles thousands of concurrent reads well; write throughput is sufficient for single-user or small-team financial tools

### WAL Mode (Write-Ahead Logging)

> Note: WAL was enabled in the initial `better-sqlite3` implementation. With Prisma + SQLite, WAL is managed automatically and is enabled by default for improved concurrent read performance.

### Prisma Migrations

Database schema changes are managed through `prisma db push` (schema sync) rather than migration files, which is appropriate for development and prototyping. For production, `prisma migrate dev` / `prisma migrate deploy` would be used to generate versioned migration files.

### Seed Script

The seed script (`src/config/seed.js`) is **idempotent** — running it multiple times does not create duplicate data:

```javascript
// Uses upsert — creates if not exists, skips if exists
await prisma.user.upsert({
  where:  { email: 'admin@financeflow.com' },
  update: {},   // no-op if found
  create: { name: 'Admin User', email: '...', ... }
});

// Records only seeded if table is empty
const count = await prisma.financialRecord.count();
if (count === 0) { /* seed records */ }
```

---

## 14. Optional Enhancements Implemented

All listed optional enhancements from the project requirements were implemented:

| Enhancement | Implementation |
|-------------|----------------|
| **JWT Authentication** | `jsonwebtoken` with 24h expiry, Bearer token in headers |
| **Pagination** | `skip`/`take` with `totalPages` metadata in response |
| **Search** | `contains` filter on `notes` and `category` fields |
| **Soft Delete** | `deleted_at` timestamp; all queries filter `WHERE deleted_at IS NULL` |
| **API Documentation** | Full API reference in `README.md` |

---

## 15. Project File Reference

### Backend Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema definition for User and FinancialRecord |
| `src/index.js` | Express app setup, middleware registration, server start |
| `src/config/database.js` | Exports shared Prisma client instance |
| `src/config/jwt.js` | `generateToken()` and `verifyToken()` helper functions |
| `src/config/seed.js` | Idempotent database seeder with demo users and transactions |
| `src/middleware/auth.js` | `authenticate()` — verifies JWT Bearer token, loads user |
| `src/middleware/roles.js` | `requireRole()` and `requireMinRole()` access guards |
| `src/middleware/errorHandler.js` | Global Express error handler (last middleware) |
| `src/routes/auth.js` | `POST /api/auth/login`, `GET /api/auth/me` |
| `src/routes/users.js` | Full CRUD for users — admin only |
| `src/routes/records.js` | Full CRUD for financial records with filters/pagination |
| `src/routes/dashboard.js` | Summary, trends, category breakdown, recent activity |

### Frontend Files

| File | Purpose |
|------|---------|
| `index.html` | HTML shell with meta tags, Google Fonts import |
| `src/main.jsx` | React DOM render entry point |
| `src/App.jsx` | Router, protected route guards, top-level layout |
| `src/index.css` | Full design system — variables, components, animations |
| `src/api/client.js` | Axios instance with request/response interceptors |
| `src/context/AuthContext.jsx` | Global auth state — currentUser, login, logout, role helpers |
| `src/components/Layout.jsx` | Sidebar navigation, user panel, logout button |
| `src/pages/LoginPage.jsx` | Login form with demo account quick-fill buttons |
| `src/pages/DashboardPage.jsx` | Stats cards, trend chart, category breakdown, recent feed |
| `src/pages/RecordsPage.jsx` | Paginated transactions table with CRUD modals |
| `src/pages/UsersPage.jsx` | User management table with create/edit/toggle modals |

---

## 16. Known Limitations & Future Improvements

### Current Limitations

| Area | Limitation |
|------|-----------|
| Token refresh | No refresh token mechanism — users must re-login after 24h |
| Concurrency | SQLite has limited concurrent write throughput |
| File storage | No attachment/receipt upload support |
| Reports | No PDF/CSV export functionality |
| Tests | No automated unit or integration tests |
| Rate limiting | No API rate limiting implemented |
| HTTPS | HTTP only — no TLS for local development |

### Recommended Production Enhancements

1. **Switch to PostgreSQL** — For multi-user production deployments, replace SQLite with PostgreSQL using `provider = "postgresql"` in `schema.prisma` (no other code changes required thanks to Prisma's abstraction).

2. **Add Refresh Tokens** — Issue short-lived access tokens (15 min) and long-lived refresh tokens (7 days), storing refresh tokens in an `HttpOnly` cookie.

3. **Rate Limiting** — Add `express-rate-limit` middleware to the login endpoint to prevent brute-force attacks:
   ```javascript
   const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
   router.post('/login', limiter, ...handlers);
   ```

4. **Automated Testing** — Add Jest + Supertest for backend integration tests, and React Testing Library for frontend component tests.

5. **Docker Compose** — Containerize both frontend and backend for consistent deployments:
   ```yaml
   services:
     backend:  { build: ./backend,  ports: ["5000:5000"] }
     frontend: { build: ./frontend, ports: ["5173:5173"] }
   ```

6. **CSV Export** — Add an endpoint `GET /api/records/export?format=csv` for downloading filtered transaction data.

7. **Audit Log** — Track who modified records and when, adding `updated_by` and a separate `audit_logs` table.

---

*End of Technical Report — FinanceFlow Financial Management System*
