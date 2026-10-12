import request from 'supertest';
import app from '../src/app';
import { BooksService } from '../src/services/books.service';

describe('Books API Endpoints (Isolated Unit Tests with Service Mocking)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockBook = {
    bookId: 'B001',
    isbn: '978-0743273565',
    title: 'The Great Gatsby',
    genre: 'Classic',
    language: 'English',
    edition: '1st',
    year: 1925,
    totalCopies: 4,
    availableCopies: 2,
    author: { authorId: 'A101', name: 'F. Scott Fitzgerald' },
    publisher: { publisherId: 'PUB01', name: 'Scribner' },
    library: { libraryId: 'LIB01', name: 'Main Campus Library' },
  };

  it('GET /api/books should return a paginated list of books', async () => {
    jest.spyOn(BooksService, 'listBooks').mockResolvedValueOnce({
      items: [mockBook],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const res = await request(app).get('/api/books?search=Gatsby&page=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].bookId).toBe('B001');
    expect(res.body.data.total).toBe(1);
  });

  it('GET /api/books/:bookId should return single book details', async () => {
    jest.spyOn(BooksService, 'getBookById').mockResolvedValueOnce(mockBook);

    const res = await request(app).get('/api/books/B001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('The Great Gatsby');
    expect(res.body.data.author.name).toBe('F. Scott Fitzgerald');
  });

  it('POST /api/books should validate required fields and create a book', async () => {
    jest.spyOn(BooksService, 'createBook').mockResolvedValueOnce(mockBook);

    const res = await request(app)
      .post('/api/books')
      .send({
        bookId: 'B001',
        isbn: '978-0743273565',
        title: 'The Great Gatsby',
        genre: 'Classic',
        language: 'English',
        year: 1925,
        totalCopies: 4,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookId).toBe('B001');
  });

  it('POST /api/books should return 400 when missing required fields', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({ title: 'Incomplete Book' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Missing required field(s)');
  });

  it('DELETE /api/books/:bookId should prevent deletion with 409 Conflict if active loans exist', async () => {
    const { ConflictError } = require('../src/utils/errors');
    jest.spyOn(BooksService, 'deleteBook').mockRejectedValueOnce(
      new ConflictError("Cannot delete book 'B001': active loans exist")
    );

    const res = await request(app).delete('/api/books/B001');

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('active loans exist');
  });

  it('DELETE /api/books/:bookId should succeed when no active loans exist', async () => {
    jest.spyOn(BooksService, 'deleteBook').mockResolvedValueOnce(undefined);

    const res = await request(app).delete('/api/books/B001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('successfully deleted');
  });
});
