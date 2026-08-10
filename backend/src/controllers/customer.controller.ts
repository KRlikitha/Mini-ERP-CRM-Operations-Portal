import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { AuthRequest } from '../middleware/auth';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Customer name must be at least 2 characters'),
    mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
    email: z.string().email('Invalid email address'),
    businessName: z.string().min(2, 'Business name is required'),
    gstNumber: z.string().optional().nullable(),
    customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
    address: z.string().min(5, 'Address is required'),
    status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
    followUpDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    mobile: z.string().min(10).optional(),
    email: z.string().email().optional(),
    businessName: z.string().min(2).optional(),
    gstNumber: z.string().optional().nullable(),
    customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
    address: z.string().min(5).optional(),
    status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
    followUpDate: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const addFollowUpSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Follow-up note cannot be empty'),
  }),
});

export const getCustomers = async (req: AuthRequest, res: Response) => {
  const { search, customerType, status, page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};

  if (customerType) {
    where.customerType = customerType as string;
  }
  if (status) {
    where.status = status as string;
  }
  if (search) {
    const s = search as string;
    where.OR = [
      { name: { contains: s } },
      { businessName: { contains: s } },
      { email: { contains: s } },
      { mobile: { contains: s } },
    ];
  }

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { followUps: true, challans: true },
        },
      },
    }),
  ]);

  res.json({
    data: customers,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      followUps: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
      },
      challans: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  res.json({ customer });
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  const data = req.body;

  const newCustomer = await prisma.customer.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      businessName: data.businessName,
      gstNumber: data.gstNumber || null,
      customerType: data.customerType,
      address: data.address,
      status: data.status || 'LEAD',
      followUpDate: data.followUpDate || null,
      notes: data.notes || null,
    },
  });

  res.status(201).json({
    message: 'Customer created successfully',
    customer: newCustomer,
  });
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const updatedCustomer = await prisma.customer.update({
    where: { id },
    data,
  });

  res.json({
    message: 'Customer updated successfully',
    customer: updatedCustomer,
  });
};

export const addFollowUp = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const followUp = await prisma.customerFollowUp.create({
    data: {
      customerId: id,
      note,
      createdById: req.user!.id,
    },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });

  res.status(201).json({
    message: 'Follow-up note added',
    followUp,
  });
};
