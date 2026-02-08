import { generateAllMockTweets } from './mockDataService.js';
import { fetchAllTweetsAlternative, isAlternativeApiConfigured } from './alternativeApiService.js';
import { translateAllToolsTweets, isTranslateConfigured, clearTranslationCache } from './translateService.js';

// Cache
let cachedData = null;
let cacheTime = null;
let cachedSource = 'mock';
let fetchInProgress = null; // Aynı anda iki çekim olmasın
const CACHE_DURATION = 1000 * 60 * 15; // 15 dakika

export async function getToolsWithTweets(category = 'all', forceRefresh = false) {
  try {
    let data;

    // Cache kontrolü
    if (!forceRefresh && cachedData && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      data = cachedData;
    } else if (fetchInProgress) {
      // Başka bir istek zaten çekiyor, onu bekle
      console.log('⏳ Başka bir istek zaten çekiyor, bekleniyor...');
      data = await fetchInProgress;
    } else {
      // Yeni çekim başlat
      fetchInProgress = (async () => {
        let result;
        // 1. RapidAPI dene
        if (isAlternativeApiConfigured()) {
          console.log('🚀 RapidAPI deneniyor...');
          result = await fetchAllTweetsAlternative();
        }

        // 2. RapidAPI başarısızsa mock veri kullan
        if (!result || result.length === 0) {
          console.log('🎭 Mock veri kullanılıyor...');
          result = generateAllMockTweets();
          cachedSource = 'mock';
        } else {
          cachedSource = 'rapidapi';

          // 3. DeepSeek ile Türkçeye çevir
          if (isTranslateConfigured()) {
            result = await translateAllToolsTweets(result);
          }
        }

        cachedData = result;
        cacheTime = Date.now();
        return result;
      })();

      try {
        data = await fetchInProgress;
      } finally {
        fetchInProgress = null;
      }
    }

    // latestTweet ekle (frontend'in ihtiyacı var)
    data = data.map(tool => ({
      ...tool,
      latestTweet: tool.tweets && tool.tweets.length > 0 ? tool.tweets[0] : null,
      tweetCount: tool.tweets ? tool.tweets.length : 0
    }));

    // Kategori filtresi uygula
    if (category !== 'all') {
      data = data.filter(tool => tool.category === category);
    }

    return data;
  } catch (error) {
    console.error('❌ Hata:', error);
    return generateAllMockTweets();
  }
}

export async function getTimeline(category = 'all') {
  const tools = await getToolsWithTweets(category);
  const timeline = [];

  tools.forEach(tool => {
    tool.tweets.forEach(tweet => {
      timeline.push({
        ...tweet,
        toolId: tool.tool,
        toolName: tool.name,
        xHandle: tool.xHandle,
        category: tool.category,
        brandColor: tool.brandColor,
        logo: tool.logo
      });
    });
  });

  timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return timeline;
}

export function clearCache() {
  cachedData = null;
  cacheTime = null;
  cachedSource = 'mock';
  clearTranslationCache();
  console.log('🗑️ Cache temizlendi');
}

export function getApiStatus() {
  return {
    source: cachedSource,
    rapidApiConfigured: isAlternativeApiConfigured(),
    translateConfigured: isTranslateConfigured(),
    cached: !!cachedData,
    lastUpdated: cacheTime ? new Date(cacheTime).toISOString() : null
  };
}
