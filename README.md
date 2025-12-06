# Xeno FDE Internship Assignment - Shopify Data Ingestion & Insights Service

A multi-tenant Shopify Data Ingestion & Insights Service that helps enterprise retailers onboard, integrate, and analyze their customer data.

## 🎯 Project Overview

This service provides:
- **Multi-tenant data ingestion** from Shopify stores
- **Real-time webhooks** for instant data sync
- **Automated scheduling** for periodic data synchronization
- **Comprehensive dashboard** with analytics and insights
- **Custom event tracking** (cart abandoned, checkout started)

## 🏗️ Architecture

### High-Level Architecture Diagram

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Shopify Store │─────────▶│  Webhook Handler │────────▶│  PostgreSQL  │
│   (ara-test)    │         │  (Real-time)     │         │   Database   │
└─────────────────┘         └──────────────────┘         └──────────────┘
       │                              │                           ▲
       │                              │                           │
       │ Admin API                    │                           │
       │ (Polling)                    │                           │
       ▼                              ▼                           │
┌─────────────────┐         ┌──────────────────┐                │
│  Shopify API    │────────▶│  Scheduler       │─────────────────┘
│  Service        │         │  (Hourly Sync)   │
└─────────────────┘         └──────────────────┘
       │                              │
       │                              │
       ▼                              ▼
┌─────────────────┐         ┌──────────────────┐
│  Data Ingestion │         │  Dashboard API   │
│  Controller     │         │  Controller      │
└─────────────────┘         └──────────────────┘
       │                              │
       └──────────────┬───────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │  Next.js Frontend │
            │  (Dashboard UI)   │
            └──────────────────┘
```

### Technology Stack

**Backend:**
- Node.js with Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- node-cron (scheduler)
- Axios (HTTP client)

**Frontend:**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Recharts (data visualization)
- Radix UI components

**Database:**
- PostgreSQL (multi-tenant with tenant isolation)

**Deployment:**
- Backend: Render
- Frontend: Vercel
- Database: PostgreSQL (Render/Supabase)

## 📋 Features

### Data Ingestion & Sync

- **Shopify API Integration**: Full integration with Shopify Admin API for fetching customers, products, and orders
- **Multi-tenant Data Isolation**: Row-level security with tenant-based data separation
- **Manual Sync**: API endpoint to trigger data synchronization on demand
- **Automated Scheduler**: Cron-based hourly sync for all tenants (configurable schedule)
- **Webhook Support**: Real-time data updates via Shopify webhooks for customers, orders, products, carts, and checkouts
- **Custom Events**: Tracking for cart abandoned and checkout started events
- **Shopify Seed Script**: Script to create products, customers, and orders directly in Shopify via API, then sync to database
- **Sync Script**: Standalone script to sync existing Shopify data without creating new data

### Dashboard & Analytics

- **Real-time Statistics**: Total customers, orders, revenue, products, and average order value
- **Date Range Filtering**: Filter orders and metrics by custom date ranges
- **Sales Trend Charts**: Interactive line charts showing sales over time using Recharts
- **Top Customers**: Table displaying top 5 customers by total spend
- **Order Status Breakdown**: Visualization of orders by financial status (paid, pending, refunded)
- **Dark Mode**: Full dark/light mode support with theme toggle
- **Responsive Design**: Mobile-friendly UI built with Shadcn UI components

### Authentication & Security

- **Email Authentication**: NextAuth.js integration with email/password login
- **Protected Routes**: Dashboard requires authentication to access
- **User Management**: Support for admin and regular users with role-based access
- **Session Management**: Secure session handling with JWT tokens
- **Demo Credentials**: Pre-seeded admin and user accounts for easy testing

### Technical Features

- **TypeScript**: Full type safety across backend and frontend
- **Prisma ORM**: Type-safe database queries with multi-tenant support
- **Error Handling**: Comprehensive error handling and validation
- **API Documentation**: Well-documented REST API endpoints
- **Database Schema**: Complete schema with proper relationships and constraints

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Shopify development store with Admin API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xeno-assignment
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp env.template .env
   # Edit .env with your database URL and Shopify credentials
   
   # Setup database
   npx prisma generate
   npx prisma db push
   # Option 1: Seed with dummy data (database only - for testing without Shopify)
   npx prisma db seed

   # Option 2: Seed with real Shopify data (RECOMMENDED)
   # Creates actual products, customers, and orders in your Shopify store via API
   # Then syncs that data from Shopify to your database
   # Requires valid SHOPIFY_ACCESS_TOKEN in .env
   npm run prisma:seed-shopify

   # Both seed scripts create:
   # - Admin users (admin@xeno.com / admin123)
   # - Regular users (user@xeno.com / user123)
   #
   # Option 1 (npx prisma db seed): Only creates users/admins in database
   # Option 2 (npm run prisma:seed-shopify): Creates products, customers, and orders in Shopify via API, then syncs to database
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create .env.local file (optional)
   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
   # NEXT_PUBLIC_TENANT_ID=DEMO_TENANT_ID
   ```

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
PORT=5000
TENANT_ID=DEMO_TENANT_ID
STORE_NAME=ara-test
SHOPIFY_DOMAIN=ara-test.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
ENABLE_SCHEDULER=true
CRON_SCHEDULE="0 * * * *"  # Every hour
SYNC_ON_START=false
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_TENANT_ID=DEMO_TENANT_ID
```

### Running the Application

**Backend:**
```bash
cd backend
npm run dev  # Development
npm run build && npm start  # Production
```

**Frontend:**
```bash
cd frontend
npm run dev  # Development
npm run build && npm start  # Production
```

Access the dashboard at: `http://localhost:3000`

