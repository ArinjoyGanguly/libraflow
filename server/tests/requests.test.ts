import request from 'supertest';
import app from '../src/app';
import { RequestsService } from '../src/services/requests.service';

describe('Member Requests API (Isolated Unit Tests with Service Mocking)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockRequest = {
    requestId: 'REQ001',
    requestDate: '2026-10-10',
    status: 'PENDING' as const,
    notes: 'Research reference',
    member: { memberId: 'M001', name: 'Alice Kumar', email: 'alice.kumar@example.com' },
    book: { bookId: 'B003', title: 'The Immortals of Meluha', isbn: '978-9381626597' },
  };

  it('GET /api/requests should return paginated requests', async () => {
    jest.spyOn(RequestsService, 'listRequests').mockResolvedValueOnce({
      items: [mockRequest],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const res = await request(app).get('/api/requests?status=PENDING');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items[0].requestId).toBe('REQ001');
    expect(res.body.data.items[0].status).toBe('PENDING');
  });

  it('GET /api/requests/:requestId should return single request detail', async () => {
    jest.spyOn(RequestsService, 'getRequestById').mockResolvedValueOnce(mockRequest);

    const res = await request(app).get('/api/requests/REQ001');
    expect(res.status).toBe(200);
    expect(res.body.data.requestId).toBe('REQ001');
    expect(res.body.data.member.name).toBe('Alice Kumar');
    expect(res.body.data.book.title).toBe('The Immortals of Meluha');
  });

  it('POST /api/requests should create a new request', async () => {
    jest.spyOn(RequestsService, 'createRequest').mockResolvedValueOnce(mockRequest);

    const res = await request(app)
      .post('/api/requests')
      .send({
        requestId: 'REQ001',
        memberId: 'M001',
        bookId: 'B003',
        notes: 'Research reference',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requestId).toBe('REQ001');
  });

  it('PUT /api/requests/:requestId should update status and record processing employee', async () => {
    const updatedRequest = {
      ...mockRequest,
      status: 'APPROVED' as const,
      processedBy: { employeeId: 'E01', name: 'Rajesh Sharma' },
    };
    jest.spyOn(RequestsService, 'updateRequest').mockResolvedValueOnce(updatedRequest);

    const res = await request(app)
      .put('/api/requests/REQ001')
      .send({
        status: 'APPROVED',
        employeeId: 'E01',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.data.processedBy.employeeId).toBe('E01');
  });

  it('DELETE /api/requests/:requestId should delete a request', async () => {
    jest.spyOn(RequestsService, 'deleteRequest').mockResolvedValueOnce(undefined);

    const res = await request(app).delete('/api/requests/REQ001');
    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('successfully deleted');
  });
});
