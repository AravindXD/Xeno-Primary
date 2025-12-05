import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import crypto from "crypto";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Simple password hashing (SHA256) - in production use bcrypt
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  // 1. Create Tenant
  const tenantId = process.env.TENANT_ID || "DEMO_TENANT_ID";
  const storeName = process.env.STORE_NAME || "ara-test";
  const shopifyDomain = process.env.SHOPIFY_DOMAIN || "ara-test.myshopify.com";
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN || "DEMO_TOKEN";

  // Check if tenant exists by ID or shopifyDomain
  let tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    // Check by shopifyDomain in case it exists with different ID
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
    // Update tenant if needed
    tenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        storeName,
        accessToken,
      },
    });
    console.log(`ℹ️  Tenant already exists: ${tenant.storeName} (${tenant.id})\n`);
  }

  // 2. Create Admin Users
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

  // 3. Create Regular Users
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
      role: "admin", // User with admin role for their tenant
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

  console.log("✨ Seed completed successfully!\n");
  console.log("📋 Summary:");
  console.log(`  - Tenant: ${tenant.storeName}`);
  console.log(`  - Admins: ${admins.length}`);
  console.log(`  - Users: ${users.length}\n`);
  console.log("ℹ️  Note: This seed only creates users and admins.");
  console.log("   Run 'npm run prisma:seed-shopify' to sync data from Shopify.\n");
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
