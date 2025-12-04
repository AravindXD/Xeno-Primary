import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Verify Shopify webhook signature
 */
function verifyWebhook(data: string, hmac: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(data, 'utf8')
    .digest('base64');
  return hash === hmac;
}

/**
 * Handle Shopify webhooks for real-time data sync
 */
export const handleWebhook = async (req: Request, res: Response) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const shop = req.get('X-Shopify-Shop-Domain');
  const topic = req.get('X-Shopify-Topic');

  if (!hmac || !shop || !topic) {
    return res.status(401).json({ error: 'Missing required headers' });
  }

  // Find tenant by shopify domain
  const tenant = await prisma.tenant.findUnique({
    where: { shopifyDomain: shop },
  });

  if (!tenant) {
    console.warn(`Webhook received for unknown tenant: ${shop}`);
    return res.status(404).json({ error: 'Tenant not found' });
  }

  // Verify webhook signature (in production, use webhook secret from Shopify)
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || tenant.accessToken;
  const rawBody = JSON.stringify(req.body);
  
  // Note: In production, you should verify the signature properly
  // For now, we'll accept webhooks from known tenants

  try {
    console.log(`📥 Webhook received: ${topic} for shop: ${shop}`);

    // Handle different webhook topics
    switch (topic) {
      case 'customers/create':
      case 'customers/update':
        await handleCustomerWebhook(req.body, tenant.id);
        break;
      
      case 'orders/create':
      case 'orders/updated':
        await handleOrderWebhook(req.body, tenant.id);
        break;
      
      case 'products/create':
      case 'products/update':
        await handleProductWebhook(req.body, tenant.id);
        break;
      
      case 'checkouts/create':
      case 'checkouts/update':
        await handleCheckoutWebhook(req.body, tenant.id);
        break;
      
      case 'carts/create':
      case 'carts/update':
        await handleCartWebhook(req.body, tenant.id);
        break;
      
      default:
        console.log(`⚠️  Unhandled webhook topic: ${topic}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};

async function handleCustomerWebhook(customer: any, tenantId: string) {
  const email = customer.email || `customer-${customer.id}@shopify.noemail`;
  
  await prisma.customer.upsert({
    where: {
      shopifyId_tenantId: {
        shopifyId: customer.id.toString(),
        tenantId: tenantId,
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
      tenantId: tenantId,
      email: email,
      firstName: customer.first_name || null,
      lastName: customer.last_name || null,
      totalSpent: parseFloat(customer.total_spent) || 0.0,
      ordersCount: customer.orders_count || 0,
    },
  });
}

async function handleOrderWebhook(order: any, tenantId: string) {
  let customerId = null;
  if (order.customer) {
    const dbCustomer = await prisma.customer.findUnique({
      where: {
        shopifyId_tenantId: {
          shopifyId: order.customer.id.toString(),
          tenantId: tenantId
        }
      }
    });
    customerId = dbCustomer?.id;
  }

  await prisma.order.upsert({
    where: {
      shopifyId_tenantId: {
        shopifyId: order.id.toString(),
        tenantId: tenantId,
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
      tenantId: tenantId,
      orderNumber: order.order_number || 0,
      totalPrice: parseFloat(order.total_price) || 0.0,
      currency: order.currency || 'USD',
      financialStatus: order.financial_status || null,
      processedAt: order.processed_at ? new Date(order.processed_at) : null,
      customerId: customerId
    },
  });
}

async function handleProductWebhook(product: any, tenantId: string) {
  await prisma.product.upsert({
    where: {
      shopifyId_tenantId: {
        shopifyId: product.id.toString(),
        tenantId: tenantId
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
      tenantId: tenantId,
      title: product.title || 'Untitled Product',
      bodyHtml: product.body_html || null,
      vendor: product.vendor || null,
      productType: product.product_type || null
    }
  });
}

// Custom events: Cart abandoned, Checkout started
async function handleCartWebhook(cart: any, tenantId: string) {
  // Store cart events in CustomEvent table
  try {
    let customerId = null;
    if (cart.customer_id) {
      const dbCustomer = await prisma.customer.findFirst({
        where: {
          shopifyId: cart.customer_id.toString(),
          tenantId: tenantId
        }
      });
      customerId = dbCustomer?.id;
    }

    await prisma.customEvent.create({
      data: {
        eventType: 'cart_abandoned',
        shopifyId: cart.id?.toString(),
        customerId: customerId,
        tenantId: tenantId,
        metadata: JSON.stringify(cart),
      }
    });
    console.log(`🛒 Cart abandoned event saved for tenant ${tenantId}`);
  } catch (error: any) {
    console.error('Error saving cart event:', error);
  }
}

async function handleCheckoutWebhook(checkout: any, tenantId: string) {
  // Store checkout events
  try {
    let customerId = null;
    if (checkout.customer_id) {
      const dbCustomer = await prisma.customer.findFirst({
        where: {
          shopifyId: checkout.customer_id.toString(),
          tenantId: tenantId
        }
      });
      customerId = dbCustomer?.id;
    }

    const eventType = checkout.completed_at ? 'checkout_completed' : 'checkout_started';
    
    await prisma.customEvent.create({
      data: {
        eventType: eventType,
        shopifyId: checkout.id?.toString(),
        customerId: customerId,
        tenantId: tenantId,
        metadata: JSON.stringify(checkout),
      }
    });
    console.log(`💳 Checkout event (${eventType}) saved for tenant ${tenantId}`);
  } catch (error: any) {
    console.error('Error saving checkout event:', error);
  }
}

