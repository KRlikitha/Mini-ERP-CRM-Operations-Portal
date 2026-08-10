# Apex Mini ERP + CRM Operations Portal

> **Full-Stack Developer Case Study Assignment**  
> A production-grade Mini ERP & CRM system built for wholesale and distribution operations featuring Role-Based Access Control (RBAC), Customer CRM with follow-up tracking, Inventory Management with stock movement logs and low-stock alerts, Sales Challan workflow with atomic stock deduction and snapshot pricing, PDF invoice export, Docker containerization, and comprehensive API tests.

---

## 🚀 Key Modules & Features

### 1. Authentication & Role-Based Access Control (RBAC)
- **Role Matrix**:
  - 👑 **Admin**: Full access across all modules, customer management, inventory control, sales challans, and system stats.
  - 💼 **Sales**: Customer CRM management, adding follow-up notes, generating draft/confirmed sales challans.
  - 📦 **Warehouse**: Managing inventory SKUs, stock level adjustments (`IN` / `OUT`), viewing stock movement audit logs.
  - 💳 **Accounts**: Viewing confirmed sales challans, customer details, financial stats, and exporting official PDF invoices.
- **1-Click Test Sign-In**: Login screen includes quick-fill buttons for instant evaluator testing.

### 2. Customer CRM Module
- **Customer Fields**: Name, Mobile, Email, Business Name, GSTIN (optional), Customer Type (`Retail`, `Wholesale`, `Distributor`), Address, Status (`Lead`, `Active`, `Inactive`), Follow-up Date, Notes.
- **Features**: Add/Edit customer profiles, live search & multi-filter, detail drawer with full follow-up history timeline, and adding new CRM notes.

### 3. Product & Inventory Module
- **Product Fields**: Product Name, SKU/Code (Unique), Category, Unit Price, Current Stock, Minimum Stock Alert Quantity, Warehouse Location.
- **Features**: Add/Edit product SKUs, Category filter, Low-stock alert view, Manual stock adjustment (`IN` / `OUT`) with mandatory reason logging.
- **Stock Movement Log**: Automated tracking recording Product ID, Quantity changed, Movement type (`IN` or `OUT`), Reason reference, Created By User, and Timestamp.

### 4. Sales Challan & Invoicing Module
- **Challan Fields**: Auto-generated Challan Number (`CH-2026-0001`), Customer, Product Items array, Total Quantity, Grand Total Amount, Status (`Draft`, `Confirmed`, `Cancelled`), Created By, Created Date.
- **Crucial Business Logic**:
  - ⚡ **Atomic Stock Deduction**: Confirming a sales challan atomically reduces product stock levels in a database transaction.
  - 🛡️ **Negative Stock Protection**: API verifies stock levels before confirmation. If stock is insufficient, the transaction is rejected with HTTP `400` error: *"Insufficient stock for product X (SKU). Requested: Y, Available: Z."*
  - 📸 **Historical Snapshot Storage**: Line items store `productNameSnapshot`, `skuSnapshot`, and `unitPriceSnapshot`. Future price or name updates to products will never alter historical invoices.
  - 📄 **PDF Invoice Export**: Server-side streaming of official PDF invoices with company header, GST details, customer info, line items table, and authorized signature box.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, SQLite (local zero-config) / PostgreSQL (Production/Docker), JWT, bcryptjs, Zod payload validation, PDFKit.
- **Frontend**: React 18, TypeScript, Vite, Custom CSS Design System (sleek dark aesthetic, glassmorphism, responsive cards & tables), Lucide Icons, Axios.
- **DevOps**: Docker, Docker Compose, GitHub Actions CI/CD.

---

## 🔐 Test Login Credentials

All test accounts use the password: **`Password123!`**

| Role | Email | Permissions & Recommended Test Flow |
| :--- | :--- | :--- |
| **Admin** | `admin@erp.com` | Full access across all modules, stats, and controls. |
| **Sales** | `sales@erp.com` | Create customers, add CRM notes, generate Sales Challans. |
| **Warehouse** | `warehouse@erp.com` | Manage inventory SKUs, adjust stock levels (`IN`/`OUT`), view logs. |
| **Accounts** | `accounts@erp.com` | View financial stats, confirm draft challans, download PDF invoices. |

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- **Node.js**: v18+ or v20+ installed
- **npm**: v9+ installed

### Step 1: Clone Repository
```bash
git clone <your-repo-link>
cd case_study
```

### Step 2: Set Up Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
```

### Step 3: Run Backend Tests & Dev Server
```bash
# Run business logic automated unit tests
npm test

# Start Express Backend API (Port 5000)
npm run dev
```

### Step 4: Set Up & Run Frontend (In a new terminal)
```bash
cd ../frontend
npm install
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`**.

---

## 🐳 Docker Deployment Setup

You can launch the entire stack (PostgreSQL + Backend API + Frontend Nginx) with a single command:

```bash
# Build and launch containers
docker-compose up --build
```

- **Frontend Application**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:5000`
- **PostgreSQL Database**: `localhost:5432`

---

## 🌐 Production Deployment Guide

### Option 1: Render / Railway / Vercel (Free Tier Stack)
1. **Database**: Provision a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com). Copy the PostgreSQL connection string.
2. **Backend API (Render / Railway / Fly.io)**:
   - Create a Web Service pointing to `backend/`.
   - Set environment variables:
     - `PORT=5000`
     - `DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?sslmode=require`
     - `JWT_SECRET=your_production_secret`
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/server.js`
3. **Frontend (Vercel / Netlify)**:
   - Connect repository pointing to `frontend/`.
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Set Environment Variable: `VITE_API_URL=https://your-backend-service.onrender.com/api`

---

## 📑 Postman Collection

A pre-configured Postman Collection file is included in the project root: **`postman_collection.json`**

### Import Instructions:
1. Open Postman -> Click **Import**.
2. Select `postman_collection.json` from the project folder.
3. Collection includes pre-configured endpoints for:
   - `POST /api/auth/login`
   - `GET /api/customers`
   - `POST /api/customers`
   - `POST /api/customers/:id/follow-ups`
   - `GET /api/products?lowStock=true`
   - `POST /api/products/:id/adjust-stock`
   - `POST /api/challans` (with atomic stock check & deduction)
   - `GET /api/challans/:id/pdf`

---

## 🎯 Architecture & Business Flow Summary

```
                       ┌──────────────────────────────┐
                       │  React + TypeScript Frontend  │
                       │   (Port 3000 / Vercel / App) │
                       └──────────────┬───────────────┘
                                      │ REST APIs / JWT Bearer
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

---

## 📝 Known Limitations & Assumptions

1. **Database Flexibility**: Default configuration uses SQLite (`dev.db`) for instant zero-config local testing without requiring local Postgres daemon installation. In production/Docker environments, Prisma connects directly to PostgreSQL via `DATABASE_URL`.
2. **Currency Unit**: Standardized to INR (₹) for Indian wholesale/distribution context.
3. **File Uploads**: AWS S3 integration interface is pre-configured; local product images render with SVG placeholders when external S3 bucket keys are omitted.
