import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';
import { generateChallanPDF } from '../utils/pdfGenerator';

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer is required'),
    status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
    items: z
      .array(
        z.object({
          productId: z.string().min(1, 'Product ID is required'),
          quantity: z.number().int().positive('Quantity must be greater than 0'),
        })
      )
      .min(1, 'At least one product item is required'),
  }),
});

// Helper to generate unique auto-incrementing style Challan Number (e.g. CH-2026-0001)
const generateChallanNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.salesChallan.count();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `CH-${year}-${nextNum}`;
};

export const getChallans = async (req: AuthRequest, res: Response) => {
  const { search, status, page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (status) {
    where.status = status as string;
  }
  if (search) {
    const s = search as string;
    where.OR = [
      { challanNumber: { contains: s } },
      { customer: { name: { contains: s } } },
      { customer: { businessName: { contains: s } } },
    ];
  }

  const [total, challans] = await Promise.all([
    prisma.salesChallan.count({ where }),
    prisma.salesChallan.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, businessName: true, mobile: true, email: true } },
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    }),
  ]);

  res.json({
    data: challans,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getChallanById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { id: true, name: true, role: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, currentStock: true } },
        },
      },
    },
  });

  if (!challan) {
    return res.status(404).json({ error: 'Sales Challan not found' });
  }

  res.json({ challan });
};

export const createChallan = async (req: AuthRequest, res: Response) => {
  const { customerId, status, items } = req.body;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  try {
    const challanNumber = await generateChallanNumber();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch product current state for snapshots & stock verification
      const productIds = items.map((i: any) => i.productId);
      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      // Verify all products exist
      for (const item of items) {
        if (!productMap.has(item.productId)) {
          throw new Error(`NOT_FOUND: Product with ID '${item.productId}' not found.`);
        }
      }

      // If CONFIRMED, verify stock sufficiency
      if (status === 'CONFIRMED') {
        for (const item of items) {
          const prod = productMap.get(item.productId)!;
          if (prod.currentStock < item.quantity) {
            throw new Error(
              `INSUFFICIENT_STOCK: Insufficient stock for product '${prod.name}' (SKU: ${prod.sku}). Requested: ${item.quantity}, Available: ${prod.currentStock}.`
            );
          }
        }
      }

      // Prepare items snapshot & calculations
      let totalQty = 0;
      let totalAmt = 0;
      const challanItemsData = items.map((item: any) => {
        const prod = productMap.get(item.productId)!;
        const subtotal = prod.unitPrice * item.quantity;
        totalQty += item.quantity;
        totalAmt += subtotal;

        return {
          productId: item.productId,
          productNameSnapshot: prod.name,
          skuSnapshot: prod.sku,
          unitPriceSnapshot: prod.unitPrice,
          quantity: item.quantity,
          subtotal,
        };
      });

      // Create Sales Challan record
      const newChallan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity: totalQty,
          totalAmount: totalAmt,
          status,
          createdById: req.user!.id,
          items: {
            create: challanItemsData,
          },
        },
        include: {
          customer: true,
          items: true,
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      // If CONFIRMED, reduce stock and record OUT movements
      if (status === 'CONFIRMED') {
        for (const item of items) {
          const prod = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: prod.id },
            data: { currentStock: prod.currentStock - item.quantity },
          });

          await tx.stockMovement.create({
            data: {
              productId: prod.id,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan #${challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      return newChallan;
    });

    res.status(201).json({
      message: `Sales Challan ${challanNumber} created as ${status}`,
      challan: result,
    });
  } catch (error: any) {
    if (error.message?.startsWith('INSUFFICIENT_STOCK:')) {
      return res.status(400).json({ error: error.message.replace('INSUFFICIENT_STOCK: ', '') });
    }
    if (error.message?.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    }
    res.status(500).json({ error: 'Failed to create sales challan', details: error.message });
  }
};

export const confirmChallan = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const updatedChallan = await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.findUnique({
        where: { id },
        include: { items: true, customer: true },
      });

      if (!challan) {
        throw new Error('NOT_FOUND: Sales Challan not found.');
      }

      if (challan.status === 'CONFIRMED') {
        throw new Error('ALREADY_CONFIRMED: Challan is already confirmed.');
      }

      if (challan.status === 'CANCELLED') {
        throw new Error('CANCELLED: Cannot confirm a cancelled challan.');
      }

      // Check stock sufficiency for all items
      for (const item of challan.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (!prod) {
          throw new Error(`NOT_FOUND: Product '${item.productNameSnapshot}' no longer exists.`);
        }
        if (prod.currentStock < item.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK: Insufficient stock for product '${prod.name}' (SKU: ${prod.sku}). Requested: ${item.quantity}, Available: ${prod.currentStock}.`
          );
        }
      }

      // Deduct stock & create OUT stock movement logs
      for (const item of challan.items) {
        const prod = (await tx.product.findUnique({ where: { id: item.productId } }))!;
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: prod.currentStock - item.quantity },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan #${challan.challanNumber}`,
            createdById: req.user!.id,
          },
        });
      }

      // Update Challan Status to CONFIRMED
      return await tx.salesChallan.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: {
          customer: true,
          items: true,
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });
    });

    res.json({
      message: `Sales Challan #${updatedChallan.challanNumber} confirmed successfully. Stock deducted.`,
      challan: updatedChallan,
    });
  } catch (error: any) {
    if (error.message?.startsWith('INSUFFICIENT_STOCK:')) {
      return res.status(400).json({ error: error.message.replace('INSUFFICIENT_STOCK: ', '') });
    }
    if (error.message?.startsWith('ALREADY_CONFIRMED:') || error.message?.startsWith('CANCELLED:')) {
      return res.status(400).json({ error: error.message.split(': ')[1] });
    }
    if (error.message?.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    }
    res.status(500).json({ error: 'Failed to confirm challan', details: error.message });
  }
};

export const cancelChallan = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const cancelledChallan = await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!challan) {
        throw new Error('NOT_FOUND: Sales Challan not found.');
      }

      if (challan.status === 'CANCELLED') {
        throw new Error('ALREADY_CANCELLED: Challan is already cancelled.');
      }

      // If it was confirmed, revert stock with IN movements
      if (challan.status === 'CONFIRMED') {
        for (const item of challan.items) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: prod.currentStock + item.quantity },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                movementType: 'IN',
                reason: `Cancellation of Sales Challan #${challan.challanNumber}`,
                createdById: req.user!.id,
              },
            });
          }
        }
      }

      return await tx.salesChallan.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { customer: true, items: true },
      });
    });

    res.json({
      message: `Sales Challan #${cancelledChallan.challanNumber} cancelled.`,
      challan: cancelledChallan,
    });
  } catch (error: any) {
    if (error.message?.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    }
    if (error.message?.startsWith('ALREADY_CANCELLED:')) {
      return res.status(400).json({ error: error.message.replace('ALREADY_CANCELLED: ', '') });
    }
    res.status(500).json({ error: 'Failed to cancel challan', details: error.message });
  }
};

export const downloadChallanPDF = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });

  if (!challan) {
    return res.status(404).json({ error: 'Sales Challan not found' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Challan-${challan.challanNumber}.pdf"`
  );

  generateChallanPDF(challan, res);
};
