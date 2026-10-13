import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess, sendError } from '../utils/response';

export class AnalyticsController {
  /**
   * GET /api/analytics
   * Returns full analytics aggregation: popular books, genre stats, top borrowers,
   * library stock, and overdue loan snapshot.
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getAnalytics();
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/analytics/members/:memberId/recommendations
   * Returns personalized book recommendations for a member via graph co-reading traversal.
   */
  static async getMemberRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { memberId } = req.params;
      const data = await AnalyticsService.getMemberRecommendations(memberId);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}
