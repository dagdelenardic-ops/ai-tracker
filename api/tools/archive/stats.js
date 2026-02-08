// Vercel serverless function for /api/tools/archive/stats
import { getArchiveStats } from '../../../backend/services/archiveService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const stats = getArchiveStats();
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Archive stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Arşiv istatistikleri getirme hatası',
      error: error.message
    });
  }
}
