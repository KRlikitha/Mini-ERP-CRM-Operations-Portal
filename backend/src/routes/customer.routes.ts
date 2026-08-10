import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUp,
  createCustomerSchema,
  updateCustomerSchema,
  addFollowUpSchema,
} from '../controllers/customer.controller';
import { authenticateJWT, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomers);
router.get('/:id', requireRole(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), getCustomerById);
router.post('/', requireRole(['ADMIN', 'SALES']), validateRequest(createCustomerSchema), createCustomer);
router.put('/:id', requireRole(['ADMIN', 'SALES']), validateRequest(updateCustomerSchema), updateCustomer);
router.post('/:id/follow-ups', requireRole(['ADMIN', 'SALES']), validateRequest(addFollowUpSchema), addFollowUp);

export default router;
