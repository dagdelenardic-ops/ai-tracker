import axios from 'axios';
import { aiTools } from '../data/ai-tools.js';

// X API v2 endpoints
const X_API_BASE = 'https://api.twitter.com/2';

// API key from environment
const getAuthHeaders = () => {
  const token = process.env.X_BEARER_TOKEN;
  
  if (!token) {
    console.warn('⚠️  X_BEARER_TOKEN bulunamadı! Mock veri kullanılacak.');
    return null;
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Check if API is configured
export function isXApiConfigured() {
  return !!process.env.X_BEARER_TOKEN;
}

// Fetch recent tweets from a user
export async function fetchRecentTweets(username, maxResults = 5) {
  try {
    const headers = getAuthHeaders();
    
    // Eğer token yoksa boş dizi dön
    if (!headers) {
      return [];
    }
    
    console.log(`🔍 ${username} için tweet'ler çekiliyor...`);
    
    // First get user ID by username
    const userResponse = await axios.get(
      `${X_API_BASE}/users/by/username/${username}`,
      { headers }
    );
    
    if (!userResponse.data?.data?.id) {
      console.warn(`⚠️  Kullanıcı bulunamadı: ${username}`);
      return [];
    }
    
    const userId = userResponse.data.data.id;
    
    // Get user's tweets (son 3 ay için yeterli olacak şekilde)
    const tweetsResponse = await axios.get(
      `${X_API_BASE}/users/${userId}/tweets`,
      {
        headers,
        params: {
          max_results: maxResults,
          'tweet.fields': 'created_at,public_metrics,entities,referenced_tweets,attachments',
          exclude: 'replies,retweets',
          start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Son 24 saat
        }
      }
    );
    
    const tweets = tweetsResponse.data.data || [];
    console.log(`✅ ${username}: ${tweets.length} tweet bulundu`);
    
    return tweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      createdAt: tweet.created_at,
      metrics: tweet.public_metrics || {},
      url: `https://x.com/${username}/status/${tweet.id}`,
      isMock: false
    }));
    
  } catch (error) {
    console.error(`❌ ${username} için hata:`, error.response?.data?.detail || error.message);
    
    // Rate limit hatası
    if (error.response?.status === 429) {
      console.warn('⚠️  Rate limit aşıldı! 15 dakika bekleyin.');
    }
    
    // Yetkilendirme hatası
    if (error.response?.status === 401) {
      console.error('❌ Token geçersiz! Yeni token alın.');
    }
    
    return [];
  }
}

// Fetch tweets for all AI tools
export async function fetchAllTweets(maxPerTool = 5) {
  const results = [];
  const headers = getAuthHeaders();
  
  // Token yoksa mock veri kullan
  if (!headers) {
    console.log('🎭 Mock veri kullanılıyor...');
    return null; // Mock servisine sinyal
  }
  
  console.log(`🚀 ${aiTools.length} AI aracı için tweet'ler çekiliyor...`);
  
  // Rate limit'e takılmamak için gruplar halinde çek
  const batchSize = 5; // Aynı anda 5 hesap
  
  for (let i = 0; i < aiTools.length; i += batchSize) {
    const batch = aiTools.slice(i, i + batchSize);
    
    console.log(`📦 Grup ${Math.floor(i/batchSize) + 1}/${Math.ceil(aiTools.length/batchSize)} işleniyor...`);
    
    const batchPromises = batch.map(async (tool) => {
      const tweets = await fetchRecentTweets(tool.xHandle, maxPerTool);
      return {
        tool: tool.id,
        name: tool.name,
        xHandle: tool.xHandle,
        category: tool.category,
        brandColor: tool.brandColor,
        logo: tool.logo,
        tweets
      };
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Rate limit koruması - gruplar arası bekle
    if (i + batchSize < aiTools.length) {
      console.log('⏳ Rate limit koruması: 1 saniye bekleniyor...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Tarihe göre sırala (en yeni en üstte)
  results.sort((a, b) => {
    const dateA = a.tweets[0] ? new Date(a.tweets[0].createdAt) : new Date(0);
    const dateB = b.tweets[0] ? new Date(b.tweets[0].createdAt) : new Date(0);
    return dateB - dateA;
  });
  
  console.log(`✅ Toplam ${results.reduce((acc, r) => acc + r.tweets.length, 0)} tweet çekildi`);
  
  return results;
}

// Get single tweet embed URL
export function getTweetUrl(xHandle, tweetId) {
  return `https://x.com/${xHandle}/status/${tweetId}`;
}

// Get X profile URL
export function getProfileUrl(xHandle) {
  return `https://x.com/${xHandle}`;
}

// Test API connection
export async function testConnection() {
  try {
    const headers = getAuthHeaders();
    if (!headers) {
      return { success: false, error: 'Token yok' };
    }
    
    // OpenAI hesabını test et
    const response = await axios.get(
      `${X_API_BASE}/users/by/username/OpenAI`,
      { headers }
    );
    
    return { 
      success: true, 
      user: response.data.data,
      message: 'X API bağlantısı başarılı!' 
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.detail || error.message 
    };
  }
}
