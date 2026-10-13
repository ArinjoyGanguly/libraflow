import { Request, Response, NextFunction } from 'express';
import { BooksService } from '../services/books.service';
import { sendSuccess } from '../utils/response';
import { CreateBookInput, UpdateBookInput } from '../types';

export class BooksController {
  static async listBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await BooksService.listBooks(req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getBookById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      const book = await BooksService.getBookById(bookId);
      sendSuccess(res, book);
    } catch (err) {
      next(err);
    }
  }

  static async getRelatedBooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      const result = await BooksService.getRelatedBooks(bookId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async createBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateBookInput = req.body;
      const created = await BooksService.createBook(input);
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      const input: UpdateBookInput = req.body;
      const updated = await BooksService.updateBook(bookId, input);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookId } = req.params;
      await BooksService.deleteBook(bookId);
      sendSuccess(res, { message: `Book '${bookId}' successfully deleted` }, 200);
    } catch (err) {
      next(err);
    }
  }
}
