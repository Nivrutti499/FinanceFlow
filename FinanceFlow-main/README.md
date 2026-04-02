# 💹 FinanceFlow

> A full-stack financial management platform with role-based access control, transaction tracking, and real-time dashboard analytics.

![Node.js](https://img.shields.io/badge/Node.js-v23-green?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?style=flat-square&logo=jsonwebtokens)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Demo Accounts](#-demo-accounts)
- [API Reference](#-api-reference)
- [Role-Based Access Control](#-role-based-access-control)
- [Environment Variables](#-environment-variables)
- [Screenshots](#-screenshots)

---

## ✨ Features

- **JWT Authentication** — Secure login with Bearer token auth
- **Role-Based Access Control** — Three distinct roles: Viewer, Analyst, Admin
- **Financial Records** — Full CRUD with soft delete, filters, search & pagination
- **Dashboard Analytics** — Income/expense totals, net balance, monthly trends, category breakdown
- **User Management** — Admin can create, edit, activate/deactivate users
- **Input Validation** — Server-side validation with detailed error messages
- **Seeded Demo Data** — 28 pre-loaded transactions across 6 months for instant demo

---

## 🛠 Tech Stack

| Layer       | Technology              | Purpose                          |
|-------------|-------------------------|----------------------------------|
| Frontend    | React 18 + Vite         | UI framework and dev server      |
| Styling     | Vanilla CSS             | Custom dark design system        |
| Routing     | React Router v6         | Client-side navigation           |
| HTTP Client | Axios                   | API requests with interceptors   |
| Backend     | Node.js + Express       | REST API server                  |
| ORM         | Prisma                  | Type-safe database access        |
| Database    | SQLite                  | File-based relational database   |
| Auth        | JSON Web Tokens (JWT)   | Stateless authentication         |
| Passwords   | bcryptjs                | Secure password hashing          |
| Validation  | express-validator       | Input validation middleware      |

---

## 📁 Project Structure

```
financeflow/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (User, FinancialRecord)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        # Prisma client singleton
│   │   │   ├── jwt.js             # JWT sign/verify helpers
│   │   │   └── seed.js            # Database seed script
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification middleware
│   │   │   ├── roles.js           # requireRole / requireMinRole guards
│   │   │   └── errorHandler.js    # Global error handler
│   │   ├── routes/
│   │   │   ├── auth.js            # POST /login, GET /me
│   │   │   ├── users.js           # User CRUD (admin only)
│   │   │   ├── records.js         # Financial records CRUD
│   │   │   └── dashboard.js       # Analytics & summary endpoints
│   │   └── index.js               # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js          # Axios instance with interceptors
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state, login/logout, role helpers
│   │   ├── components/
│   │   │   └── Layout.jsx         # Sidebar + topbar shell
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx      # Login form with demo quick-fill
│   │   │   ├── DashboardPage.jsx  # Stats, charts, recent activity
│   │   │   ├── RecordsPage.jsx    # Transactions table with CRUD modals
│   │   │   └── UsersPage.jsx      # User management (admin only)
│   │   ├── App.jsx                # Router + route guards
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Full design system
│   └── package.json
│
├── README.md
└── TECHNICAL_REPORT.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v8 or higher

### 1. Clone / navigate to the project

```bash
cd financeflow
```

### 2. Setup & run the Backend

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client and create the SQLite database
npx prisma generate
npx prisma db push

# Seed the database with demo users and transactions
node src/config/seed.js

# Start the API server (port 5000)
node src/index.js
```

The API will be available at **http://localhost:5000**

### 3. Setup & run the Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (port 5173)
npm run dev
```

The app will be available at **http://localhost:5173**

### 4. Open the app

Navigate to **http://localhost:5173** and log in with one of the demo accounts below.

---

## 🔐 Demo Accounts

| Role        | Email                        | Password     | Access Level                        |
|-------------|------------------------------|--------------|-------------------------------------|
| **Admin**   | `admin@financeflow.com`      | `admin123`   | Full access — users, records, dashboard |
| **Analyst** | `analyst@financeflow.com`    | `analyst123` | View records + dashboard            |
| **Viewer**  | `viewer@financeflow.com`     | `viewer123`  | Dashboard only                      |

> 💡 On the login page, click any demo account card to auto-fill the credentials.

---

## 📡 API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint           | Access | Description              |
|--------|--------------------|--------|--------------------------|
| POST   | `/api/auth/login`  | Public | Log in, receive JWT token |
| GET    | `/api/auth/me`     | All    | Get current user profile |

**Login request body:**
```json
{
  "email": "admin@financeflow.com",
  "password": "admin123"
}
```

**Login response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@financeflow.com",
    "role": "admin",
    "status": "active"
  }
}
```

---

### Financial Records

| Method | Endpoint             | Access          | Description              |
|--------|----------------------|-----------------|--------------------------|
| GET    | `/api/records`       | Analyst + Admin | List records (paginated) |
| POST   | `/api/records`       | Admin only      | Create a new record      |
| PUT    | `/api/records/:id`   | Admin only      | Update a record          |
| DELETE | `/api/records/:id`   | Admin only      | Soft-delete a record     |

**GET /api/records — Query Parameters:**

| Parameter   | Type   | Example        | Description              |
|-------------|--------|----------------|--------------------------|
| `page`      | int    | `1`            | Page number (default: 1) |
| `limit`     | int    | `15`           | Per page (default: 15)   |
| `type`      | string | `income`       | Filter by type           |
| `category`  | string | `Salary`       | Filter by category       |
| `startDate` | date   | `2026-01-01`   | Filter from date         |
| `endDate`   | date   | `2026-03-31`   | Filter to date           |
| `search`    | string | `rent`         | Search notes/category    |

**POST /api/records — Request body:**
```json
{
  "amount": 1500.00,
  "type": "income",
  "category": "Freelance",
  "date": "2026-04-02",
  "notes": "Website redesign project"
}
```

---

### Dashboard

| Method | Endpoint                           | Access | Description                      |
|--------|------------------------------------|--------|----------------------------------|
| GET    | `/api/dashboard/summary`           | All    | Total income, expenses, balance  |
| GET    | `/api/dashboard/trends`            | All    | Monthly income/expense (6 months)|
| GET    | `/api/dashboard/category-breakdown`| All    | Totals grouped by category       |
| GET    | `/api/dashboard/recent`            | All    | Last 10 transactions             |

---

### Users *(Admin only)*

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | `/api/users`      | List all users           |
| POST   | `/api/users`      | Create a new user        |
| PUT    | `/api/users/:id`  | Update role/status/name  |
| DELETE | `/api/users/:id`  | Deactivate a user        |

**POST /api/users — Request body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepass",
  "role": "analyst"
}
```

---

## 🛡️ Role-Based Access Control

```
Viewer   → Dashboard only (summary, trends, categories, recent)
Analyst  → Dashboard + view/search/filter transactions
Admin    → Everything + create/edit/delete records + manage users
```

Access is enforced at two levels:
1. **Backend middleware** — API returns `403 Forbidden` for unauthorized roles
2. **Frontend** — Buttons, menu items, and routes are hidden or redirected based on role

---

## ⚙️ Environment Variables

The backend uses hardcoded defaults suitable for development. For production, set:

| Variable     | Default                          | Description         |
|--------------|----------------------------------|---------------------|
| `PORT`       | `5000`                           | API server port     |
| `JWT_SECRET` | `financeflow_super_secret_key_2026` | JWT signing secret |

Create a `.env` file in `/backend`:

```env
PORT=5000
JWT_SECRET=your_very_long_random_secret_here
```

---

## 🗃️ Data Model

### User
```
id            Int       (auto)
name          String
email         String    (unique)
passwordHash  String
role          String    viewer | analyst | admin
status        String    active | inactive
createdAt     DateTime
```

### FinancialRecord
```
id            Int       (auto)
amount        Float
type          String    income | expense
category      String
date          String    YYYY-MM-DD
notes         String?
createdById   Int       (FK → User)
deletedAt     DateTime? (soft delete)
createdAt     DateTime
updatedAt     DateTime
```

---

## 📌 Available Categories

`Salary` · `Freelance` · `Investment` · `Rent` · `Food` · `Transport` · `Utilities` · `Software` · `Equipment` · `Marketing` · `Other`

---

## 📄 License

This project is for educational and demonstration purposes.
