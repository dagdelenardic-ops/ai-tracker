// Vercel serverless function for /api/tools/archive/[toolId]
import { getToolArchive } from '../../../backend/services/archiveService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { toolId } = req.query;
    const { days = 90 } = req.query;
    
    const archive = getToolArchive(toolId, parseInt(days));
    
    if (archive.totalTweets === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bu araç için arşivde tweet bulunamadı'
      });
    }
    
    return res.status(200).json({
      success: true,
      ...archive
    });
  } catch (error) {
    console.error('Tool archive error:', error);
    return res.status(500).json({
      success: false,
      message: 'Araç arşivi getirme hatası',
      error: error.message
    });
  }
}
