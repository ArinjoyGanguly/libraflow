import { Router } from 'express';
import { PublishersController } from '../controllers/publishers.controller';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/publishers - list
router.get('/', PublishersController.listPublishers);

// GET /api/publishers/:publisherId - detail
router.get('/:publisherId', PublishersController.getPublisherById);

// POST /api/publishers - create
router.post(
  '/',
  validateRequest({ requiredBodyFields: ['publisherId', 'name'] }),
  PublishersController.createPublisher
);

// PUT /api/publishers/:publisherId - update
router.put('/:publisherId', PublishersController.updatePublisher);

// DELETE /api/publishers/:publisherId - delete
router.delete('/:publisherId', PublishersController.deletePublisher);

export default router;
