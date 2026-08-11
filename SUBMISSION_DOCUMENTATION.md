# Mini ERP + CRM Operations Portal — Official Submission Document

---

## 1. 🔗 GitHub Repository Link
- **GitHub Repository**: `[Insert Your GitHub Repository URL Here]`  
  *(e.g., https://github.com/your-username/Mini-ERP-CRM-Operations-Portal)*

---

## 2. 🌐 Live Frontend URL
- **Live Deployment URL**: `[Insert Your Live Vercel / Netlify / Render Static URL Here]`  
  *(e.g., https://mini-erp-crm-portal.vercel.app)*
- **Local Development URL**: `http://localhost:3000`

---

## 3. 📡 Live Backend API URL
- **Live API Base URL**: `[Insert Your Live Render / Railway / Fly.io API URL Here]`  
  *(e.g., https://mini-erp-api.onrender.com/api)*
- **Local Backend Base URL**: `http://localhost:5000/api`
- **Health Check Endpoint**: `http://localhost:5000/api/health`

---

## 4. 🔑 Test Login Credentials for All Roles

All pre-seeded test accounts use the password: **`Password123!`**

| Role | Email Address | Password | Privileges & Recommended Evaluator Test Flow |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@erp.com` | `Password123!` | Full unrestricted access. Manage users, customers, inventory SKUs, manual stock adjustments, sales challans, and view overall dashboard revenue stats. |
| 💼 **Sales** | `sales@erp.com` | `Password123!` | Create & edit customers, log CRM follow-up interaction notes, create Sales Challans (`Draft` or `Confirmed`). |
| 📦 **Warehouse** | `warehouse@erp.com` | `Password123!` | Create & edit inventory SKUs, perform manual stock adjustments (`IN`/`OUT`) with mandatory audit notes, view stock movement logs. |
| 💳 **Accounts** | `accounts@erp.com` | `Password123!` | Review confirmed sales challans, view financial stats, confirm draft challans, and issue & download official PDF invoices. |

> 💡 **Evaluator Convenience Feature**: The login page (`http://localhost:3000`) includes **1-click quick fill buttons** for all 4 test roles, enabling instantaneous role testing without manual typing.

---

## 5. 📬 Postman Collection & API Documentation

### Postman Collection File
The complete, ready-to-import Postman collection is located in the root repository folder:
📄 **[`postman_collection.json`](./postman_collection.json)**

### REST API Endpoints Specification

#### A. Authentication
- `POST /api/auth/login` — Authenticate user and return JWT token.
- `GET /api/auth/me` — Return current authenticated user profile.

#### B. Customer CRM Module
- `GET /api/customers` — List customers with pagination, search, status filter (`LEAD`, `ACTIVE`, `INACTIVE`), and type filter (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`).
- `GET /api/customers/:id` — View customer detail drawer with full CRM follow-up history timeline.
- `POST /api/customers` — Create customer profile *(Admin & Sales)*.
- `PUT /api/customers/:id` — Update customer profile *(Admin & Sales)*.
- `POST /api/customers/:id/follow-ups` — Add follow-up note *(Admin & Sales)*.

#### C. Product & Inventory Module
- `GET /api/products` — List products with search, category filter, and low-stock alert filter (`?lowStock=true`).
- `GET /api/products/:id` — View product detail with stock movement logs.
- `POST /api/products` — Add product SKU with unique code enforcement *(Admin & Warehouse)*.
- `PUT /api/products/:id` — Edit product SKU details *(Admin & Warehouse)*.
- `POST /api/products/:id/adjust-stock` — Perform manual stock adjustment (`IN`/`OUT`) with mandatory reason logging *(Admin & Warehouse)*.
- `GET /api/products/stock-movements` — Fetch global stock movement audit log *(All Roles)*.

#### D. Sales Challan & Invoicing Module
- `GET /api/challans` — List sales challans with search and status filter (`DRAFT`, `CONFIRMED`, `CANCELLED`).
- `GET /api/challans/:id` — View detailed challan with stored product snapshots.
- `POST /api/challans` — Create sales challan. If status is `CONFIRMED`, executes atomic stock deduction transaction.
- `PATCH /api/challans/:id/confirm` — Transition `DRAFT` challan to `CONFIRMED` with atomic stock check & deduction.
- `PATCH /api/challans/:id/cancel` — Cancel challan (reverts stock if previously confirmed).
- `GET /api/challans/:id/pdf` — Stream official PDF invoice document with letterhead and line item table.

#### E. Dashboard Analytics
- `GET /api/dashboard/stats` — Aggregate metrics: Total Revenue, Customer status breakdown, Low Stock alert count, Recent challans, and Stock activity logs.

---

## 6. 🛠️ README: Setup & Deployment Instructions

### A. Local Setup (Zero-Config)
1. **Clone repository**:
   ```bash
   git clone <repo-url>
   cd case_study
   ```
2. **Setup and seed backend**:
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npx ts-node prisma/seed.ts
   ```
3. **Run automated business logic tests**:
   ```bash
   npm test
   ```
4. **Start backend API server (Port 5000)**:
   ```bash
   npm run dev
   ```
5. **Start frontend app (Port 3000, in a new terminal)**:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
6. Open **`http://localhost:3000`** in browser.

### B. Docker Setup
Run the full stack (PostgreSQL + Express Backend + Frontend Nginx) with one command:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- PostgreSQL: `localhost:5432`

### C. Free Cloud Deployment (Vercel / Render / Neon)
1. **Database**: Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com). Copy connection string (`DATABASE_URL`).
2. **Backend**: Deploy `backend/` directory to [Render](https://render.com) or [Railway](https://railway.app).
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/server.js`
   - Environment Variables: `PORT=5000`, `DATABASE_URL`, `JWT_SECRET`.
3. **Frontend**: Deploy `frontend/` directory to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api`

---

## 7. 🏗️ Short Explanation of Architecture

```
                       ┌──────────────────────────────┐
                       │  React + TypeScript Frontend  │
                       │   (Port 3000 / Vercel / App) │
                       └──────────────┬───────────────┘
                                      │ REST APIs / JWT Bearer Token
                                      ▼
                       ┌──────────────────────────────┐
                       │  Express + TypeScript Backend │
                       │  (Port 5000 / Render / Node) │
                       └──────────────┬───────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
│ Prisma ORM        │       │ PDFKit Generator  │       │ Zod Validation &  │
│ (SQLite / Postgres)│      │ (Official PDF)    │       │ RBAC Middleware   │
└───────────────────┘       └───────────────────┘       └───────────────────┘
```

1. **Separation of Concerns**: Clean decouple between React Vite Single-Page Application (SPA) frontend and Express.js REST API backend.
2. **Security & RBAC**: Request middleware intercepts JWT bearer tokens, decodes user payload, and enforces strict role permissions (`requireRole(['ADMIN', 'SALES'])`).
3. **Data Integrity & Business Rules**:
   - **Atomic Stock Deduction**: Stock updates during challan confirmation run inside Prisma `$transaction` blocks.
   - **Negative Stock Prevention**: Stock sufficiency is checked before confirmation. If requested quantity > available stock, transaction is rolled back and HTTP `400` is returned.
   - **Historical Snapshot Storage**: Challan items store `productNameSnapshot`, `skuSnapshot`, and `unitPriceSnapshot` to prevent historical invoice corruption when catalog prices change.

---

## 8. ⚠️ Known Limitations & Incomplete Parts

1. **Database Flexibility**: Default configuration uses SQLite (`dev.db`) for instant zero-dependency local setup without requiring a local Postgres service installed. Production uses PostgreSQL via `DATABASE_URL`.
2. **Product Images / AWS S3**: S3 upload hooks are pre-configured; local product listings fallback to SVG category icons when S3 credentials are omitted.
3. **Currency & Localization**: Defaulted to INR (₹) formatting suited for Indian wholesale & distribution business context.
