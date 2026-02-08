import express from 'express';
import { aiTools, categories, getToolsByCategory } from '../data/ai-tools.js';
import { getToolsWithTweets, getTimeline, clearCache, getApiStatus } from '../services/dataService.js';
import { getArchive, getArchiveStats, getToolArchive } from '../services/archiveService.js';
import { testConnection } from '../services/xApiService.js';

const router = express.Router();

// Get all AI tools (basic info)
router.get('/', (req, res) => {
  const { category } = req.query;
  
  let tools = category && category !== 'all' 
    ? getToolsByCategory(category)
    : aiTools;
  
  res.json({
    success: true,
    count: tools.length,
    data: tools
  });
});

// Get all categories
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    data: categories
  });
});

// Get tools with recent tweets (X API veya Mock)
router.get('/with-tweets', async (req, res) => {
  try {
    const { category, limit = 50, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    // Manuel yenileme istenirse cache'i temizle
    if (forceRefresh) {
      clearCache();
    }
    
    const tools = await getToolsWithTweets(category, forceRefresh);
    
    // Kaynak tespiti: isMock flag'i veya source field'i kontrol et
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
});

// Get timeline (all tweets sorted by date)
router.get('/timeline', async (req, res) => {
  try {
    const { limit = 100, category, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    if (forceRefresh) {
      clearCache();
    }
    
    const timeline = await getTimeline(category, forceRefresh);
    
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
});

// Get single tool by ID
router.get('/:id', (req, res) => {
  const tool = aiTools.find(t => t.id === req.params.id);
  
  if (!tool) {
    return res.status(404).json({
      success: false,
      message: 'Tool not found'
    });
  }
  
  res.json({
    success: true,
    data: tool
  });
});

// Search tools
router.get('/search/:query', (req, res) => {
  const query = req.params.query.toLowerCase();
  
  const results = aiTools.filter(tool => 
    tool.name.toLowerCase().includes(query) ||
    tool.company.toLowerCase().includes(query) ||
    tool.description.toLowerCase().includes(query) ||
    tool.categoryLabel.toLowerCase().includes(query)
  );
  
  res.json({
    success: true,
    count: results.length,
    data: results
  });
});

// API status
router.get('/status/api', (req, res) => {
  res.json({
    success: true,
    data: getApiStatus()
  });
});

// Test X API connection
router.get('/test/x-api', async (req, res) => {
  try {
    const result = await testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Force refresh cache
router.post('/refresh', (req, res) => {
  const isServerless = !!process.env.VERCEL;
  clearCache();
  res.json({
    success: true,
    message: isServerless
      ? 'Runtime cache temizlendi. Yeni veri günlük snapshot güncellemesiyle gelir.'
      : 'Cache temizlendi. Bir sonraki istekte snapshot dosyası tekrar okunacak.'
  });
});

// ========== ARŞİV ENDPOINT'LERİ ==========

// Get archive timeline (all historical tweets)
router.get('/archive', (req, res) => {
  try {
    const { category, days = 90, limit = 500 } = req.query;
    
    const archive = getArchive({ 
      category, 
      days: parseInt(days),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      ...archive,
      data: archive.data.slice(0, parseInt(limit))
    });
    
  } catch (error) {
    console.error('Error fetching archive:', error);
    res.status(500).json({
      success: false,
      message: 'Arşiv getirme hatası',
      error: error.message
    });
  }
});

// Get archive statistics
router.get('/archive/stats', (req, res) => {
  try {
    const stats = getArchiveStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error fetching archive stats:', error);
    res.status(500).json({
      success: false,
      message: 'Arşiv istatistikleri getirme hatası',
      error: error.message
    });
  }
});

// Get single tool's archive
router.get('/archive/:toolId', (req, res) => {
  try {
    const { toolId } = req.params;
    const { days = 90 } = req.query;
    
    const archive = getToolArchive(toolId, parseInt(days));
    
    if (archive.totalTweets === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bu araç için arşivde tweet bulunamadı'
      });
    }
    
    res.json({
      success: true,
      ...archive
    });
    
  } catch (error) {
    console.error('Error fetching tool archive:', error);
    res.status(500).json({
      success: false,
      message: 'Araç arşivi getirme hatası',
      error: error.message
    });
  }
});

export default router;
