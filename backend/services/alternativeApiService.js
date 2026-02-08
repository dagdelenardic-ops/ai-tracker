import axios from 'axios';
import { aiTools } from '../data/ai-tools.js';

// ==========================================
// RAPIDAPI - twitter-api45
// Free tier: Basic plan $0/ay
// https://rapidapi.com/alexanderxbx/api/twitter-api45
// ==========================================

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-api45.p.rapidapi.com';
const TWEET_WINDOW_HOURS = Number(process.env.TWEET_WINDOW_HOURS || 24);

function sanitizeHandle(username = '') {
  return String(username || '').trim().replace(/^@+/, '');
}

function buildProfileUrl(username = '') {
  const handle = sanitizeHandle(username);
  return handle ? `https://x.com/${encodeURIComponent(handle)}` : 'https://x.com';
}

function buildTweetUrl(username = '', tweetId = '', fallbackUrl = '') {
  if (fallbackUrl && typeof fallbackUrl === 'string' && /^https?:\/\//i.test(fallbackUrl)) {
    return fallbackUrl;
  }

  const profileUrl = buildProfileUrl(username);
  const id = String(tweetId || '').trim();
  if (!id || /^(undefined|null|nan)$/i.test(id)) {
    return profileUrl;
  }

  return `${profileUrl}/status/${encodeURIComponent(id)}`;
}

// Tek kullanıcının tweet'lerini çek (retry destekli)
async function fetchFromRapidAPI(username, maxResults = 5, retryCount = 0) {
  try {
    if (!RAPIDAPI_KEY) {
      return { data: null, rateLimited: false };
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
        timeout: 10000
      }
    );

    const data = response.data;
    const tweets = data?.timeline || [];

    if (!Array.isArray(tweets) || tweets.length === 0) {
      console.log(`⚠️  ${username} için tweet bulunamadı`);
      return { data: null, rateLimited: false };
    }

    // Son 24 saat filtresi (env ile değiştirilebilir)
    const windowStart = new Date(Date.now() - TWEET_WINDOW_HOURS * 60 * 60 * 1000);

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
          url: buildTweetUrl(
            username,
            tweetId,
            tweet.url || tweet.tweet_url || tweet.permalink || ''
          ),
          isMock: false,
          source: 'rapidapi'
        };
      })
      .filter(t => new Date(t.createdAt) >= windowStart);

    if (parsed.length === 0) {
      console.log(`⚠️  ${username}: Son ${TWEET_WINDOW_HOURS} saatte tweet yok`);
      return { data: null, rateLimited: false };
    }

    console.log(`✅ RapidAPI başarılı: ${username} (${parsed.length} tweet)`);
    return { data: parsed, rateLimited: false };

  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`⚠️  Rate limit aşıldı (${username})!`);
      // 1 kez retry - 2 saniye bekleyip tekrar dene
      if (retryCount < 1) {
        console.log(`🔄 ${username} için 2s sonra tekrar deneniyor...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchFromRapidAPI(username, maxResults, retryCount + 1);
      }
      return { data: null, rateLimited: true };
    } else if (error.response?.status === 403) {
      console.error(`❌ RapidAPI key geçersiz veya plan limiti doldu`);
    } else {
      console.error(`❌ RapidAPI hata (${username}):`, error.response?.data?.message || error.message);
    }
    return { data: null, rateLimited: false };
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
  let failCount = 0;
  let rateLimitHit = false;

  console.log(`\n🚀 RapidAPI (twitter-api45) ile ${aiTools.length} AI aracı için tweet çekiliyor (sıralı, hızlı)...\n`);

  for (const tool of aiTools) {
    // Çok fazla ardışık hata varsa dur
    if (failCount >= 8) {
      console.warn('⚠️  Çok fazla hata, geri kalan araçlar atlanıyor...');
      break;
    }

    const { data: tweets, rateLimited } = await fetchFromRapidAPI(tool.xHandle, maxPerTool);

    if (rateLimited) {
      rateLimitHit = true;
    }

    if (tweets && tweets.length > 0) {
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
        tweets,
        source: 'rapidapi'
      });
      failCount = 0;
      rateLimitHit = false;
    } else {
      failCount++;
    }

    // Rate limit koruması - istekler arası bekleme
    const delay = rateLimitHit ? 2500 : 800;
    await new Promise(resolve => setTimeout(resolve, delay));
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
  const { data } = await fetchFromRapidAPI(username, maxResults);
  return data;
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
