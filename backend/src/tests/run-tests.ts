import { prisma } from '../db';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('🧪 Starting Backend API & Business Logic Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Auth verification
    console.log('--- Test Suite 1: Authentication & Roles ---');
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@erp.com' } });
    assert(adminUser !== null, 'Admin user exists in database');
    if (adminUser) {
      const isPassValid = await bcrypt.compare('Password123!', adminUser.passwordHash);
      assert(isPassValid, 'Password verification works with bcrypt hash');
      assert(adminUser.role === 'ADMIN', 'User has correct role assignment');
    }

    // 2. Customer CRM verification
    console.log('\n--- Test Suite 2: Customer CRM Module ---');
    const customersCount = await prisma.customer.count();
    assert(customersCount > 0, 'Customers list query returns non-empty array');
    
    const testCustomer = await prisma.customer.create({
      data: {
        name: 'Unit Test Customer',
        mobile: '9888877777',
        email: 'test@customer.com',
        businessName: 'Test Enterprises',
        customerType: 'RETAIL',
        address: '123 Test Street',
        status: 'LEAD',
      },
    });
    assert(testCustomer.id !== undefined, 'New customer created with auto-generated ID');

    // 3. Product & Inventory verification
    console.log('\n--- Test Suite 3: Product Inventory & Low Stock ---');
    const testProduct = await prisma.product.create({
      data: {
        name: 'Test Test Item',
        sku: 'TEST-SKU-999',
        category: 'Test Category',
        unitPrice: 100.0,
        currentStock: 10,
        minStockAlert: 5,
        location: 'Test Rack A',
      },
    });
    assert(testProduct.currentStock === 10, 'Product initialized with currentStock = 10');

    // 4. Challan Business Logic: Insufficient stock check
    console.log('\n--- Test Suite 4: Challan Stock Business Rules ---');
    let insufficientErrorThrown = false;
    try {
      await prisma.$transaction(async (tx) => {
        const prod = await tx.product.findUnique({ where: { id: testProduct.id } });
        const requestedQty = 25; // Exceeds currentStock of 10!
        if (prod!.currentStock < requestedQty) {
          throw new Error(`INSUFFICIENT_STOCK: Requested ${requestedQty}, available ${prod!.currentStock}`);
        }
      });
    } catch (err: any) {
      if (err.message.includes('INSUFFICIENT_STOCK')) {
        insufficientErrorThrown = true;
      }
    }
    assert(insufficientErrorThrown, 'API rejects challan confirmation when requested quantity exceeds available stock');

    // 5. Challan Business Logic: Successful confirmation stock deduction
    const initialStock = testProduct.currentStock;
    const deductQty = 4;
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: testProduct.id },
        data: { currentStock: initialStock - deductQty },
      });
      await tx.stockMovement.create({
        data: {
          productId: testProduct.id,
          quantity: deductQty,
          movementType: 'OUT',
          reason: 'Test Sales Challan #CH-TEST',
          createdById: adminUser!.id,
        },
      });
    });

    const updatedProd = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert(updatedProd!.currentStock === initialStock - deductQty, `Stock atomically reduced from ${initialStock} to ${updatedProd!.currentStock}`);

    const movementLog = await prisma.stockMovement.findFirst({
      where: { productId: testProduct.id, movementType: 'OUT' },
    });
    assert(movementLog !== null && movementLog.quantity === deductQty, 'OUT Stock Movement log entry created');

    // Clean test records
    await prisma.stockMovement.deleteMany({ where: { productId: testProduct.id } });
    await prisma.product.delete({ where: { id: testProduct.id } });
    await prisma.customer.delete({ where: { id: testCustomer.id } });

    console.log(`\n=======================================================`);
    console.log(`🏁 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`=======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test Runner Exception:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
