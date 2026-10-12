import { Request, Response, NextFunction } from 'express';
import { AdminsService } from '../services/admins.service';
import { sendSuccess } from '../utils/response';
import { CreateAdminInput, UpdateAdminInput } from '../types';

export class AdminsController {
  static async listAdmins(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AdminsService.listAdmins(req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getAdminById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { adminId } = req.params;
      const admin = await AdminsService.getAdminById(adminId);
      sendSuccess(res, admin);
    } catch (err) {
      next(err);
    }
  }

  static async createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateAdminInput = req.body;
      const created = await AdminsService.createAdmin(input);
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { adminId } = req.params;
      const input: UpdateAdminInput = req.body;
      const updated = await AdminsService.updateAdmin(adminId, input);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { adminId } = req.params;
      await AdminsService.deleteAdmin(adminId);
      sendSuccess(res, { message: `Administrator '${adminId}' successfully deleted` }, 200);
    } catch (err) {
      next(err);
    }
  }
}
