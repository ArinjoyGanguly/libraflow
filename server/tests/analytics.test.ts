import request from 'supertest';
import app from '../src/app';
import { AnalyticsService } from '../src/services/analytics.service';
import { NotFoundError } from '../src/utils/errors';

describe('Analytics & Recommendations API Endpoints', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockAnalyticsData = {
    popularBooks: [
      {
        bookId: 'B001',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Classic',
        totalBorrows: 5,
        currentlyAvailable: 2,
      },
    ],
    genreStats: [
      {
        genre: 'Classic',
        borrowCount: 5,
        uniqueTitles: 1,
      },
    ],
    topBorrowers: [
      {
        memberId: 'M001',
        name: 'Alice Johnson',
        totalBorrows: 4,
        totalFinesPaid: 0,
      },
    ],
    libraryStock: [
      {
        libraryId: 'LIB01',
        libraryName: 'Main Campus Library',
        city: 'Metropolis',
        bookCount: 3,
        totalStock: 15,
        totalAvailable: 8,
        staffCount: 2,
      },
    ],
    overdueSnapshot: {
      totalOverdue: 1,
      totalActiveFines: 10,
      avgDaysOverdue: 4,
    },
  };

  const mockRecommendations = {
    memberId: 'M001',
    memberName: 'Alice Johnson',
    recommendations: [
      {
        bookId: 'B002',
        title: 'To Kill a Mockingbird',
        genre: 'Classic',
        author: 'Harper Lee',
        availableCopies: 3,
        coReaderCount: 2,
      },
    ],
  };

  describe('GET /api/analytics', () => {
    it('should return aggregated library analytics with 200 status', async () => {
      jest.spyOn(AnalyticsService, 'getAnalytics').mockResolvedValueOnce(mockAnalyticsData);

      const res = await request(app).get('/api/analytics');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.popularBooks).toHaveLength(1);
      expect(res.body.data.popularBooks[0].title).toBe('The Great Gatsby');
      expect(res.body.data.genreStats[0].genre).toBe('Classic');
      expect(res.body.data.topBorrowers[0].memberId).toBe('M001');
      expect(res.body.data.libraryStock[0].libraryId).toBe('LIB01');
      expect(res.body.data.overdueSnapshot.totalOverdue).toBe(1);
    });

    it('should handle service errors gracefully', async () => {
      jest.spyOn(AnalyticsService, 'getAnalytics').mockRejectedValueOnce(new Error('Neo4j connection error'));

      const res = await request(app).get('/api/analytics');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/analytics/members/:memberId/recommendations', () => {
    it('should return personalized book recommendations for existing member', async () => {
      jest.spyOn(AnalyticsService, 'getMemberRecommendations').mockResolvedValueOnce(mockRecommendations);

      const res = await request(app).get('/api/analytics/members/M001/recommendations');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.memberId).toBe('M001');
      expect(res.body.data.memberName).toBe('Alice Johnson');
      expect(res.body.data.recommendations).toHaveLength(1);
      expect(res.body.data.recommendations[0].bookId).toBe('B002');
      expect(res.body.data.recommendations[0].coReaderCount).toBe(2);
    });

    it('should return 404 when member is not found', async () => {
      jest.spyOn(AnalyticsService, 'getMemberRecommendations').mockRejectedValueOnce(
        new NotFoundError("Member with ID 'M999' not found")
      );

      const res = await request(app).get('/api/analytics/members/M999/recommendations');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });
  });
});
