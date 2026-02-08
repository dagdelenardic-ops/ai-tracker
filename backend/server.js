import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import toolsRouter from './routes/tools.js';
import { clearCache } from './services/dataService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/tools', toolsRouter);

app.get('/api/health', (req, res) => {
  const hasRapidApi = !!process.env.RAPIDAPI_KEY;
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    mode: hasRapidApi ? 'RAPIDAPI' : 'DEMO'
  });
});

app.get('/api/stats', (req, res) => {
  const hasRapidApi = !!process.env.RAPIDAPI_KEY;
  res.json({
    totalTools: 35,
    categories: 6,
    mode: hasRapidApi ? 'RAPIDAPI' : 'DEMO',
    lastUpdated: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Hata:', err.stack);
  res.status(500).json({ success: false, message: 'Bir şeyler yanlış gitti!' });
});

app.listen(PORT, () => {
  const hasRapidApi = !!process.env.RAPIDAPI_KEY;
  const mode = hasRapidApi ? '🚀 RAPIDAPI - Gerçek X verileri' : '🎭 DEMO - Mock veriler';

  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🤖 AI Tracker API çalışıyor!                    ║
║   🌐 http://localhost:${PORT}                       ║
║   ${mode}                   ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
  console.log('📊 Endpoint\'ler:');
  console.log('   • GET  /api/tools/with-tweets');
  console.log('   • GET  /api/tools/timeline');
  console.log('   • GET  /api/tools/status/api');
  console.log('   • POST /api/tools/refresh');
  console.log('');
});

cron.schedule('0 * * * *', () => {
  console.log('🔄 Cache temizleniyor...');
  clearCache();
});

export default app;
