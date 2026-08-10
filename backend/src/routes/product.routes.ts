import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  getStockMovements,
  createProductSchema,
  updateProductSchema,
  stockAdjustmentSchema,
} from '../controllers/product.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRole(['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS']), getProducts);
router.get('/stock-movements', requireRole(['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS']), getStockMovements);
router.get('/:id', requireRole(['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS']), getProductById);
router.post('/', requireRole(['ADMIN', 'WAREHOUSE']), validateRequest(createProductSchema), createProduct);
router.put('/:id', requireRole(['ADMIN', 'WAREHOUSE']), validateRequest(updateProductSchema), updateProduct);
router.post('/:id/adjust-stock', requireRole(['ADMIN', 'WAREHOUSE']), validateRequest(stockAdjustmentSchema), adjustStock);

export default router;
