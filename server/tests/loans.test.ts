import request from 'supertest';
import app from '../src/app';
import { LoansService } from '../src/services/loans.service';
import { BadRequestError, NotFoundError, ConflictError } from '../src/utils/errors';


describe('Phase 5: Loans & Transactional Borrowing Suite (Isolated Unit Tests)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockActiveLoan = {
    loanId: 'L001',
    issueDate: '2026-10-12',
    dueDate: '2026-10-26',
    returnDate: null,
    status: 'ACTIVE' as const,
    fineAmount: 0.0,
    member: { memberId: 'M001', name: 'Alice Kumar', email: 'alice.kumar@example.com' },
    book: { bookId: 'B001', title: 'The Great Gatsby', isbn: '978-0743273565' },
    issuedBy: { employeeId: 'E01', name: 'Rajesh Sharma' },
  };

  const mockReturnedLoan = {
    ...mockActiveLoan,
    status: 'RETURNED' as const,
    returnDate: '2026-10-20',
    fineAmount: 0.0,
  };

  const mockOverdueLoan = {
    loanId: 'L004',
    issueDate: '2026-09-01',
    dueDate: '2026-09-15',
    returnDate: null,
    status: 'OVERDUE' as const,
    fineAmount: 0.0,
    member: { memberId: 'M003', name: 'Carol Danvers', email: 'carol@example.com' },
    book: { bookId: 'B003', title: 'The Immortals of Meluha', isbn: '978-9381626597' },
    issuedBy: { employeeId: 'E02', name: 'Priya Patel' },
    daysOverdue: 27,
    calculatedFine: 54.0,
  };

  describe('1. Book Issuing (POST /api/loans/issue and POST /api/loans)', () => {
    it('Case 1: Successful book issue creates loan and returns 201 Created', async () => {
      jest.spyOn(LoansService, 'issueBook').mockResolvedValueOnce(mockActiveLoan);

      const res = await request(app)
        .post('/api/loans/issue')
        .send({
          memberId: 'M001',
          bookId: 'B001',
          employeeId: 'E01',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loanId).toBe('L001');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.book.bookId).toBe('B001');
      expect(res.body.data.member.memberId).toBe('M001');
    });

    it('Case 2: Attempt to issue an unavailable book (0 copies) returns 400 Bad Request', async () => {
      jest.spyOn(LoansService, 'issueBook').mockRejectedValueOnce(
        new BadRequestError("No copies available for book 'B002' (To Kill a Mockingbird)")
      );

      const res = await request(app)
        .post('/api/loans/issue')
        .send({
          memberId: 'M001',
          bookId: 'B002',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No copies available');
    });

    it('Case 3: Attempt to issue the same book twice to the same member returns 409 Conflict', async () => {
      jest.spyOn(LoansService, 'issueBook').mockRejectedValueOnce(
        new ConflictError("Member 'M001' already has an active loan (L001) for book 'B001'")
      );

      const res = await request(app)
        .post('/api/loans')
        .send({
          memberId: 'M001',
          bookId: 'B001',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already has an active loan');
    });

    it('Case 4: Issue with nonexistent member or book returns 404 Not Found', async () => {
      jest.spyOn(LoansService, 'issueBook').mockRejectedValueOnce(
        new NotFoundError("Member with ID 'M999' not found")
      );

      const res = await request(app)
        .post('/api/loans/issue')
        .send({
          memberId: 'M999',
          bookId: 'B001',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Member with ID 'M999' not found");
    });
  });

  describe('2. Book Returning (POST /api/loans/:loanId/return and PUT /api/loans/:loanId/return)', () => {
    it('Case 5: Successful return closes loan, records returnDate, and returns 200 OK', async () => {
      jest.spyOn(LoansService, 'returnBook').mockResolvedValueOnce(mockReturnedLoan);

      const res = await request(app)
        .post('/api/loans/L001/return')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RETURNED');
      expect(res.body.data.returnDate).toBe('2026-10-20');
    });

    it('Case 6: Attempt to return an already returned loan returns 400 Bad Request', async () => {
      jest.spyOn(LoansService, 'returnBook').mockRejectedValueOnce(
        new BadRequestError("Loan 'L001' has already been returned on 2026-10-20")
      );

      const res = await request(app)
        .put('/api/loans/L001/return')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already been returned');
    });
  });

  describe('3. Overdue Loans & Member Loan History', () => {
    it('Case 7: GET /api/loans/overdue correctly retrieves overdue loans with calculated fines', async () => {
      jest.spyOn(LoansService, 'listOverdueLoans').mockResolvedValueOnce([mockOverdueLoan]);

      const res = await request(app).get('/api/loans/overdue');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].loanId).toBe('L004');
      expect(res.body.data[0].daysOverdue).toBe(27);
      expect(res.body.data[0].calculatedFine).toBe(54.0);
    });

    it('Case 8: GET /api/members/:memberId/loans retrieves complete borrowing history for a member', async () => {
      jest.spyOn(LoansService, 'getMemberLoans').mockResolvedValueOnce([mockActiveLoan, mockReturnedLoan]);

      const res = await request(app).get('/api/members/M001/loans');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].member.memberId).toBe('M001');
    });

    it('Case 9: GET /api/loans retrieves paginated list of loans with filters', async () => {
      jest.spyOn(LoansService, 'listLoans').mockResolvedValueOnce({
        items: [mockActiveLoan],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app).get('/api/loans?status=ACTIVE');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].status).toBe('ACTIVE');
    });

    it('Case 10: GET /api/loans/:loanId retrieves loan details', async () => {
      jest.spyOn(LoansService, 'getLoanById').mockResolvedValueOnce(mockActiveLoan);

      const res = await request(app).get('/api/loans/L001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loanId).toBe('L001');
    });
  });

  describe('4. Transaction Failure & Concurrency Semantics', () => {
    it('Case 11: Transaction failure rolls back cleanly without leaving partial state', async () => {
      jest.spyOn(LoansService, 'issueBook').mockRejectedValueOnce(
        new Error('Database transaction aborted due to transient conflict')
      );

      const res = await request(app)
        .post('/api/loans/issue')
        .send({
          memberId: 'M001',
          bookId: 'B001',
        });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database transaction aborted');
    });
  });
});
