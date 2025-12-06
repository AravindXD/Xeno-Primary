import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import { ShopifyService } from "../src/services/shopify.service";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Syncing data from Shopify to database (no creation)...\n");

  // Get tenant config
  const tenantId = process.env.TENANT_ID || "DEMO_TENANT_ID";
  const shopifyDomain = process.env.SHOPIFY_DOMAIN || "ara-test.myshopify.com";
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || "DEMO_TOKEN";

  if (accessToken === "DEMO_TOKEN") {
    console.error("❌ ERROR: SHOPIFY_ACCESS_TOKEN is required!");
    process.exit(1);
  }

  // Get tenant
  let tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    tenant = await prisma.tenant.findUnique({
      where: { shopifyDomain },
    });
  }

  if (!tenant) {
    console.error("❌ ERROR: Tenant not found! Run 'npx prisma db seed' first.");
    process.exit(1);
  }

  console.log(`📦 Syncing for tenant: ${tenant.storeName}\n`);

  // Initialize Shopify service
  const shopify = new ShopifyService({
    shopName: tenant.shopifyDomain,
    accessToken: tenant.accessToken,
  });

  try {
    // Sync Customers
    console.log("👥 Syncing customers...");
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
    console.log(`  ✅ Synced ${customers.length} customers\n`);

    // Sync Products
    console.log("📦 Syncing products...");
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
    console.log(`  ✅ Synced ${products.length} products\n`);

    // Sync Orders
    console.log("🛒 Syncing orders...");
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
          orderNumber: order.order_number || 0,
          totalPrice: parseFloat(order.total_price) || 0.0,
          currency: order.currency || 'USD',
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
    console.log(`  ✅ Synced ${orders.length} orders\n`);

    console.log("✨ Sync completed successfully!\n");
    console.log("📋 Summary:");
    console.log(`  - Customers: ${customers.length}`);
    console.log(`  - Products: ${products.length}`);
    console.log(`  - Orders: ${orders.length}\n`);
  } catch (error: any) {
    console.error("❌ Sync error:", error.message);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

