import { Request, Response, NextFunction } from 'express';
import { LoansService } from '../services/loans.service';
import { sendSuccess } from '../utils/response';
import { IssueBookInput, ReturnBookInput } from '../types';

export class LoansController {
  static async issueBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: IssueBookInput = req.body;
      const loan = await LoansService.issueBook(input);
      sendSuccess(res, loan, 201);
    } catch (err) {
      next(err);
    }
  }

  static async returnBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { loanId } = req.params;
      const input: ReturnBookInput = req.body;
      const updatedLoan = await LoansService.returnBook(loanId, input);
      sendSuccess(res, updatedLoan, 200);
    } catch (err) {
      next(err);
    }
  }

  static async listLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await LoansService.listLoans(req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getLoanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { loanId } = req.params;
      const loan = await LoansService.getLoanById(loanId);
      sendSuccess(res, loan);
    } catch (err) {
      next(err);
    }
  }

  static async listOverdueLoans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const overdueLoans = await LoansService.listOverdueLoans();
      sendSuccess(res, overdueLoans);
    } catch (err) {
      next(err);
    }
  }

  static async getMemberLoans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;
      const loans = await LoansService.getMemberLoans(memberId);
      sendSuccess(res, loans);
    } catch (err) {
      next(err);
    }
  }
}
