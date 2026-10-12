import { Request, Response, NextFunction } from 'express';
import { AuthorsService } from '../services/authors.service';
import { sendSuccess } from '../utils/response';
import { CreateAuthorInput, UpdateAuthorInput } from '../types';

export class AuthorsController {
  static async listAuthors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthorsService.listAuthors(req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getAuthorById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { authorId } = req.params;
      const author = await AuthorsService.getAuthorById(authorId);
      sendSuccess(res, author);
    } catch (err) {
      next(err);
    }
  }

  static async createAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateAuthorInput = req.body;
      const created = await AuthorsService.createAuthor(input);
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { authorId } = req.params;
      const input: UpdateAuthorInput = req.body;
      const updated = await AuthorsService.updateAuthor(authorId, input);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { authorId } = req.params;
      await AuthorsService.deleteAuthor(authorId);
      sendSuccess(res, { message: `Author '${authorId}' successfully deleted` }, 200);
    } catch (err) {
      next(err);
    }
  }
}
