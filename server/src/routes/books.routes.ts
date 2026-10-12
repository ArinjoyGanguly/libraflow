import { Router } from 'express';
import { BooksController } from '../controllers/books.controller';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/books - list with filtering & pagination
router.get('/', BooksController.listBooks);

// GET /api/books/:bookId - detail
router.get('/:bookId', BooksController.getBookById);

// POST /api/books - create
router.post(
  '/',
  validateRequest({ requiredBodyFields: ['bookId', 'isbn', 'title', 'genre', 'language', 'year', 'totalCopies'] }),
  BooksController.createBook
);

// PUT /api/books/:bookId - update
router.put('/:bookId', BooksController.updateBook);

// DELETE /api/books/:bookId - delete
router.delete('/:bookId', BooksController.deleteBook);

export default router;
