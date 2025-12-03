import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

import ingestRoutes from './routes/ingest.routes';
import dashboardRoutes from './routes/dashboard.routes';
import webhookRoutes from './routes/webhook.routes';
import authRoutes from './routes/auth.routes';
import { SchedulerService } from './services/scheduler.service';

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Webhook endpoint needs raw body for signature verification
// For now, we'll use JSON parser, but in production use body-parser with verify
app.use('/api/webhooks', webhookRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start scheduler if enabled
  if (process.env.ENABLE_SCHEDULER !== 'false') {
    const scheduler = new SchedulerService();
    scheduler.start();
    console.log('✅ Scheduler started');
  }
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
