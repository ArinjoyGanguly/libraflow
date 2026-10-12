import { Router } from 'express';
import { LoansController } from '../controllers/loans.controller';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/loans/overdue - list overdue loans (placed before :loanId to avoid route collision)
router.get('/overdue', LoansController.listOverdueLoans);

// GET /api/loans - list all loans with pagination and filters
router.get('/', LoansController.listLoans);

// GET /api/loans/:loanId - retrieve loan details
router.get('/:loanId', LoansController.getLoanById);

// POST /api/loans/issue and POST /api/loans - issue book
router.post(
  '/issue',
  validateRequest({ requiredBodyFields: ['memberId', 'bookId'] }),
  LoansController.issueBook
);

router.post(
  '/',
  validateRequest({ requiredBodyFields: ['memberId', 'bookId'] }),
  LoansController.issueBook
);

// POST /api/loans/:loanId/return and PUT /api/loans/:loanId/return - return book
router.post('/:loanId/return', LoansController.returnBook);
router.put('/:loanId/return', LoansController.returnBook);

export default router;
