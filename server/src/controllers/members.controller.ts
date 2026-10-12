import { Request, Response, NextFunction } from 'express';
import { MembersService } from '../services/members.service';
import { sendSuccess } from '../utils/response';
import { CreateMemberInput, UpdateMemberInput } from '../types';

export class MembersController {
  static async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await MembersService.listMembers(req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getMemberById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;
      const member = await MembersService.getMemberById(memberId);
      sendSuccess(res, member);
    } catch (err) {
      next(err);
    }
  }

  static async createMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateMemberInput = req.body;
      const created = await MembersService.createMember(input);
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;
      const input: UpdateMemberInput = req.body;
      const updated = await MembersService.updateMember(memberId, input);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;
      await MembersService.deleteMember(memberId);
      sendSuccess(res, { message: `Member '${memberId}' successfully deleted` }, 200);
    } catch (err) {
      next(err);
    }
  }
}
