import request from 'supertest';
import app from '../src/app';
import { AuthorsService } from '../src/services/authors.service';
import { PublishersService } from '../src/services/publishers.service';

describe('Authors & Publishers API (Isolated Unit Tests with Service Mocking)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockAuthor = {
    authorId: 'A101',
    name: 'F. Scott Fitzgerald',
    email: 'fitzgerald@authors.org',
    country: 'United States',
    books: [{ bookId: 'B001', title: 'The Great Gatsby' }],
  };

  const mockPublisher = {
    publisherId: 'PUB01',
    name: 'Scribner',
    address: 'New York, USA',
    books: [{ bookId: 'B001', title: 'The Great Gatsby' }],
  };

  describe('Authors CRUD', () => {
    it('GET /api/authors should return paginated authors', async () => {
      jest.spyOn(AuthorsService, 'listAuthors').mockResolvedValueOnce({
        items: [mockAuthor],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app).get('/api/authors');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].authorId).toBe('A101');
    });

    it('GET /api/authors/:authorId should return author details', async () => {
      jest.spyOn(AuthorsService, 'getAuthorById').mockResolvedValueOnce(mockAuthor);

      const res = await request(app).get('/api/authors/A101');
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('F. Scott Fitzgerald');
    });

    it('POST /api/authors should create an author', async () => {
      jest.spyOn(AuthorsService, 'createAuthor').mockResolvedValueOnce(mockAuthor);

      const res = await request(app).post('/api/authors').send({
        authorId: 'A101',
        name: 'F. Scott Fitzgerald',
        email: 'fitzgerald@authors.org',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.authorId).toBe('A101');
    });

    it('DELETE /api/authors/:authorId should delete an author', async () => {
      jest.spyOn(AuthorsService, 'deleteAuthor').mockResolvedValueOnce(undefined);

      const res = await request(app).delete('/api/authors/A101');
      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('successfully deleted');
    });
  });

  describe('Publishers CRUD', () => {
    it('GET /api/publishers should return paginated publishers', async () => {
      jest.spyOn(PublishersService, 'listPublishers').mockResolvedValueOnce({
        items: [mockPublisher],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const res = await request(app).get('/api/publishers');
      expect(res.status).toBe(200);
      expect(res.body.data.items[0].publisherId).toBe('PUB01');
    });

    it('POST /api/publishers should create a publisher', async () => {
      jest.spyOn(PublishersService, 'createPublisher').mockResolvedValueOnce(mockPublisher);

      const res = await request(app).post('/api/publishers').send({
        publisherId: 'PUB01',
        name: 'Scribner',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Scribner');
    });

    it('DELETE /api/publishers/:publisherId should delete a publisher', async () => {
      jest.spyOn(PublishersService, 'deletePublisher').mockResolvedValueOnce(undefined);

      const res = await request(app).delete('/api/publishers/PUB01');
      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain('successfully deleted');
    });
  });
});
