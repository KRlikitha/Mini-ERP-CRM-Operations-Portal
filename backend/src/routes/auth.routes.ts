import { Router } from 'express';
import { login, getMe, loginSchema } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.post('/login', validateRequest(loginSchema), login);
router.get('/me', authenticateJWT, getMe);

export default router;