**Default Login Credentials (from seed):**
- **Admin**: `admin@xeno.com` / `admin123`
- **User**: `user@xeno.com` / `user123`
- **Manager**: `manager@xeno.com` / `manager123`

## 📡 API Endpoints

### Data Ingestion

**POST `/api/ingest/sync`**
- Sync data from Shopify for a tenant
- Body: `{ "tenantId": "DEMO_TENANT_ID" }`
- Response: `{ "message": "Sync completed successfully", "stats": {...} }`

### Dashboard

**GET `/api/dashboard/stats`**
- Get dashboard statistics
- Query params: `tenantId`, `startDate?`, `endDate?`
- Response: Dashboard data with metrics, charts, and top customers

### Webhooks

**POST `/api/webhooks/shopify`**
- Receive Shopify webhooks for real-time updates
- Headers: `X-Shopify-Hmac-Sha256`, `X-Shopify-Shop-Domain`, `X-Shopify-Topic`
- Handles: customers, orders, products, carts, checkouts

### Authentication

**POST `/api/auth/login`**
- Authenticate user/admin
- Body: `{ "email": "user@xeno.com", "password": "user123" }`
- Response: `{ "user": { id, email, name, role, tenantId, ... } }`

### Health Check

**GET `/health`**
- Server health check
- Response: `{ "status": "ok", "timestamp": "..." }`

## 🗄️ Database Schema

### Models

**Tenant**
- `id` (String, UUID)
- `storeName` (String)
- `shopifyDomain` (String, unique)
- `accessToken` (String)
- `createdAt`, `updatedAt`

**User** (Authentication)
- `id` (String, UUID)
- `email` (String, unique)
- `password` (String, hashed)
- `name` (String?)
- `role` (String) - 'user' or 'admin'
- `tenantId` (String?, FK) - Optional tenant association
- `createdAt`, `updatedAt`

**Admin** (Super Admin)
- `id` (String, UUID)
- `email` (String, unique)
- `password` (String, hashed)
- `name` (String?)
- `isSuperAdmin` (Boolean)
- `createdAt`, `updatedAt`

**Customer** (Shopify Customer)
- `id` (String, UUID)
- `shopifyId` (String)
- `email` (String)
- `firstName`, `lastName` (String?)
- `totalSpent` (Float)
- `ordersCount` (Int)
- `tenantId` (String, FK)
- Unique: `[shopifyId, tenantId]`

**Product**
- `id` (String, UUID)
- `shopifyId` (String)
- `title` (String)
- `bodyHtml`, `vendor`, `productType` (String?)
- `tenantId` (String, FK)
- Unique: `[shopifyId, tenantId]`

**Order**
- `id` (String, UUID)
- `shopifyId` (String)
- `orderNumber` (Int)
- `totalPrice` (Float)
- `currency` (String)
- `financialStatus` (String?)
- `processedAt` (DateTime?)
- `tenantId` (String, FK)
- `customerId` (String?, FK)
- Unique: `[shopifyId, tenantId]`

**CustomEvent**
- `id` (String, UUID)
- `eventType` (String) - 'cart_abandoned', 'checkout_started', etc.
- `shopifyId` (String?)
- `customerId` (String?, FK)
- `tenantId` (String, FK)
- `metadata` (String?) - JSON data
- `createdAt` (DateTime)
- Indexes: `[tenantId, eventType]`, `[createdAt]`

## 🔐 Multi-Tenancy

The system implements **row-level tenant isolation**:
- All data models include `tenantId` foreign key
- Unique constraints on `[shopifyId, tenantId]` prevent cross-tenant conflicts
- All queries filter by `tenantId`
- Each tenant has isolated Shopify credentials

## 🔄 Data Sync Mechanisms

