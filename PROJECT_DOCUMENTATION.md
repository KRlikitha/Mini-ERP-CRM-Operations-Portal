# Mini ERP + CRM Operations Portal — Complete Project Documentation

**Project Name**: Apex Wholesale & Distribution Mini ERP + CRM Portal  
**Role**: Full-Stack Developer Case Study Submission  
**Tech Stack**: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL / SQLite, React 18, Vite, Custom CSS Design System, Docker, PDFKit, Zod.

---

## 📋 Executive Summary

This project is a full-stack Mini ERP & CRM Operations Portal engineered specifically for wholesale and distribution enterprises. The system automates core business workflows including customer relationship management (CRM) with follow-up tracking, multi-warehouse inventory management with automated stock movement logging and low-stock alerts, and sales challan / invoice generation with **atomic stock deduction** and **historical price snapshot storage**.

The architecture enforces strict Role-Based Access Control (RBAC) across four operational roles (**Admin**, **Sales**, **Warehouse**, and **Accounts**), guaranteeing data integrity, operational security, and negative-stock prevention.

---

## 🔗 Submission Artifacts & Links

| Requirement | Details / Location |
| :--- | :--- |
| **GitHub Repository** | *[Insert Repository Link]* |
| **Live Frontend URL** | *[Insert Live Vercel / Netlify Link]* (Local: `http://localhost:3000`) |
| **Live Backend API URL** | *[Insert Live Render / Railway Link]* (Local: `http://localhost:5000`) |
| **Postman Collection** | Included in root: [`postman_collection.json`](./postman_collection.json) |
| **Automated Test Suite** | Backend test runner: `npm test` (`backend/src/tests/run-tests.ts`) |
| **Docker Compose** | Ready-to-run multi-container stack: [`docker-compose.yml`](./docker-compose.yml) |
| **CI/CD Pipeline** | GitHub Actions Workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) |

---

## 🔐 Role-Based Access Control (RBAC) & Test Credentials

All pre-seeded test accounts share the password: **`Password123!`**

The login interface features **1-click quick-fill buttons** allowing evaluators to instantly switch roles without manual typing.

| Role | Email | Permissions & Core Responsibilities |
| :--- | :--- | :--- |
| 👑 **Admin** | `admin@erp.com` | Unrestricted full system access. Manage users, customers, inventory SKUs, manual stock adjustments, sales challans, and executive analytics. |
| 💼 **Sales** | `sales@erp.com` | Customer CRM management, adding follow-up notes, generating sales challans (`Draft` or `Confirmed`), customer interaction timeline. |
| 📦 **Warehouse** | `warehouse@erp.com` | Inventory catalog maintenance, recording manual stock movements (`IN`/`OUT`) with audit notes, monitoring low-stock alerts. |
| 💳 **Accounts** | `accounts@erp.com` | Reviewing confirmed sales challans, customer financial records, issuing & downloading official PDF invoices, revenue analytics. |

---

## 📐 System Architecture & Technology Stack

### System Context Diagram

```
                              ┌───────────────────────────────────┐
                              │  React + TypeScript Frontend App  │
                              │   (Vite / Tailwind-CSS System)    │
                              └─────────────────┬─────────────────┘
                                                │ REST APIs / JWT Bearer
                                                ▼
                              ┌───────────────────────────────────┐
                              │  Node.js + Express + TS Backend   │
                              │  (Zod Validation & RBAC Guard)   │
                              └─────────────────┬─────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐                  ┌──────────────────┐
│  Prisma ORM      │                  │  PDFKit Utility  │                  │ Stock Audit Log  │
│ SQLite / Postgres│                  │ (Invoice Generator)                 │ (IN/OUT Tracker) │
└──────────────────┘                  └──────────────────┘                  └──────────────────┘
```

### Backend Architecture
- **Framework**: Express.js with TypeScript (`src/app.ts`, `src/server.ts`).
- **ORM & Database**: Prisma ORM v5 (`prisma/schema.prisma`). Default zero-config SQLite (`dev.db`) for immediate local execution; seamless PostgreSQL support for Docker and cloud deployments via `DATABASE_URL`.
- **Authentication**: JWT (JSON Web Tokens) with 24-hour expiration and bcrypt password hashing.
- **Validation**: Zod schema validation middleware (`src/middleware/validate.ts`) sanitizing all input payloads.
- **PDF Engine**: Server-side PDFKit document builder generating official, formatted PDF invoices with company letterhead, tax fields, item snapshots, and signature lines.

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite (`frontend/`).
- **Styling**: Vanilla CSS Design System with dark mode styling, glassmorphism card elevation, CSS grid layouts, and custom scrollbars (`index.css`).
- **Icons & UI Elements**: Lucide React Icons.
- **State & API Handling**: Centralized `AuthContext` for JWT state management and role checks; Axios HTTP client with automatic request header token injection.

