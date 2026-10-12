import { Request, Response, NextFunction } from 'express';
import { RequestsService } from '../services/requests.service';
import { sendSuccess } from '../utils/response';
import { CreateRequestInput, UpdateRequestInput } from '../types';

export class RequestsController {
  static async listRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await RequestsService.listRequests(req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params;
      const requestItem = await RequestsService.getRequestById(requestId);
      sendSuccess(res, requestItem);
    } catch (err) {
      next(err);
    }
  }

  static async createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateRequestInput = req.body;
      const created = await RequestsService.createRequest(input);
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params;
      const input: UpdateRequestInput = req.body;
      const updated = await RequestsService.updateRequest(requestId, input);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { requestId } = req.params;
      await RequestsService.deleteRequest(requestId);
      sendSuccess(res, { message: `Request '${requestId}' successfully deleted` }, 200);
    } catch (err) {
      next(err);
    }
  }
}
