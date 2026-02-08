import axios from 'axios';
import { aiTools } from '../data/ai-tools.js';

// ==========================================
// NITTER - Ücretsiz X Scraper
// Açık kaynak, ücretsiz, kolay
// ==========================================

// Çalışan Nitter instance'ları (güncel liste)
const NITTER_INSTANCES = [
  'https://nitter.net',
  'https://nitter.cz',
  'https://nitter.privacydev.net',
  'https://nitter.poast.org',
  'https://nitter.drgns.space',
];

// Aktif instance
let currentInstance = 0;

function getNitterUrl() {
  return NITTER_INSTANCES[currentInstance];
}

// Instance değiştir (biri çalışmazsa)
function switchInstance() {
  currentInstance = (currentInstance + 1) % NITTER_INSTANCES.length;
  console.log(`🔄 Nitter instance değişti: ${getNitterUrl()}`);
}

// Kullanıcı tweet'lerini çek
async function fetchFromNitter(username, maxResults = 5) {
  try {
    console.log(`🐦 Nitter'dan ${username} için veri çekiliyor...`);
    
    // Nitter RSS feed'i kullan (JSON olarak da alabiliriz)
    const url = `${getNitterUrl()}/${username}/rss`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // RSS parse et
    const rssData = response.data;
    
    // Basit RSS parse (item'ları bul)
    const items = rssData.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    if (items.length === 0) {
      console.log(`⚠️  ${username} için Nitter'da tweet bulunamadı`);
      return null;
    }
    
    const tweets = items.slice(0, maxResults).map((item, index) => {
      // RSS item'dan veri çıkar
      const titleMatch = item.match(/<title>(.*?)<\/title>/);
      const linkMatch = item.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
      
      const text = titleMatch ? titleMatch[1].replace(/<\!\[CDATA\[(.*?)\]\]>/, '$1') : '';
      const link = linkMatch ? linkMatch[1] : '';
      const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
      
      // Nitter linkini X linkine çevir
      const xUrl = link.replace(/nitter\.[^/]+/, 'x.com');
      
      return {
        id: `nitter-${username}-${index}`,
        text: text,
        createdAt: new Date(pubDate).toISOString(),
        metrics: {
          like_count: 0, // Nitter'da metrics yok
          retweet_count: 0,
          reply_count: 0
        },
        url: xUrl,
        isMock: false,
        source: 'nitter'
      };
    });
    
    console.log(`✅ Nitter başarılı: ${username} (${tweets.length} tweet)`);
    return tweets;
    
  } catch (error) {
    console.error(`❌ Nitter hata (${username}):`, error.message);
    
    // Başka instance dene
    if (currentInstance < NITTER_INSTANCES.length - 1) {
      switchInstance();
      return fetchFromNitter(username, maxResults);
    }
    
    return null;
  }
}

// Tüm araçlar için çek
export async function fetchAllFromNitter(maxPerTool = 5) {
  const results = [];
  
  console.log('\n🐦 Nitter\'dan veri çekiliyor...\n');
  
  for (const tool of aiTools) {
    const tweets = await fetchFromNitter(tool.xHandle, maxPerTool);
    
    if (tweets && tweets.length > 0) {
      results.push({
        tool: tool.id,
        name: tool.name,
        xHandle: tool.xHandle,
        category: tool.category,
        brandColor: tool.brandColor,
        logo: tool.logo,
        tweets,
        source: 'nitter'
      });
    }
    
    // Rate limit koruması
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Sırala
  results.sort((a, b) => {
    const dateA = a.tweets[0] ? new Date(a.tweets[0].createdAt) : new Date(0);
    const dateB = b.tweets[0] ? new Date(b.tweets[0].createdAt) : new Date(0);
    return dateB - dateA;
  });
  
  console.log(`\n✅ Nitter'dan ${results.length} araç için veri çekildi\n`);
  
  return results.length > 0 ? results : null;
}

export function isNitterAvailable() {
  return true; // Her zaman denenebilir
}
