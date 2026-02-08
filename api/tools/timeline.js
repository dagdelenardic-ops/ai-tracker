import { getTimeline, clearCache } from '../../backend/services/dataService.js';
import { generateAllMockTweets } from '../../backend/services/mockDataService.js';

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]);
}

export default async function handler(req, res) {
  try {
    const { limit = 100, category, refresh } = req.query;

    if (refresh === 'true') {
      clearCache();
    }

    let timeline;

    try {
      timeline = await withTimeout(getTimeline(category), 50000);
    } catch (timeoutError) {
      console.log('⏱️ Timeline timeout, mock veri kullanılıyor...');
      const tools = generateAllMockTweets();
      timeline = [];
      tools.forEach(tool => {
        (tool.tweets || []).forEach(tweet => {
          timeline.push({
            ...tweet,
            toolId: tool.tool,
            toolName: tool.name,
            xHandle: tool.xHandle,
            category: tool.category,
            brandColor: tool.brandColor,
            logo: tool.logo
          });
        });
      });
      timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

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
