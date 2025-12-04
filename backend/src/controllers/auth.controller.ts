import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Hash password using SHA256 (simple hashing for demo)
 * In production, use bcrypt or argon2
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify user credentials
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const hashedPassword = hashPassword(password);

    // Check admin first
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (admin && admin.password === hashedPassword) {
      return res.json({
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: 'admin',
          isSuperAdmin: admin.isSuperAdmin,
        },
      });
    }

    // Check regular user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (user && user.password === hashedPassword) {
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant?.storeName,
        },
      });
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
};

/**
 * Get user by email (for NextAuth)
 */
export const getUserByEmail = async (email: string) => {
  try {
    // Check admin
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (admin) {
      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
        isSuperAdmin: admin.isSuperAdmin,
      };
    }

    // Check user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true },
    });

    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.storeName,
      };
    }

    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

