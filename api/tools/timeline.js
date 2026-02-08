import { getTimeline, clearCache } from '../../backend/services/dataService.js';

export default async function handler(req, res) {
  try {
    const { limit = 100, category, refresh } = req.query;

    if (refresh === 'true') {
      clearCache();
    }

    const timeline = await getTimeline(category);

    res.json({
      success: true,
      count: timeline.length,
      data: timeline.slice(0, parseInt(limit))
    });

  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Timeline getirme hatası',
      error: error.message
    });
  }
}
