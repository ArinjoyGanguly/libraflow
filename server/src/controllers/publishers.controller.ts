import { Request, Response, NextFunction } from 'express';
import { PublishersService } from '../services/publishers.service';
import { sendSuccess } from '../utils/response';
import { CreatePublisherInput, UpdatePublisherInput } from '../types';

export class PublishersController {
  static async listPublishers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await PublishersService.listPublishers(req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getPublisherById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { publisherId } = req.params;
      const publisher = await PublishersService.getPublisherById(publisherId);
      sendSuccess(res, publisher);
    } catch (err) {
      next(err);
    }
  }

  static async createPublisher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreatePublisherInput = req.body;
      const created = await PublishersService.createPublisher(input);
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updatePublisher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { publisherId } = req.params;
      const input: UpdatePublisherInput = req.body;
      const updated = await PublishersService.updatePublisher(publisherId, input);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deletePublisher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { publisherId } = req.params;
      await PublishersService.deletePublisher(publisherId);
      sendSuccess(res, { message: `Publisher '${publisherId}' successfully deleted` }, 200);
    } catch (err) {
      next(err);
    }
  }
}
