import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import crypto from "crypto";
import { ShopifyService } from "../src/services/shopify.service";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Simple password hashing (SHA256) - in production use bcrypt
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log("🌱 Starting Shopify seed (creates data in Shopify, then syncs to DB)...\n");

  // 1. Setup Tenant
  const tenantId = process.env.TENANT_ID || "DEMO_TENANT_ID";
  const storeName = process.env.STORE_NAME || "ara-test";
  const shopifyDomain = process.env.SHOPIFY_DOMAIN || "ara-test.myshopify.com";
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || "DEMO_TOKEN";

  if (accessToken === "DEMO_TOKEN") {
    console.error("❌ ERROR: SHOPIFY_ACCESS_TOKEN is required to seed Shopify data!");
    console.error("   Please set a valid Shopify access token in your .env file.");
    process.exit(1);
  }

  // Check if tenant exists
  let tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    tenant = await prisma.tenant.findUnique({
      where: { shopifyDomain },
    });
  }

  if (!tenant) {
    console.log("📦 Creating tenant...");
    tenant = await prisma.tenant.create({
      data: {
        id: tenantId,
        storeName,
        shopifyDomain,
        accessToken,
      },
    });
    console.log(`✅ Tenant created: ${tenant.storeName} (${tenant.id})\n`);
  } else {
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        storeName,
        accessToken,
      },
    });
    console.log(`ℹ️  Tenant already exists: ${tenant.storeName}\n`);
  }

  // Initialize Shopify service
  const shopify = new ShopifyService({
    shopName: tenant.shopifyDomain,
    accessToken: tenant.accessToken,
  });

  // 2. Create Admin Users (in database only)
  console.log("👑 Creating admin users...");
  
  const admins = [
    {
      email: "admin@xeno.com",
      password: "admin123",
      name: "Super Admin",
      isSuperAdmin: true,
    },
    {
      email: "admin2@xeno.com",
      password: "admin123",
      name: "Admin User",
      isSuperAdmin: false,
    },
  ];

  for (const adminData of admins) {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminData.email },
    });

    if (!existingAdmin) {
      await prisma.admin.create({
        data: {
          email: adminData.email,
          password: hashPassword(adminData.password),
          name: adminData.name,
          isSuperAdmin: adminData.isSuperAdmin,
        },
      });
      console.log(`  ✅ Admin created: ${adminData.email} (password: ${adminData.password})`);
    } else {
      console.log(`  ℹ️  Admin already exists: ${adminData.email}`);
    }
  }
  console.log("");

  // 3. Create Regular Users (in database only)
  console.log("👤 Creating regular users...");
  
  const users = [
    {
      email: "user@xeno.com",
      password: "user123",
      name: "John Doe",
      role: "user",
      tenantId: tenant.id,
    },
    {
      email: "manager@xeno.com",
      password: "manager123",
      name: "Jane Smith",
      role: "admin",
      tenantId: tenant.id,
    },
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: userData.email,
          password: hashPassword(userData.password),
          name: userData.name,
          role: userData.role,
          tenantId: userData.tenantId,
        },
      });
      console.log(`  ✅ User created: ${userData.email} (password: ${userData.password}, role: ${userData.role})`);
    } else {
      console.log(`  ℹ️  User already exists: ${userData.email}`);
    }
  }
  console.log("");

  // 4. Create Products in Shopify
  console.log("📦 Creating products in Shopify...");
  
  const productsToCreate = [
    {
      title: "Premium T-Shirt",
      body_html: "<p>High-quality cotton t-shirt with comfortable fit</p>",
      vendor: "Fashion Co",
      product_type: "Apparel",
      variants: [{ price: "29.99", inventory_quantity: 100 }],
    },
    {
      title: "Wireless Headphones",
      body_html: "<p>Noise-cancelling wireless headphones with 30-hour battery</p>",
      vendor: "Tech Inc",
      product_type: "Electronics",
      variants: [{ price: "149.99", inventory_quantity: 50 }],
    },
    {
      title: "Coffee Maker",
      body_html: "<p>Automatic drip coffee maker with programmable timer</p>",
      vendor: "Home Essentials",
      product_type: "Appliances",
      variants: [{ price: "79.99", inventory_quantity: 30 }],
    },
    {
      title: "Running Shoes",
      body_html: "<p>Comfortable athletic shoes perfect for running and walking</p>",
      vendor: "Sport Gear",
      product_type: "Footwear",
      variants: [{ price: "89.99", inventory_quantity: 75 }],
    },
    {
      title: "Laptop Stand",
      body_html: "<p>Ergonomic aluminum laptop stand for better posture</p>",
      vendor: "Tech Inc",
      product_type: "Accessories",
      variants: [{ price: "49.99", inventory_quantity: 40 }],
    },
  ];

  const createdProducts: any[] = [];
  for (const productData of productsToCreate) {
    try {
      const response = await shopify.createProduct(productData);
      const product = response.product;
      createdProducts.push(product);
      console.log(`  ✅ Created product: ${product.title} (ID: ${product.id})`);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`  ❌ Failed to create product ${productData.title}:`, error.response?.data || error.message);
    }
  }
  console.log(`\n✅ Created ${createdProducts.length} products in Shopify\n`);

  // 5. Create Customers in Shopify (or use existing ones)
  console.log("👥 Creating/fetching customers in Shopify...");
  
  // Use timestamp to make emails unique on each run
  const timestamp = Date.now();
  const customersToCreate = [
    {
      email: `alice.johnson.${timestamp}@example.com`,
      first_name: "Alice",
      last_name: "Johnson",
    },
    {
      email: `bob.williams.${timestamp}@example.com`,
      first_name: "Bob",
      last_name: "Williams",
    },
    {
      email: `charlie.brown.${timestamp}@example.com`,
      first_name: "Charlie",
      last_name: "Brown",
    },
    {
      email: `diana.davis.${timestamp}@example.com`,
      first_name: "Diana",
      last_name: "Davis",
    },
    {
      email: `eve.miller.${timestamp}@example.com`,
      first_name: "Eve",
      last_name: "Miller",
    },
  ];

  const createdCustomers: any[] = [];
  for (const customerData of customersToCreate) {
    try {
      const response = await shopify.createCustomer(customerData);
      const customer = response.customer;
      createdCustomers.push(customer);
      console.log(`  ✅ Created customer: ${customer.first_name} ${customer.last_name} (ID: ${customer.id})`);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      // If customer already exists, try to fetch existing customers from Shopify
      if (error.response?.data?.errors?.email) {
        console.log(`  ℹ️  Customer ${customerData.email} already exists, will use existing customers for orders`);
      } else {
        console.error(`  ❌ Failed to create customer ${customerData.email}:`, error.response?.data || error.message);
      }
    }
  }

  // If we didn't create enough customers, fetch existing ones from Shopify
  if (createdCustomers.length < 3) {
    try {
      const { customers } = await shopify.getCustomers();
      // Add existing customers to the array (up to 5 total)
      for (const existingCustomer of customers.slice(0, 5 - createdCustomers.length)) {
        if (!createdCustomers.find(c => c.id === existingCustomer.id)) {
          createdCustomers.push(existingCustomer);
        }
      }
      console.log(`  ℹ️  Using ${createdCustomers.length} total customers (${createdCustomers.length - customersToCreate.length} existing)`);
    } catch (error: any) {
      console.error(`  ⚠️  Could not fetch existing customers:`, error.message);
    }
  }
  
  console.log(`\n✅ Ready with ${createdCustomers.length} customers for orders\n`);

  // 6. Create Orders in Shopify (requires products and customers)
  console.log("🛒 Creating orders in Shopify...");
  
  const createdOrders: any[] = [];
  if (createdProducts.length === 0) {
    console.log("  ⚠️  Skipping orders - need products first");
  } else if (createdCustomers.length === 0) {
    // Try to fetch existing customers from Shopify
    try {
      const { customers } = await shopify.getCustomers();
      if (customers.length > 0) {
        createdCustomers.push(...customers.slice(0, 5));
        console.log(`  ℹ️  Using ${createdCustomers.length} existing customers from Shopify`);
      } else {
        console.log("  ⚠️  Skipping orders - no customers available");
      }
    } catch (error: any) {
      console.log("  ⚠️  Skipping orders - could not fetch customers");
    }
  }
  
  if (createdProducts.length > 0 && createdCustomers.length > 0) {
    // Get product variants for orders
    const productVariants: any[] = [];
    for (const product of createdProducts) {
      try {
        const productDetails = await shopify.getProductVariants(product.id);
        if (productDetails.product?.variants && productDetails.product.variants.length > 0) {
          productVariants.push({
            productId: product.id,
            variantId: productDetails.product.variants[0].id,
            price: productDetails.product.variants[0].price,
          });
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`  ⚠️  Could not get variants for product ${product.id}`);
      }
    }

    const ordersToCreate = [
      {
        line_items: [{ variant_id: productVariants[0]?.variantId || 0, quantity: 2 }],
        customer: { id: createdCustomers[0]?.id },
        financial_status: "paid",
        total_price: (parseFloat(productVariants[0]?.price || "0") * 2).toFixed(2),
        currency: "USD",
      },
      {
        line_items: [{ variant_id: productVariants[1]?.variantId || 0, quantity: 1 }],
        customer: { id: createdCustomers[1]?.id },
        financial_status: "paid",
        total_price: productVariants[1]?.price || "0",
        currency: "USD",
      },
      {
        line_items: [{ variant_id: productVariants[2]?.variantId || 0, quantity: 1 }],
        customer: { id: createdCustomers[2]?.id },
        financial_status: "pending",
        total_price: productVariants[2]?.price || "0",
        currency: "USD",
      },
      {
        line_items: [{ variant_id: productVariants[0]?.variantId || 0, quantity: 1 }],
        customer: { id: createdCustomers[0]?.id },
        financial_status: "paid",
        total_price: productVariants[0]?.price || "0",
        currency: "USD",
      },
      {
        line_items: [{ variant_id: productVariants[3]?.variantId || 0, quantity: 1 }],
        customer: { id: createdCustomers[4]?.id },
        financial_status: "paid",
        total_price: productVariants[3]?.price || "0",
        currency: "USD",
      },
    ].filter(order => order.line_items[0].variant_id > 0); // Only create orders with valid variants

    for (const orderData of ordersToCreate) {
      try {
        const response = await shopify.createOrder(orderData);
        const order = response.order;
        createdOrders.push(order);
        console.log(`  ✅ Created order: #${order.order_number} (ID: ${order.id}, Total: $${order.total_price})`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay for orders
      } catch (error: any) {
        console.error(`  ❌ Failed to create order:`, error.response?.data || error.message);
      }
    }
    console.log(`\n✅ Created ${createdOrders.length} orders in Shopify\n`);
  }

  // 7. Now sync all data from Shopify to database
  console.log("🔄 Syncing data from Shopify to database...\n");
  
  try {
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
    console.log(`  ✅ Synced ${customers.length} customers to database`);

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
    console.log(`  ✅ Synced ${products.length} products to database`);

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
    console.log(`  ✅ Synced ${orders.length} orders to database\n`);
  } catch (error: any) {
    console.error("  ❌ Sync error:", error.message);
  }

  console.log("✨ Shopify seed completed successfully!\n");
  console.log("📋 Summary:");
  console.log(`  - Tenant: ${tenant.storeName}`);
  console.log(`  - Admins: ${admins.length}`);
  console.log(`  - Users: ${users.length}`);
  console.log(`  - Products created in Shopify: ${createdProducts.length}`);
  console.log(`  - Customers created in Shopify: ${createdCustomers.length}`);
  console.log(`  - Orders created in Shopify: ${createdOrders.length || 0}\n`);
  console.log("🔐 Login Credentials:");
  console.log("  Admin: admin@xeno.com / admin123");
  console.log("  User: user@xeno.com / user123");
  console.log("  Manager: manager@xeno.com / manager123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

