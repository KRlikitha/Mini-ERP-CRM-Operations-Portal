import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan,
  cancelChallan,
  downloadChallanPDF,
  createChallanSchema,
} from '../controllers/challan.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getChallans);
router.get('/:id', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getChallanById);
router.get('/:id/pdf', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), downloadChallanPDF);
router.post('/', requireRole(['ADMIN', 'SALES']), validateRequest(createChallanSchema), createChallan);
router.patch('/:id/confirm', requireRole(['ADMIN', 'SALES', 'ACCOUNTS']), confirmChallan);
router.patch('/:id/cancel', requireRole(['ADMIN', 'SALES', 'ACCOUNTS']), cancelChallan);

export default router;
