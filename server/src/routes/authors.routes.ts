import { Router } from 'express';
import { AuthorsController } from '../controllers/authors.controller';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/authors - list with pagination & search
router.get('/', AuthorsController.listAuthors);

// GET /api/authors/:authorId - detail
router.get('/:authorId', AuthorsController.getAuthorById);

// POST /api/authors - create
router.post(
  '/',
  validateRequest({ requiredBodyFields: ['authorId', 'name', 'email'] }),
  AuthorsController.createAuthor
);

// PUT /api/authors/:authorId - update
router.put('/:authorId', AuthorsController.updateAuthor);

// DELETE /api/authors/:authorId - delete
router.delete('/:authorId', AuthorsController.deleteAuthor);

export default router;
