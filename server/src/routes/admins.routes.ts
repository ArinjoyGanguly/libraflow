import { Router } from 'express';
import { AdminsController } from '../controllers/admins.controller';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/admins/stats and /api/admin/stats
router.get('/stats', AdminsController.getStats);

// GET /api/admins - list
router.get('/', AdminsController.listAdmins);

// GET /api/admins/:adminId - detail
router.get('/:adminId', AdminsController.getAdminById);

// POST /api/admins - create
router.post(
  '/',
  validateRequest({ requiredBodyFields: ['adminId', 'name', 'email'] }),
  AdminsController.createAdmin
);

// PUT /api/admins/:adminId - update
router.put('/:adminId', AdminsController.updateAdmin);

// DELETE /api/admins/:adminId - delete
router.delete('/:adminId', AdminsController.deleteAdmin);

export default router;
