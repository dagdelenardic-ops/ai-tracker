import axios from 'axios';
import { aiTools } from '../data/ai-tools.js';

// ==========================================
// RAPIDAPI - twitter-api45
// Free tier: Basic plan $0/ay
// https://rapidapi.com/alexanderxbx/api/twitter-api45
// ==========================================

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-api45.p.rapidapi.com';

// Tek kullanıcının tweet'lerini çek
async function fetchFromRapidAPI(username, maxResults = 5) {
  try {
    if (!RAPIDAPI_KEY) {
      return null;
    }

    console.log(`🚀 RapidAPI'den ${username} için veri çekiliyor...`);

    const response = await axios.get(
      `https://${RAPIDAPI_HOST}/timeline.php`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        },
        params: {
          screenname: username
        },
        timeout: 15000
      }
    );

    const data = response.data;
    const tweets = data?.timeline || [];

    if (!Array.isArray(tweets) || tweets.length === 0) {
      console.log(`⚠️  ${username} için tweet bulunamadı`);
      return null;
    }

    // Son 90 gün filtresi
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const parsed = tweets
      .slice(0, maxResults)
      .map(tweet => {
        const tweetId = tweet.tweet_id || tweet.id;
        const createdAt = tweet.created_at
          ? new Date(tweet.created_at).toISOString()
          : new Date().toISOString();

        return {
          id: tweetId,
          text: tweet.text || tweet.full_text || '',
          createdAt,
          metrics: {
            like_count: tweet.favorites || tweet.favorite_count || 0,
            retweet_count: tweet.retweets || tweet.retweet_count || 0,
            reply_count: tweet.replies || tweet.reply_count || 0,
            impression_count: parseInt(tweet.views) || tweet.view_count || 0,
            bookmark_count: tweet.bookmarks || 0,
            quote_count: tweet.quotes || tweet.quote_count || 0
          },
          url: `https://x.com/${username}/status/${tweetId}`,
          isMock: false,
          source: 'rapidapi'
        };
      })
      .filter(t => new Date(t.createdAt) >= ninetyDaysAgo);

    if (parsed.length === 0) {
      console.log(`⚠️  ${username}: Son 90 günde tweet yok`);
      return null;
    }

    console.log(`✅ RapidAPI başarılı: ${username} (${parsed.length} tweet)`);
    return parsed;

  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`⚠️  Rate limit aşıldı! Bekleyin.`);
    } else if (error.response?.status === 403) {
      console.error(`❌ RapidAPI key geçersiz veya plan limiti doldu`);
    } else {
      console.error(`❌ RapidAPI hata (${username}):`, error.response?.data?.message || error.message);
    }
    return null;
  }
}

// Araçları batch'lere böl
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Tüm araçlar için tweet çek - PARALEL BATCH
export async function fetchAllTweetsAlternative(maxPerTool = 5) {
  if (!RAPIDAPI_KEY) {
    console.log('⚠️  RAPIDAPI_KEY bulunamadı, mock veri kullanılacak.');
    return null;
  }

  const results = [];
  const BATCH_SIZE = 5; // 5 paralel istek

  console.log(`\n🚀 RapidAPI (twitter-api45) ile ${aiTools.length} AI aracı için tweet çekiliyor (${BATCH_SIZE} paralel)...\n`);

  const batches = chunkArray(aiTools, BATCH_SIZE);

  for (const batch of batches) {
    // Batch'teki tüm araçları paralel çek
    const batchResults = await Promise.allSettled(
      batch.map(tool => fetchFromRapidAPI(tool.xHandle, maxPerTool))
    );

    // Sonuçları işle
    batchResults.forEach((result, index) => {
      const tool = batch[index];
      if (result.status === 'fulfilled' && result.value && result.value.length > 0) {
        results.push({
          tool: tool.id,
          name: tool.name,
          xHandle: tool.xHandle,
          category: tool.category,
          categoryLabel: tool.categoryLabel,
          brandColor: tool.brandColor,
          logo: tool.logo,
          company: tool.company,
          description: tool.description,
          tweets: result.value,
          source: 'rapidapi'
        });
      }
    });

    // Batch'ler arası 500ms bekle (rate limit koruması)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (results.length === 0) {
    console.log('❌ RapidAPI\'den hiç veri çekilemedi');
    return null;
  }

  // En son paylaşım yapan araç en üstte
  results.sort((a, b) => {
    const dateA = a.tweets[0] ? new Date(a.tweets[0].createdAt) : new Date(0);
    const dateB = b.tweets[0] ? new Date(b.tweets[0].createdAt) : new Date(0);
    return dateB - dateA;
  });

  console.log(`\n✅ RapidAPI'den ${results.length} araç, toplam ${results.reduce((acc, r) => acc + r.tweets.length, 0)} tweet çekildi\n`);

  return results;
}

// Tek araç için tweet çek
export async function fetchTweetsAlternative(username, maxResults = 5) {
  return fetchFromRapidAPI(username, maxResults);
}

// Yapılandırma kontrolü
export function isAlternativeApiConfigured() {
  return !!RAPIDAPI_KEY;
}

export function getAlternativeApiStatus() {
  return {
    rapidapi: !!RAPIDAPI_KEY,
    host: RAPIDAPI_HOST,
    anyConfigured: !!RAPIDAPI_KEY
  };
}