1. **Manual Sync**: API endpoint `/api/ingest/sync`
2. **Scheduled Sync**: Cron job runs hourly (configurable)
3. **Webhook Sync**: Real-time updates from Shopify

## 🚢 Deployment

### Backend (Render)

1. **Create a new Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure build settings:**
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`
   - Root Directory: `backend` (if deploying from monorepo)
4. **Set environment variables** in Render dashboard:
   ```
   DATABASE_URL=postgresql://...
   PORT=10000
   TENANT_ID=DEMO_TENANT_ID
   STORE_NAME=ara-test
   SHOPIFY_DOMAIN=ara-test.myshopify.com
   SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxx
   ENABLE_SCHEDULER=true
   CRON_SCHEDULE=0 * * * *
   NODE_ENV=production
   ```
5. **Deploy**

Alternatively, use the `render.yaml` file for infrastructure as code.

### Frontend (Vercel)

1. **Import project** from GitHub on Vercel
2. **Set environment variables:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   NEXT_PUBLIC_TENANT_ID=DEMO_TENANT_ID
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=https://your-frontend.vercel.app
   ```
3. **Deploy**

The `vercel.json` is already configured for Next.js.

### Database

- Use **Render PostgreSQL** (free tier available) or **Supabase**
- Copy the connection string to `DATABASE_URL` in backend environment
- Run migrations: `npx prisma db push` (or use Render's build command)

### Webhook Configuration

After deploying backend, configure Shopify webhooks:
1. Go to Shopify Admin → Settings → Notifications → Webhooks
2. Add webhook endpoint: `https://your-backend.onrender.com/api/webhooks/shopify`
3. Select events: customers, orders, products, carts, checkouts

## 📊 Assumptions & Trade-offs

### Assumptions

1. **Tenant Onboarding**: Manual tenant creation via seed script (production would have admin UI)
2. **Authentication**: Basic email authentication implemented with NextAuth.js (demo mode)
3. **Webhook Security**: Simplified webhook verification (production needs proper HMAC validation)
4. **Rate Limiting**: Not implemented (production needs Shopify API rate limit handling)
5. **Error Recovery**: Basic error handling (production needs retry logic, dead letter queues)
6. **Database**: PostgreSQL required for SQL query capabilities (as specified in requirements)

### Trade-offs

1. **Scheduler vs Webhooks**: Both implemented for reliability
2. **Database**: PostgreSQL chosen for SQL query capabilities (as required)
3. **ORM**: Prisma for type safety and multi-tenant handling
4. **Frontend**: Next.js for SSR and better performance

## 📝 Known Limitations

1. **Email Authentication**: Basic implementation with NextAuth.js (demo mode - accepts any email/password)
2. **Webhook Verification**: Simplified (needs proper HMAC validation in production)
3. **Rate Limiting**: Not implemented (production needs Shopify API rate limit handling)
4. **Error Recovery**: Basic (needs retry logic, dead letter queues)
5. **Multi-tenant Admin UI**: Not implemented (manual tenant creation via seed script)

## ✅ Implementation Summary

### What Was Built

This project implements a complete multi-tenant Shopify data ingestion and analytics platform with the following components:

**Backend Services:**
- Express.js REST API with TypeScript
- Prisma ORM for database operations
- Shopify Admin API integration
- Automated scheduler (node-cron) for periodic data sync
- Webhook handler for real-time Shopify updates
- Authentication system with email/password

**Frontend Application:**
- Next.js 16 dashboard with React 19
- Shadcn UI component library
- Recharts for data visualization
- NextAuth.js for authentication
- Dark/light mode support
- Responsive design

**Database:**
- PostgreSQL with multi-tenant row-level isolation
- Complete schema for tenants, users, customers, products, orders, and custom events

**Data Sync:**
- Manual sync via API endpoint
- Automated hourly sync via scheduler
- Real-time sync via Shopify webhooks
- Shopify seed script to create test data directly in Shopify

**Dashboard Features:**
- Real-time statistics (revenue, orders, customers, products, AOV)
- Date range filtering for orders and metrics
- Sales trend visualization with line charts
- Top 5 customers by spend table
- Order status breakdown
- One-click data sync from dashboard

## 🎥 Demo Video

[Link to demo video will be added here]

The demo video covers:
- All implemented features and functionality
- Architecture and technical approach
- Trade-offs and design decisions
- Live demonstration of the dashboard and data sync

## 👤 Author

**Aravind**
- GitHub: [AravindXD](https://github.com/AravindXD)
- Email: aravind.nag1803@gmail.com

## 📄 License

This project is part of the Xeno FDE Internship Assignment.

---

**Built with ❤️ for Xeno**

