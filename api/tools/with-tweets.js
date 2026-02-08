import { getToolsWithTweets, clearCache } from '../../backend/services/dataService.js';
import { generateAllMockTweets } from '../../backend/services/mockDataService.js';

// Serverless timeout koruması
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]);
}

export default async function handler(req, res) {
  try {
    const { category, limit = 50, refresh } = req.query;

    if (refresh === 'true') {
      clearCache();
    }

    let tools;
    let source = 'mock';

    try {
      // 50sn timeout - Vercel Hobby 60sn limiti var
      tools = await withTimeout(getToolsWithTweets(category), 50000);

      if (tools[0]?.tweets?.[0]) {
        const firstTweet = tools[0].tweets[0];
        if (firstTweet.source === 'rapidapi') source = 'rapidapi';
        else if (!firstTweet.isMock) source = 'x_api';
      }
    } catch (timeoutError) {
      // Timeout olursa mock veri kullan
      console.log('⏱️ API timeout, mock veri kullanılıyor...');
      tools = generateAllMockTweets();
      source = 'mock';

      // Kategori filtresi
      if (category && category !== 'all') {
        tools = tools.filter(tool => tool.category === category);
      }

      // latestTweet ekle
      tools = tools.map(tool => ({
        ...tool,
        latestTweet: tool.tweets && tool.tweets.length > 0 ? tool.tweets[0] : null,
        tweetCount: tool.tweets ? tool.tweets.length : 0
      }));
    }

    res.json({
      success: true,
      source,
      count: tools.length,
      data: tools.slice(0, parseInt(limit))
    });

  } catch (error) {
    console.error('Error fetching tools with tweets:', error);
    // Son çare: mock veri
    try {
      let tools = generateAllMockTweets();
      tools = tools.map(tool => ({
        ...tool,
        latestTweet: tool.tweets && tool.tweets.length > 0 ? tool.tweets[0] : null,
        tweetCount: tool.tweets ? tool.tweets.length : 0
      }));
      res.json({
        success: true,
        source: 'mock',
        count: tools.length,
        data: tools.slice(0, 50)
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        message: 'Veri getirme hatası',
        error: error.message
      });
    }
  }
}
