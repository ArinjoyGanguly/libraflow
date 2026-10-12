import { Router } from 'express';
import { RequestsController } from '../controllers/requests.controller';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/requests - list
router.get('/', RequestsController.listRequests);

// GET /api/requests/:requestId - detail
router.get('/:requestId', RequestsController.getRequestById);

// POST /api/requests - create
router.post(
  '/',
  validateRequest({ requiredBodyFields: ['requestId', 'memberId', 'bookId'] }),
  RequestsController.createRequest
);

// PUT /api/requests/:requestId - update
router.put('/:requestId', RequestsController.updateRequest);

// DELETE /api/requests/:requestId - delete
router.delete('/:requestId', RequestsController.deleteRequest);

export default router;
