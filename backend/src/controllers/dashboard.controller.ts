import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  const [
    totalCustomers,
    activeCustomers,
    leadCustomers,
    totalProducts,
    allProducts,
    totalChallans,
    confirmedChallans,
    recentChallans,
    recentMovements,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: 'ACTIVE' } }),
    prisma.customer.count({ where: { status: 'LEAD' } }),
    prisma.product.count(),
    prisma.product.findMany(),
    prisma.salesChallan.count(),
    prisma.salesChallan.findMany({ where: { status: 'CONFIRMED' } }),
    prisma.salesChallan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, businessName: true } },
      },
    }),
    prisma.stockMovement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { name: true, role: true } },
      },
    }),
  ]);

  const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlert);
  const totalRevenue = confirmedChallans.reduce((sum, c) => sum + c.totalAmount, 0);

  res.json({
    stats: {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        lead: leadCustomers,
      },
      inventory: {
        totalProducts,
        lowStockAlertsCount: lowStockProducts.length,
      },
      sales: {
        totalChallans,
        confirmedCount: confirmedChallans.length,
        totalRevenue,
      },
    },
    lowStockAlerts: lowStockProducts,
    recentChallans,
    recentMovements,
  });
};
