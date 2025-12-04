import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { ShopifyService } from './shopify.service';

const prisma = new PrismaClient();

/**
 * Scheduler service to automatically sync Shopify data for all tenants
 * Runs every hour by default (configurable via CRON_SCHEDULE env var)
 */
export class SchedulerService {
  private task: cron.ScheduledTask | null = null;
  private schedule: string;

  constructor() {
    // Default: Run every hour at minute 0
    // Format: minute hour day month day-of-week
    this.schedule = process.env.CRON_SCHEDULE || '0 * * * *';
  }

  /**
   * Start the scheduler
   */
  start() {
    console.log(`🕐 Starting scheduler with schedule: ${this.schedule}`);
    
    this.task = cron.schedule(this.schedule, async () => {
      console.log(`⏰ Scheduled sync started at ${new Date().toISOString()}`);
      await this.syncAllTenants();
    });

    // Run immediately on start (optional)
    if (process.env.SYNC_ON_START === 'true') {
      console.log('🔄 Running initial sync on startup...');
      this.syncAllTenants();
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      console.log('🛑 Scheduler stopped');
    }
  }

  /**
   * Sync data for all active tenants
   */
  private async syncAllTenants() {
    try {
      const tenants = await prisma.tenant.findMany();
      console.log(`📊 Found ${tenants.length} tenant(s) to sync`);

      for (const tenant of tenants) {
        try {
          console.log(`🔄 Syncing tenant: ${tenant.storeName} (${tenant.id})`);
          await this.syncTenant(tenant.id);
          console.log(`✅ Successfully synced tenant: ${tenant.storeName}`);
        } catch (error: any) {
          console.error(`❌ Failed to sync tenant ${tenant.storeName}:`, error.message);
          // Continue with other tenants even if one fails
        }
      }

      console.log(`✅ Scheduled sync completed at ${new Date().toISOString()}`);
    } catch (error: any) {
      console.error('❌ Scheduler error:', error);
    }
  }

  /**
   * Sync data for a specific tenant
   */
  private async syncTenant(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    const shopify = new ShopifyService({
      shopName: tenant.shopifyDomain,
      accessToken: tenant.accessToken,
    });

    // Sync Customers
    const { customers } = await shopify.getCustomers();
    for (const customer of customers) {
      const email = customer.email || `customer-${customer.id}@shopify.noemail`;
      await prisma.customer.upsert({
        where: {
          shopifyId_tenantId: {
            shopifyId: customer.id.toString(),
            tenantId: tenant.id,
          }
        },
        update: {
          email: email,
          firstName: customer.first_name || null,
          lastName: customer.last_name || null,
          totalSpent: parseFloat(customer.total_spent) || 0.0,
          ordersCount: customer.orders_count || 0,
        },
        create: {
          shopifyId: customer.id.toString(),
          tenantId: tenant.id,
          email: email,
          firstName: customer.first_name || null,
          lastName: customer.last_name || null,
          totalSpent: parseFloat(customer.total_spent) || 0.0,
          ordersCount: customer.orders_count || 0,
        },
      });
    }

    // Sync Products
    const { products } = await shopify.getProducts();
    for (const product of products) {
      await prisma.product.upsert({
        where: {
          shopifyId_tenantId: {
            shopifyId: product.id.toString(),
            tenantId: tenant.id
          }
        },
        update: {
          title: product.title || 'Untitled Product',
          bodyHtml: product.body_html || null,
          vendor: product.vendor || null,
          productType: product.product_type || null
        },
        create: {
          shopifyId: product.id.toString(),
          tenantId: tenant.id,
          title: product.title || 'Untitled Product',
          bodyHtml: product.body_html || null,
          vendor: product.vendor || null,
          productType: product.product_type || null
        }
      });
    }

    // Sync Orders
    const { orders } = await shopify.getOrders();
    for (const order of orders) {
      let customerId = null;
      if (order.customer) {
        const dbCustomer = await prisma.customer.findUnique({
          where: {
            shopifyId_tenantId: {
              shopifyId: order.customer.id.toString(),
              tenantId: tenant.id
            }
          }
        });
        customerId = dbCustomer?.id;
      }

      await prisma.order.upsert({
        where: {
          shopifyId_tenantId: {
            shopifyId: order.id.toString(),
            tenantId: tenant.id,
          }
        },
        update: {
          totalPrice: parseFloat(order.total_price) || 0.0,
          financialStatus: order.financial_status || null,
          processedAt: order.processed_at ? new Date(order.processed_at) : null,
          customerId: customerId
        },
        create: {
          shopifyId: order.id.toString(),
          tenantId: tenant.id,
          orderNumber: order.order_number || 0,
          totalPrice: parseFloat(order.total_price) || 0.0,
          currency: order.currency || 'USD',
          financialStatus: order.financial_status || null,
          processedAt: order.processed_at ? new Date(order.processed_at) : null,
          customerId: customerId
        },
      });
    }
  }
}

