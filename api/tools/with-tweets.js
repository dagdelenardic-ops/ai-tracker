import { getToolsWithTweets, clearCache, getApiStatus } from '../../backend/services/dataService.js';
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
    const forceRefresh = refresh === 'true';

    if (forceRefresh) {
      clearCache();
    }

    res.setHeader(
      'Cache-Control',
      forceRefresh
        ? 'no-store'
        : 'public, s-maxage=86400, stale-while-revalidate=43200'
    );

    let tools;
    let source = 'mock';

    try {
      // 50sn timeout - Vercel Hobby 60sn limiti var
      tools = await withTimeout(getToolsWithTweets(category, forceRefresh), 50000);

      if (tools[0]?.tweets?.[0]) {
        const firstTweet = tools[0].tweets[0];
        if (firstTweet.source === 'rapidapi') source = 'rapidapi';
        else if (!firstTweet.isMock) source = 'x_api';
      }

      const status = getApiStatus();
      if (status?.source) {
        source = status.source;
      }
    } catch (timeoutError) {
      const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

      if (isProd) {
        tools = [];
        source = 'unavailable';
      } else {
        // Lokal geliştirme fallback
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
    }

    res.json({
      success: true,
      source,
      count: tools.length,
      data: tools.slice(0, parseInt(limit))
    });

  } catch (error) {
    console.error('Error fetching tools with tweets:', error);
    const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    if (isProd) {
      return res.json({
        success: true,
        source: 'unavailable',
        count: 0,
        data: []
      });
    }

    // Lokal geliştirme fallback
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
