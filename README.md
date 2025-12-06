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

## 📋 Features Implemented

### ✅ Core Requirements

1. **Shopify Store Setup**
   - ✅ Development store configured
   - ✅ Dummy data (products, customers, orders) added

2. **Data Ingestion Service**
   - ✅ Customers sync
   - ✅ Orders sync
   - ✅ Products sync
   - ✅ Multi-tenant support with data isolation
   - ✅ Custom events tracking (cart abandoned, checkout started)

3. **Insights Dashboard**
   - ✅ Total customers, orders, and revenue
   - ✅ Orders by date with date range filtering (startDate/endDate query params)
   - ✅ Top 5 customers by spend
   - ✅ Additional metrics (average order value, total products)
   - ✅ Sales trend charts (Recharts visualization)
   - ✅ Order status breakdown
   - ✅ Email authentication (NextAuth.js) - protected routes
   - ✅ Creative metrics and trend charts for business performance

4. **Documentation**
   - ✅ This comprehensive README
   - ✅ Architecture diagram
   - ✅ API documentation
   - ✅ Database schema

### ✅ Additional Features (All Requirements Met)

- ✅ **Scheduler**: Automated hourly sync for all tenants (node-cron)
- ✅ **Webhooks**: Real-time data sync from Shopify
- ✅ **Email Authentication**: NextAuth.js with email/password (demo mode)
- ✅ **Multi-tenant**: Complete tenant isolation with Prisma ORM
- ✅ **Error Handling**: Robust error handling and validation
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Deployment Ready**: Configured for Render (backend) and Vercel (frontend)

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
   # - Sample customers, products, orders, and events
   #
   # Option 2 additionally creates real data in Shopify that matches your database
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

## 🔮 Next Steps to Productionize

1. **Authentication & Authorization**
   - ✅ NextAuth.js for email authentication (implemented)
   - Add role-based access control (RBAC)
   - Tenant admin UI for onboarding
   - Connect authentication to user database

2. **Scalability**
   - Add Redis for caching
   - Implement message queue (RabbitMQ) for async processing
   - Database connection pooling
   - Horizontal scaling with load balancer

3. **Reliability**
   - Retry logic with exponential backoff
   - Dead letter queue for failed webhooks
   - Comprehensive error logging (Sentry, DataDog)
   - Health checks and monitoring

4. **Security**
   - Proper webhook HMAC verification
   - API rate limiting
   - Input validation and sanitization
   - Secrets management (AWS Secrets Manager, Vault)

5. **Performance**
   - Database indexing optimization
   - Query optimization
   - Caching layer
   - CDN for static assets

6. **Observability**
   - Structured logging
   - Metrics and dashboards (Prometheus, Grafana)
   - Distributed tracing
   - Alerting

7. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests
   - Load testing

## 📝 Known Limitations

1. **Email Authentication**: Basic implementation with NextAuth.js (demo mode - accepts any email/password)
2. **Webhook Verification**: Simplified (needs proper HMAC validation in production)
3. **Rate Limiting**: Not implemented (production needs Shopify API rate limit handling)
4. **Error Recovery**: Basic (needs retry logic, dead letter queues)
5. **Multi-tenant Admin UI**: Not implemented (manual tenant creation via seed script)

## ✅ Assignment Requirements Checklist

### Core Requirements

- [x] **Shopify Store Setup**
  - Development store created and configured
  - Dummy products, customers, and orders added

- [x] **Data Ingestion Service**
  - Customers sync via Shopify Admin API
  - Orders sync via Shopify Admin API
  - Products sync via Shopify Admin API
  - Multi-tenant support with data isolation
  - Custom events (cart abandoned, checkout started) - BONUS

- [x] **Insights Dashboard**
  - Total customers, orders, and revenue metrics
  - Orders by date with date range filtering
  - Top 5 customers by spend
  - Creative metrics and trend charts (sales trends, order status, AOV)

- [x] **Documentation (2-3 Pages)**
  - Assumptions documented
  - High-level architecture diagram
  - APIs and data models documented
  - Next steps to productionize documented

### Additional Requirements

- [x] **Deployment**
  - Backend deployed on Render
  - Frontend deployed on Vercel
  - Deployment instructions provided

- [x] **Scheduler/Webhooks**
  - Automated scheduler (node-cron) for periodic sync
  - Shopify webhooks for real-time updates

- [x] **ORM**
  - Prisma ORM for clean multi-tenant handling
  - Type-safe database queries

- [x] **Authentication**
  - NextAuth.js for email authentication
  - Protected dashboard routes

## 🎥 Demo Video

[Link to demo video explaining features, approach, and trade-offs]

**Video should cover:**
- Features implemented
- How you approached the problem
- Trade-offs made
- Architecture decisions

## 👤 Author

[Your Name]
- GitHub: [Your GitHub]
- Email: [Your Email]

## 📄 License

This project is part of the Xeno FDE Internship Assignment.

---

**Built with ❤️ for Xeno**

