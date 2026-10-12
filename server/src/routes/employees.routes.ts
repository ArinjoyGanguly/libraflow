import { Router } from 'express';
import { EmployeesController } from '../controllers/employees.controller';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

// GET /api/employees - list
router.get('/', EmployeesController.listEmployees);

// GET /api/employees/:employeeId - detail
router.get('/:employeeId', EmployeesController.getEmployeeById);

// POST /api/employees - create
router.post(
  '/',
  validateRequest({ requiredBodyFields: ['employeeId', 'name', 'email', 'position', 'libraryId'] }),
  EmployeesController.createEmployee
);

// PUT /api/employees/:employeeId - update
router.put('/:employeeId', EmployeesController.updateEmployee);

// DELETE /api/employees/:employeeId - delete
router.delete('/:employeeId', EmployeesController.deleteEmployee);

export default router;
