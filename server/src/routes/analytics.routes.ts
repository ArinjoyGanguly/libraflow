import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();

// GET /api/analytics — full analytics dashboard aggregation
router.get('/', AnalyticsController.getAnalytics);

// GET /api/analytics/members/:memberId/recommendations — co-reading recommendations
router.get('/members/:memberId/recommendations', AnalyticsController.getMemberRecommendations);

export default router;
