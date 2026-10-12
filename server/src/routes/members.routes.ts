import { Router } from 'express';
import { MembersController } from '../controllers/members.controller';
import { LoansController } from '../controllers/loans.controller';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/members - list
router.get('/', MembersController.listMembers);

// GET /api/members/:memberId/loans - member loan history
router.get('/:memberId/loans', LoansController.getMemberLoans);

// GET /api/members/:memberId - detail
router.get('/:memberId', MembersController.getMemberById);


// POST /api/members - create
router.post(
  '/',
  validateRequest({ requiredBodyFields: ['memberId', 'name', 'email'] }),
  MembersController.createMember
);

// PUT /api/members/:memberId - update
router.put('/:memberId', MembersController.updateMember);

// DELETE /api/members/:memberId - delete
router.delete('/:memberId', MembersController.deleteMember);

export default router;
