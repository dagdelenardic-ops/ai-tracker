import { clearCache } from '../../backend/services/dataService.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const isServerless = !!process.env.VERCEL;
  clearCache();
  res.json({
    success: true,
    message: isServerless
      ? 'Runtime cache temizlendi. Yeni veri günlük snapshot güncellemesiyle gelir.'
      : 'Cache temizlendi. Bir sonraki istekte snapshot dosyası tekrar okunacak.'
  });
}
