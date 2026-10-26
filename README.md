# Expense Tracker (EWP Project)

| Layer    | Technology                           |
|----------|--------------------------------------|
| Frontend | Angular 17 (standalone components)   |
| Backend  | Node.js + Express (REST API)         |
| Database | JSON file (`backend/db.json`)        |
| Auth     | JWT tokens + bcrypt password hashing |

## Features
- Register and log in; many users can use the app, each with private data
- Passwords are hashed (bcrypt); sessions use a 7-day JWT
- Add, edit and delete income / expense transactions
- Live balance, income, spent and "% of income spent" ring
- Spending-by-category breakdown
- Search and filter (All / Expenses / Income)
- Data saved permanently in `backend/db.json`

## How to run
Requires Node.js 18+.

**1. Backend** (terminal 1)
```
cd backend
npm install
npm start          # http://localhost:3000
```

**2. Frontend** (terminal 2)
```
cd frontend
npm install
npm start          # http://localhost:4200
```
Open http://localhost:4200. The Angular dev server proxies `/api` to the backend (`proxy.conf.json`).

## REST API
| Method | URL                  | Purpose              |
|--------|----------------------|----------------------|
| POST   | /api/auth/register   | Create an account     |
| POST   | /api/auth/login      | Log in, returns token |
| GET    | /api/expenses        | List all transactions |
| POST   | /api/expenses        | Add a transaction     |
| PUT    | /api/expenses/:id    | Update a transaction  |
| DELETE | /api/expenses/:id    | Delete a transaction  |

Expense routes need the header `Authorization: Bearer <token>` and only return the logged-in user's data.
Set your own secret before deploying: `JWT_SECRET=your-secret npm start`.

## Folder structure
```
expense-tracker/
├── backend/   server.js, db.json, package.json
└── frontend/  src/app (dashboard, auth, guard, interceptor, service), src/styles.css, angular.json
```
Change the currency in `frontend/src/app/app.component.ts` (`currency = 'INR'`).
