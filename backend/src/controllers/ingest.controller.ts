import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ShopifyService } from '../services/shopify.service';

const prisma = new PrismaClient();

export const syncData = async (req: Request, res: Response) => {
  const { tenantId } = req.body;

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  try {
    // 1. Fetch Tenant Config
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const shopify = new ShopifyService({
      shopName: tenant.shopifyDomain,
      accessToken: tenant.accessToken,
    });

    // 2. Sync Customers
    const { customers } = await shopify.getCustomers();
    for (const customer of customers) {
      // Handle missing email - Shopify customers might not have email
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

    // 3. Sync Products
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

    // 4. Sync Orders
    const { orders } = await shopify.getOrders();
    for (const order of orders) {
      // Find customer if exists
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

    res.json({ message: 'Sync completed successfully', stats: {
        customers: customers.length,
        products: products.length,
        orders: orders.length
    }});
  } catch (error: any) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: 'Failed to sync data', details: error.message });
  }
};
