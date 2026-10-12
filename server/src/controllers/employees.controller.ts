import { Request, Response, NextFunction } from 'express';
import { EmployeesService } from '../services/employees.service';
import { sendSuccess } from '../utils/response';
import { CreateEmployeeInput, UpdateEmployeeInput } from '../types';

export class EmployeesController {
  static async listEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EmployeesService.listEmployees(req.query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getEmployeeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId } = req.params;
      const employee = await EmployeesService.getEmployeeById(employeeId);
      sendSuccess(res, employee);
    } catch (err) {
      next(err);
    }
  }

  static async createEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input: CreateEmployeeInput = req.body;
      const created = await EmployeesService.createEmployee(input);
      sendSuccess(res, created, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId } = req.params;
      const input: UpdateEmployeeInput = req.body;
      const updated = await EmployeesService.updateEmployee(employeeId, input);
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteEmployee(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId } = req.params;
      await EmployeesService.deleteEmployee(employeeId);
      sendSuccess(res, { message: `Employee '${employeeId}' successfully deleted` }, 200);
    } catch (err) {
      next(err);
    }
  }
}
