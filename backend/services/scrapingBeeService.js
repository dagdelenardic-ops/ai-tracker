import axios from 'axios';
import { aiTools } from '../data/ai-tools.js';

// ==========================================
// SCRAPINGBEE - Ücretli ama güvenilir
// İlk 1000 API call ücretsiz
// ==========================================

const SCRAPINGBEE_KEY = process.env.SCRAPINGBEE_KEY;
const SCRAPINGBEE_URL = 'https://app.scrapingbee.com/api/v1';

// ScrapingBee ile X profili çek
async function fetchFromScrapingBee(username, maxResults = 5) {
  try {
    if (!SCRAPINGBEE_KEY) {
      console.log('ScrapingBee key yok, atlanıyor...');
      return null;
    }
    
    console.log(`🐝 ScrapingBee'den ${username} için veri çekiliyor...`);
    
    // X profil sayfasını çek
    const xUrl = `https://x.com/${username}`;
    
    const response = await axios.get(SCRAPINGBEE_URL, {
      params: {
        api_key: SCRAPINGBEE_KEY,
        url: xUrl,
        render_js: 'true',
        premium_proxy: 'true',
        wait: '3000'
      },
      timeout: 30000
    });
    
    const html = response.data;
    
    // HTML'den tweet'leri parse et (basit regex)
    // Not: X HTML yapısı değişebilir, bu geçici çözüm
    const tweets = [];
    
    // Tweet metinlerini bul
    const tweetMatches = html.match(/data-testid="tweetText"[^>]*>([^<]*)<\/div>/g) || [];
    const timeMatches = html.match(/datetime="([^"]+)"/g) || [];
    
    for (let i = 0; i < Math.min(tweetMatches.length, maxResults); i++) {
      const text = tweetMatches[i]?.replace(/<[^>]*>/g, '') || '';
      const timeMatch = timeMatches[i];
      const createdAt = timeMatch ? timeMatch.replace(/datetime="([^"]+)"/, '$1') : new Date().toISOString();
      
      if (text) {
        tweets.push({
          id: `scrapingbee-${username}-${i}`,
          text: text,
          createdAt: createdAt,
          metrics: { like_count: 0, retweet_count: 0, reply_count: 0 },
          url: `https://x.com/${username}/status/${Date.now()}-${i}`,
          isMock: false,
          source: 'scrapingbee'
        });
      }
    }
    
    if (tweets.length === 0) {
      console.log(`⚠️  ScrapingBee: ${username} için parse edilemedi`);
      return null;
    }
    
    console.log(`✅ ScrapingBee başarılı: ${username} (${tweets.length} tweet)`);
    return tweets;
    
  } catch (error) {
    console.error(`❌ ScrapingBee hata (${username}):`, error.message);
    return null;
  }
}

// Tüm araçlar için
export async function fetchAllFromScrapingBee(maxPerTool = 5) {
  if (!SCRAPINGBEE_KEY) {
    console.log('ScrapingBee key yok, atlanıyor...');
    return null;
  }
  
  const results = [];
  
  console.log('\n🐝 ScrapingBee\'den veri çekiliyor...\n');
  
  for (const tool of aiTools.slice(0, 10)) { // İlk 10 araç (ücretli)
    const tweets = await fetchFromScrapingBee(tool.xHandle, maxPerTool);
    
    if (tweets && tweets.length > 0) {
      results.push({
        tool: tool.id,
        name: tool.name,
        xHandle: tool.xHandle,
        category: tool.category,
        brandColor: tool.brandColor,
        logo: tool.logo,
        tweets,
        source: 'scrapingbee'
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results.length > 0 ? results : null;
}

export function isScrapingBeeConfigured() {
  return !!SCRAPINGBEE_KEY;
}