---

## 📦 Database Schema Design

### Entity Relationship Structure

```
┌──────────────┐         1:N         ┌───────────────────┐
│     User     ├────────────────────►│ CustomerFollowUp  │
└──────┬───────┘                     └───────────────────┘
       │
       │ 1:N                         ┌───────────────────┐
       ├────────────────────────────►│   StockMovement   │
       │                             └───────────────────┘
       │
       │ 1:N                         ┌───────────────────┐         1:N         ┌─────────────────┐
       └────────────────────────────►│   SalesChallan    ├────────────────────►│   ChallanItem   │
                                     └─────────▲─────────┘                     └─────────────────┘
                                               │
┌──────────────┐         1:N                   │
│   Customer   ├───────────────────────────────┘
└──────────────┘
```

### Models Summary
1. **`User`**: `id`, `name`, `email` (unique), `passwordHash`, `role` (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`), timestamps.
2. **`Customer`**: `id`, `name`, `mobile`, `email`, `businessName`, `gstNumber`, `customerType` (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), `address`, `status` (`LEAD`, `ACTIVE`, `INACTIVE`), `followUpDate`, `notes`, timestamps.
3. **`CustomerFollowUp`**: `id`, `customerId`, `note`, `createdById`, `createdAt`.
4. **`Product`**: `id`, `name`, `sku` (unique), `category`, `unitPrice`, `currentStock`, `minStockAlert`, `location`, timestamps.
5. **`StockMovement`**: `id`, `productId`, `quantity`, `movementType` (`IN`, `OUT`), `reason`, `createdById`, `createdAt`.
6. **`SalesChallan`**: `id`, `challanNumber` (unique), `customerId`, `totalQuantity`, `totalAmount`, `status` (`DRAFT`, `CONFIRMED`, `CANCELLED`), `createdById`, timestamps.
7. **`ChallanItem`**: `id`, `challanId`, `productId`, `productNameSnapshot`, `skuSnapshot`, `unitPriceSnapshot`, `quantity`, `subtotal`.

---

## ⚡ Core Modules & Business Logic Rules

### 1. Customer CRM Module
- **Features**: Customer creation, editing, search by name/business/phone, status filters (`Lead`, `Active`, `Inactive`), type filters (`Retail`, `Wholesale`, `Distributor`).
- **Follow-up Sub-system**: Customer detail drawer renders a chronological timeline of interaction notes logged by sales reps, along with a note submission form.

### 2. Inventory & Stock Management Module
- **Live Inventory Table**: Shows current stock count, min-stock alert threshold, category, and warehouse bin location.
- **Visual Stock Badges**: Real-time status indicators (`OPTIMAL`, `LOW STOCK`, `OUT OF STOCK`).
- **Low Stock Filter**: 1-click filter surfacing products requiring re-order.
- **Stock Movement Log**: Tracks every stock change (`IN`/`OUT`) with reference reason (e.g. *"Initial receiving batch"*, *"Sales Challan #CH-2026-0001"*).
- **Manual Stock Adjustment**: Modal allowing warehouse staff to add (`IN`) or remove (`OUT`) stock with mandatory reason logging.

### 3. Sales Challan & Invoicing Module
- **Auto-Generated Challan Number**: Sequential formatting (e.g. `CH-2026-0001`).
- **Dynamic Cart Builder**: Multi-item row addition with auto-calculated line subtotals and grand totals. Real-time stock availability preview during item selection.
- **Atomic Stock Deduction**: When a challan is created as `CONFIRMED` or transitioned from `DRAFT` to `CONFIRMED`, an atomic Prisma database transaction verifies available stock for all line items, deducts quantity, and creates `OUT` stock movement records.
- **Negative Stock Prevention**: If requested quantity for ANY product exceeds current stock, the API rejects the request with HTTP `400 Bad Request`:
  > *"Insufficient stock for product 'Commercial LED Floodlight 100W IP66' (SKU: LED-FLD-100W). Requested: 10, Available: 8."*
- **Historical Price Snapshot Storage**: Line items save `productNameSnapshot`, `skuSnapshot`, and `unitPriceSnapshot`. Subsequent updates to a product's price or name in the catalog will never alter historical invoices.
- **PDF Invoice Export**: Direct PDF generation (`GET /api/challans/:id/pdf`) formatted with company details, GSTIN, customer details, line items table, and authorized signature box.

---

## 📡 REST API Reference Summary

### Authentication Endpoints
- `POST /api/auth/login` — Authenticate user and issue JWT token.
- `GET /api/auth/me` — Get current logged-in user profile.

### Customer CRM Endpoints
- `GET /api/customers` — List customers with pagination, search, status & type filters.
- `GET /api/customers/:id` — Get customer details with full follow-up history.
- `POST /api/customers` — Create customer (Requires `ADMIN` or `SALES` role).
- `PUT /api/customers/:id` — Update customer details (Requires `ADMIN` or `SALES` role).
- `POST /api/customers/:id/follow-ups` — Log follow-up note (Requires `ADMIN` or `SALES` role).

### Product & Inventory Endpoints
- `GET /api/products` — List products with search, category & low-stock filters.
- `GET /api/products/:id` — Get product details and movement history.
- `POST /api/products` — Create product SKU (Requires `ADMIN` or `WAREHOUSE` role).
- `PUT /api/products/:id` — Update product details (Requires `ADMIN` or `WAREHOUSE` role).
- `POST /api/products/:id/adjust-stock` — Adjust stock (`IN`/`OUT`) with reason log.
- `GET /api/products/stock-movements` — Fetch global stock movement audit log.

### Sales Challan Endpoints
- `GET /api/challans` — List sales challans with search & status filters.
- `GET /api/challans/:id` — Get challan detail with stored item snapshots.
- `POST /api/challans` — Create sales challan (Draft or Confirmed with atomic stock deduction).
- `PATCH /api/challans/:id/confirm` — Confirm draft challan & deduct stock atomically.
- `PATCH /api/challans/:id/cancel` — Cancel challan (Reverts stock if previously confirmed).
- `GET /api/challans/:id/pdf` — Stream official PDF invoice document.

### Dashboard Endpoints
- `GET /api/dashboard/stats` — Fetch aggregate revenue, customer breakdown, low-stock count, and activity streams.

---

## ⚙️ Setup & Deployment Guide

### Local Setup Instructions (Zero-Config)

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

3. **Run automated test suite**:
   ```bash
   npm test
   ```

4. **Start backend API server (Port 5000)**:
   ```bash
   npm run dev
   ```

5. **Start frontend app (In a separate terminal, Port 3000)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

6. **Access portal**: Open `http://localhost:3000` in browser.

---

### Docker Deployment Guide

Run the complete multi-container stack (PostgreSQL + Express Backend + Frontend Nginx) with one command:

```bash
docker-compose up --build
```

- **Frontend Portal**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`

---

### Production Deployment Instructions

1. **Database**: Create a free PostgreSQL instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com). Obtain the connection string (`DATABASE_URL`).
2. **Backend**: Deploy `backend/` to [Render](https://render.com) or [Railway](https://railway.app).
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/server.js`
   - Set Environment Variables: `PORT=5000`, `DATABASE_URL`, `JWT_SECRET`.
3. **Frontend**: Deploy `frontend/` to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Set Environment Variable: `VITE_API_URL=https://your-backend-api-domain.com/api`

---

## 🧪 Verification & Automated Test Summary

The backend contains a dedicated business logic test runner (`backend/src/tests/run-tests.ts`) executing key assertions:

```text
🧪 Starting Backend API & Business Logic Verification Tests...

--- Test Suite 1: Authentication & Roles ---
  ✅ PASS: Admin user exists in database
  ✅ PASS: Password verification works with bcrypt hash
  ✅ PASS: User has correct role assignment

--- Test Suite 2: Customer CRM Module ---
  ✅ PASS: Customers list query returns non-empty array
  ✅ PASS: New customer created with auto-generated ID

--- Test Suite 3: Product Inventory & Low Stock ---
  ✅ PASS: Product initialized with currentStock = 10

--- Test Suite 4: Challan Stock Business Rules ---
  ✅ PASS: API rejects challan confirmation when requested quantity exceeds available stock
  ✅ PASS: Stock atomically reduced from 10 to 6
  ✅ PASS: OUT Stock Movement log entry created

=======================================================
🏁 Test Summary: 9 Passed, 0 Failed
=======================================================
```

---

## 📌 Architectural Assumptions & Known Limitations

1. **Database Provider**: Configured with SQLite by default for instant local execution without needing local PostgreSQL service dependencies installed. Production environment seamlessly switches to PostgreSQL via `DATABASE_URL`.
2. **Currency Standard**: Defaulted to INR (₹) for Indian wholesale/distribution domain context.
3. **PDF Generation**: Handled server-side using PDFKit to generate crisp, deterministic invoice documents readable on any device without client-side print dependencies.
