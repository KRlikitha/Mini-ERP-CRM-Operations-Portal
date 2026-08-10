import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Clean existing records
  await prisma.challanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users for all 4 roles
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@erp.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sarah Sales Manager',
      email: 'sales@erp.com',
      passwordHash,
      role: 'SALES',
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Wally Warehouse Head',
      email: 'warehouse@erp.com',
      passwordHash,
      role: 'WAREHOUSE',
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Adam Accounts Executive',
      email: 'accounts@erp.com',
      passwordHash,
      role: 'ACCOUNTS',
    },
  });

  console.log('✅ 4 Role Users created (admin, sales, warehouse, accounts)');

  // 3. Create Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rajesh Sharma',
      mobile: '9876543210',
      email: 'rajesh@sharmatraders.com',
      businessName: 'Sharma Electronics & Hardware',
      gstNumber: '27AABCU9603R1ZM',
      customerType: 'WHOLESALE',
      address: 'Shop No 14, APMC Market, Vashi, Navi Mumbai, MH 400703',
      status: 'ACTIVE',
      followUpDate: '2026-08-15',
      notes: 'Key wholesale buyer. Requested 10% volume discount on cables next month.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Priya Patel',
      mobile: '9123456789',
      email: 'priya@apexretail.in',
      businessName: 'Apex General Store',
      gstNumber: '24AAACR1234A1Z1',
      customerType: 'RETAIL',
      address: '45 Commercial Street, Bengaluru, KA 560001',
      status: 'ACTIVE',
      followUpDate: '2026-08-12',
      notes: 'Weekly recurring buyer of retail LED bulb packs.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Amit Agarwal',
      mobile: '9988776655',
      email: 'contact@agarwaldistributors.com',
      businessName: 'Agarwal Pan-India Logistics',
      gstNumber: '07AAAAA9999B1Z2',
      customerType: 'DISTRIBUTOR',
      address: 'Plot 88, Okhla Industrial Area Phase III, New Delhi 110020',
      status: 'LEAD',
      followUpDate: '2026-08-11',
      notes: 'Interested in becoming regional distributor for North region.',
    },
  });

  console.log('✅ 3 Sample Customers created');

  // Customer Follow-ups
  await prisma.customerFollowUp.create({
    data: {
      customerId: customer1.id,
      note: 'Called Rajesh regarding outstanding payment. He promised payment by Friday.',
      createdById: salesUser.id,
    },
  });

  await prisma.customerFollowUp.create({
    data: {
      customerId: customer3.id,
      note: 'Sent product catalogue and tier pricing matrix via email.',
      createdById: salesUser.id,
    },
  });

  // 4. Create Sample Products
  const prod1 = await prisma.product.create({
    data: {
      name: 'Industrial Heavy Duty Copper Cable 3-Core (100m)',
      sku: 'CBL-COP-3C-100M',
      category: 'Electrical & Cables',
      unitPrice: 4500.0,
      currentStock: 45,
      minStockAlert: 10,
      location: 'Warehouse A - Shelf 12',
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'Smart Modular Switch Panel 8-Way',
      sku: 'SWT-MOD-8WAY',
      category: 'Electrical & Fittings',
      unitPrice: 850.0,
      currentStock: 120,
      minStockAlert: 25,
      location: 'Warehouse A - Shelf 04',
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: 'Commercial LED Floodlight 100W IP66',
      sku: 'LED-FLD-100W',
      category: 'Lighting',
      unitPrice: 1800.0,
      currentStock: 8, // Low stock!
      minStockAlert: 15,
      location: 'Warehouse B - Bin 08',
    },
  });

  const prod4 = await prisma.product.create({
    data: {
      name: 'Digital Multimeter Professional True RMS',
      sku: 'TOOL-DMM-RMS',
      category: 'Testing Equipment',
      unitPrice: 2200.0,
      currentStock: 30,
      minStockAlert: 5,
      location: 'Warehouse B - Cabinet 02',
    },
  });

  const prod5 = await prisma.product.create({
    data: {
      name: 'Automatic Voltage Stabilizer 5KVA',
      sku: 'PWR-STAB-5KVA',
      category: 'Power Equipment',
      unitPrice: 6500.0,
      currentStock: 4, // Low stock!
      minStockAlert: 10,
      location: 'Warehouse A - Heavy Rack 01',
    },
  });

  console.log('✅ 5 Sample Products created');

  // 5. Initial Stock Movement Logs
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: prod1.id,
        quantity: 50,
        movementType: 'IN',
        reason: 'Initial Factory Receiving Batch #F901',
        createdById: warehouseUser.id,
      },
      {
        productId: prod2.id,
        quantity: 120,
        movementType: 'IN',
        reason: 'Initial Factory Receiving Batch #F902',
        createdById: warehouseUser.id,
      },
      {
        productId: prod3.id,
        quantity: 20,
        movementType: 'IN',
        reason: 'Purchase Order #PO-8821',
        createdById: warehouseUser.id,
      },
      {
        productId: prod3.id,
        quantity: 12,
        movementType: 'OUT',
        reason: 'Damaged packaging disposal',
        createdById: warehouseUser.id,
      },
    ],
  });

  console.log('✅ Stock Movements logged');

  // 6. Create Sample Sales Challans
  // Challan 1: Confirmed
  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-0001',
      customerId: customer1.id,
      totalQuantity: 5,
      totalAmount: 4500 * 5,
      status: 'CONFIRMED',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: prod1.id,
            productNameSnapshot: prod1.name,
            skuSnapshot: prod1.sku,
            unitPriceSnapshot: prod1.unitPrice,
            quantity: 5,
            subtotal: 4500 * 5,
          },
        ],
      },
    },
  });

  // Challan 2: Draft
  const challan2 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-2026-0002',
      customerId: customer2.id,
      totalQuantity: 10,
      totalAmount: 850 * 10,
      status: 'DRAFT',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: prod2.id,
            productNameSnapshot: prod2.name,
            skuSnapshot: prod2.sku,
            unitPriceSnapshot: prod2.unitPrice,
            quantity: 10,
            subtotal: 850 * 10,
          },
        ],
      },
    },
  });

  console.log('✅ Sample Sales Challans created');

  console.log('\n🎉 Seeding Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('Test Logins (Password: Password123!):');
  console.log('1. Admin:     admin@erp.com');
  console.log('2. Sales:     sales@erp.com');
  console.log('3. Warehouse: warehouse@erp.com');
  console.log('4. Accounts:  accounts@erp.com');
  console.log('----------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding Database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
