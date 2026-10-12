import { Request, Response, NextFunction } from 'express';
import { LibrariesService } from '../services/libraries.service';
import { sendSuccess } from '../utils/response';
import { CreateLibraryInput, UpdateLibraryInput } from '../types';

export class LibrariesController {
  static async listLibraries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await LibrariesService.listLibraries(req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getLibraryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { libraryId } = req.params;
      const library = await LibrariesService.getLibraryById(libraryId);
      sendSuccess(res, library);
    } catch (err) {
      next(err);
    }
  }

  static async createLibrary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateLibraryInput = req.body;
      const created = await LibrariesService.createLibrary(input);
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateLibrary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { libraryId } = req.params;
      const input: UpdateLibraryInput = req.body;
      const updated = await LibrariesService.updateLibrary(libraryId, input);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteLibrary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { libraryId } = req.params;
      await LibrariesService.deleteLibrary(libraryId);
      sendSuccess(res, { message: `Library '${libraryId}' successfully deleted` }, 200);
    } catch (err) {
      next(err);
    }
  }
}
