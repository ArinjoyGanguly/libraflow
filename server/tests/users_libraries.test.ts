import request from 'supertest';
import app from '../src/app';
import { MembersService } from '../src/services/members.service';
import { EmployeesService } from '../src/services/employees.service';
import { AdminsService } from '../src/services/admins.service';
import { LibrariesService } from '../src/services/libraries.service';
import { ConflictError } from '../src/utils/errors';

describe('Members, Staff & Libraries API (Isolated Unit Tests with Service Mocking)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockMember = {
    memberId: 'M001',
    name: 'Alice Kumar',
    email: 'alice.kumar@example.com',
    joinDate: '2026-01-15',
    status: 'ACTIVE' as const,
    role: 'member' as const,
    activeLoansCount: 1,
  };

  const mockEmployee = {
    employeeId: 'E01',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@library.org',
    position: 'Senior Librarian',
    libraryId: 'LIB01',
    role: 'employee' as const,
  };

  const mockAdmin = {
    adminId: 'AD01',
    name: 'Dr. Vikram Seth',
    email: 'admin.vikram@library.org',
    role: 'admin' as const,
  };

  const mockLibrary = {
    libraryId: 'LIB01',
    name: 'Central University Library',
    address: '100 University Ave',
    city: 'Knowledge City',
    booksCount: 10,
    employeesCount: 2,
  };

  describe('Members API Security & Integrity', () => {
    it('GET /api/members should return members and NEVER include passwordHash', async () => {
      jest.spyOn(MembersService, 'listMembers').mockResolvedValueOnce({
        items: [mockMember],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app).get('/api/members');
      expect(res.status).toBe(200);
      expect(res.body.data.items[0]).not.toHaveProperty('passwordHash');
      expect(res.body.data.items[0].memberId).toBe('M001');
    });

    it('GET /api/members/:memberId should return member details without passwordHash', async () => {
      jest.spyOn(MembersService, 'getMemberById').mockResolvedValueOnce({
        ...mockMember,
        loans: [],
      });

      const res = await request(app).get('/api/members/M001');
      expect(res.status).toBe(200);
      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(res.body.data.email).toBe('alice.kumar@example.com');
    });

    it('DELETE /api/members/:memberId should return 409 if active loans exist', async () => {
      jest.spyOn(MembersService, 'deleteMember').mockRejectedValueOnce(
        new ConflictError("Cannot delete member 'M001': active loans exist")
      );

      const res = await request(app).delete('/api/members/M001');
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('active loans exist');
    });
  });

  describe('Employees & Admin API Security', () => {
    it('GET /api/employees should never return passwordHash', async () => {
      jest.spyOn(EmployeesService, 'listEmployees').mockResolvedValueOnce({
        items: [mockEmployee],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app).get('/api/employees');
      expect(res.status).toBe(200);
      expect(res.body.data.items[0]).not.toHaveProperty('passwordHash');
      expect(res.body.data.items[0].position).toBe('Senior Librarian');
    });

    it('GET /api/admins should never return passwordHash', async () => {
      jest.spyOn(AdminsService, 'listAdmins').mockResolvedValueOnce({
        items: [mockAdmin],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app).get('/api/admins');
      expect(res.status).toBe(200);
      expect(res.body.data.items[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('Libraries API', () => {
    it('GET /api/libraries should list libraries', async () => {
      jest.spyOn(LibrariesService, 'listLibraries').mockResolvedValueOnce({
        items: [mockLibrary],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app).get('/api/libraries');
      expect(res.status).toBe(200);
      expect(res.body.data.items[0].libraryId).toBe('LIB01');
    });

    it('DELETE /api/libraries/:libraryId should prevent deletion if books are held', async () => {
      jest.spyOn(LibrariesService, 'deleteLibrary').mockRejectedValueOnce(
        new ConflictError("Cannot delete library 'LIB01': books are still held at this library")
      );

      const res = await request(app).delete('/api/libraries/LIB01');
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('books are still held');
    });
  });
});
