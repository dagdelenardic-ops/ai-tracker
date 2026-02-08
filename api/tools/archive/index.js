// Vercel serverless function for /api/tools/archive
import { getArchive } from '../../../backend/services/archiveService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { category = 'all', days = 90, limit = 500 } = req.query;
    
    const archive = getArchive({ 
      category, 
      days: parseInt(days),
      limit: parseInt(limit)
    });
    
    return res.status(200).json({
      success: true,
      ...archive,
      data: archive.data.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Archive error:', error);
    return res.status(500).json({
      success: false,
      message: 'Arşiv getirme hatası',
      error: error.message
    });
  }
}
