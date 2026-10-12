import { Router } from 'express';
import { LibrariesController } from '../controllers/libraries.controller';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/libraries - list
router.get('/', LibrariesController.listLibraries);

// GET /api/libraries/:libraryId - detail
router.get('/:libraryId', LibrariesController.getLibraryById);

// POST /api/libraries - create
router.post(
  '/',
  validateRequest({ requiredBodyFields: ['libraryId', 'name', 'address', 'city'] }),
  LibrariesController.createLibrary
);

// PUT /api/libraries/:libraryId - update
router.put('/:libraryId', LibrariesController.updateLibrary);

// DELETE /api/libraries/:libraryId - delete
router.delete('/:libraryId', LibrariesController.deleteLibrary);

export default router;
