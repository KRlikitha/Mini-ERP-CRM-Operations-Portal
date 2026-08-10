import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    sku: z.string().min(2, 'SKU/Code is required'),
    category: z.string().min(1, 'Category is required'),
    unitPrice: z.number().positive('Unit price must be positive'),
    currentStock: z.number().int().min(0, 'Stock cannot be negative'),
    minStockAlert: z.number().int().min(0, 'Min stock alert quantity must be non-negative'),
    location: z.string().min(1, 'Warehouse location is required'),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    sku: z.string().min(2).optional(),
    category: z.string().min(1).optional(),
    unitPrice: z.number().positive().optional(),
    currentStock: z.number().int().min(0).optional(),
    minStockAlert: z.number().int().min(0).optional(),
    location: z.string().min(1).optional(),
  }),
});

export const stockAdjustmentSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive('Quantity must be greater than 0'),
    movementType: z.enum(['IN', 'OUT']),
    reason: z.string().min(2, 'Reason is required'),
  }),
});

export const getProducts = async (req: AuthRequest, res: Response) => {
  const { search, category, lowStock, page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (category) {
    where.category = category as string;
  }

  if (search) {
    const s = search as string;
    where.OR = [
      { name: { contains: s } },
      { sku: { contains: s } },
      { category: { contains: s } },
    ];
  }

  let products = await prisma.product.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: { updatedAt: 'desc' },
  });

  if (lowStock === 'true') {
    products = products.filter((p) => p.currentStock <= p.minStockAlert);
  }

  const total = await prisma.product.count({ where });

  res.json({
    data: products,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ product });
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  const data = req.body;

  const existing = await prisma.product.findUnique({
    where: { sku: data.sku },
  });

  if (existing) {
    return res.status(400).json({ error: `Product with SKU '${data.sku}' already exists.` });
  }

  const product = await prisma.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unitPrice: data.unitPrice,
        currentStock: data.currentStock,
        minStockAlert: data.minStockAlert,
        location: data.location,
      },
    });

    if (data.currentStock > 0) {
      await tx.stockMovement.create({
        data: {
          productId: p.id,
          quantity: data.currentStock,
          movementType: 'IN',
          reason: 'Initial stock entry',
          createdById: req.user!.id,
        },
      });
    }

    return p;
  });

  res.status(201).json({
    message: 'Product created successfully',
    product,
  });
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (data.sku && data.sku !== existing.sku) {
    const skuCheck = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (skuCheck) {
      return res.status(400).json({ error: `SKU '${data.sku}' is already taken.` });
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data,
  });

  res.json({
    message: 'Product updated successfully',
    product: updatedProduct,
  });
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantity, movementType, reason } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) {
        throw new Error('NOT_FOUND: Product not found');
      }

      let newStock = product.currentStock;
      if (movementType === 'IN') {
        newStock += quantity;
      } else if (movementType === 'OUT') {
        if (product.currentStock < quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK: Current stock (${product.currentStock}) is insufficient for OUT adjustment of ${quantity}.`
          );
        }
        newStock -= quantity;
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId: id,
          quantity,
          movementType,
          reason,
          createdById: req.user!.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      return { updatedProduct, movement };
    });

    res.json({
      message: `Stock adjusted successfully (${movementType} ${quantity})`,
      product: result.updatedProduct,
      movement: result.movement,
    });
  } catch (error: any) {
    if (error.message.startsWith('NOT_FOUND:')) {
      return res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
    }
    if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
      return res.status(400).json({ error: error.message.replace('INSUFFICIENT_STOCK: ', '') });
    }
    res.status(500).json({ error: 'Failed to adjust stock', details: error.message });
  }
};

export const getStockMovements = async (req: AuthRequest, res: Response) => {
  const { productId, movementType, page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  if (productId) where.productId = productId as string;
  if (movementType) where.movementType = movementType as string;

  const [total, movements] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
    }),
  ]);

  res.json({
    data: movements,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};
