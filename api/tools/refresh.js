import { clearCache } from '../../backend/services/dataService.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  clearCache();
  res.json({
    success: true,
    message: 'Cache temizlendi, bir sonraki istekte veriler yenilenecek'
  });
}
