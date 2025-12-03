import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
  const { tenantId, startDate, endDate } = req.query;

  if (!tenantId || typeof tenantId !== 'string') {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  try {
    // Build date filter if provided
    const dateFilter: any = { tenantId };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        dateFilter.createdAt.lte = new Date(endDate as string);
      }
    }

    // 1. Total Stats
    const totalCustomers = await prisma.customer.count({
      where: { tenantId },
    });

    const totalOrders = await prisma.order.count({
      where: dateFilter,
    });

    const totalRevenueResult = await prisma.order.aggregate({
      where: dateFilter,
      _sum: {
        totalPrice: true,
      },
    });
    const totalRevenue = totalRevenueResult._sum.totalPrice || 0;

    // 2. Orders by Date (for Trend Chart) with date filtering
    const orders = await prisma.order.findMany({
        where: dateFilter,
        select: { createdAt: true, totalPrice: true, financialStatus: true },
        orderBy: { createdAt: 'asc' }
    });

    const salesOverTime: Record<string, number> = {};
    const ordersByStatus: Record<string, number> = {};
    
    orders.forEach((order: {
        createdAt: Date;
        totalPrice: number;
        financialStatus: string | null;
    }) => {
        const date = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
        salesOverTime[date] = (salesOverTime[date] || 0) + order.totalPrice;
        
        const status = order.financialStatus || 'unknown';
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });

    const salesTrend = Object.entries(salesOverTime).map(([date, amount]) => ({
        date,
        amount
    }));

    // 3. Top Customers
    const topCustomers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { totalSpent: 'desc' },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        totalSpent: true,
        ordersCount: true,
      },
    });

    // 4. Additional Metrics
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalProducts = await prisma.product.count({
      where: { tenantId },
    });

    // 5. Recent Orders (last 10)
    const recentOrders = await prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        totalPrice: true,
        currency: true,
        financialStatus: true,
        createdAt: true,
      },
    });

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue,
      totalProducts,
      averageOrderValue,
      salesTrend,
      topCustomers,
      ordersByStatus,
      recentOrders,
    });
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
