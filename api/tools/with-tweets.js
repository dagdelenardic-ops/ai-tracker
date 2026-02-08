import { getToolsWithTweets, clearCache } from '../../backend/services/dataService.js';

export default async function handler(req, res) {
  try {
    const { category, limit = 50, refresh } = req.query;

    if (refresh === 'true') {
      clearCache();
    }

    const tools = await getToolsWithTweets(category);

    let source = 'mock';
    if (tools[0]?.tweets?.[0]) {
      const firstTweet = tools[0].tweets[0];
      if (firstTweet.source === 'rapidapi') source = 'rapidapi';
      else if (!firstTweet.isMock) source = 'x_api';
    }

    res.json({
      success: true,
      source,
      count: tools.length,
      data: tools.slice(0, parseInt(limit))
    });

  } catch (error) {
    console.error('Error fetching tools with tweets:', error);
    res.status(500).json({
      success: false,
      message: 'Veri getirme hatası',
      error: error.message
    });
  }
}
