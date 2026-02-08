import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

// Çeviri cache - aynı metni tekrar çevirmemek için
const translationCache = new Map();

/**
 * Tek bir metni Türkçeye çevir
 */
async function translateText(text) {
  if (!text || text.trim().length === 0) return text;
  if (!DEEPSEEK_API_KEY) return text;

  // Cache kontrolü
  if (translationCache.has(text)) {
    return translationCache.get(text);
  }

  // Zaten Türkçe mi kontrol et (basit heuristic)
  const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
  const turkishWords = /\b(bir|ve|ile|için|olan|bu|da|de|mi|ki|ama|hem|ya)\b/i;
  if (turkishChars.test(text) && turkishWords.test(text)) {
    return text; // Zaten Türkçe
  }

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Sen bir çeviri asistanısın. Verilen metni Türkçeye çevir. Sadece çeviriyi döndür, başka bir şey yazma. Emoji ve hashtag\'leri koru. Teknik terimleri ve marka isimlerini çevirme (örn: AI, API, LLM, GPU, token gibi). Kısa ve doğal Türkçe kullan. Eğer metin zaten Türkçeyse aynen döndür.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const translated = response.data?.choices?.[0]?.message?.content?.trim();
    if (translated) {
      translationCache.set(text, translated);
      return translated;
    }
    return text;

  } catch (error) {
    console.error('❌ DeepSeek çeviri hatası:', error.response?.data?.error?.message || error.message);
    return text; // Hata durumunda orijinal metni döndür
  }
}

/**
 * Birden fazla tweet'i toplu çevir (rate limit korumalı)
 */
export async function translateTweets(tweets) {
  if (!DEEPSEEK_API_KEY || !tweets || tweets.length === 0) return tweets;

  console.log(`🌐 ${tweets.length} tweet Türkçeye çevriliyor...`);

  const translated = [];
  for (const tweet of tweets) {
    const translatedText = await translateText(tweet.text);
    translated.push({
      ...tweet,
      text: translatedText,
      originalText: tweet.text // Orijinali sakla
    });

    // Rate limit koruması - istekler arası 200ms bekle
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log(`✅ ${translated.length} tweet çevrildi`);
  return translated;
}

/**
 * Bir aracın tüm tweet'lerini çevir
 */
export async function translateToolTweets(toolData) {
  if (!DEEPSEEK_API_KEY) return toolData;

  const translatedTweets = await translateTweets(toolData.tweets || []);
  return {
    ...toolData,
    tweets: translatedTweets
  };
}

/**
 * Tüm araçların tweet'lerini çevir
 */
export async function translateAllToolsTweets(toolsData) {
  if (!DEEPSEEK_API_KEY) {
    console.log('⚠️ DEEPSEEK_API_KEY yok, çeviri atlanıyor');
    return toolsData;
  }

  console.log(`\n🌐 DeepSeek ile ${toolsData.length} aracın tweet'leri çevriliyor...\n`);

  const results = [];
  for (const tool of toolsData) {
    const translated = await translateToolTweets(tool);
    results.push(translated);
  }

  console.log(`\n✅ Tüm çeviriler tamamlandı\n`);
  return results;
}

export function isTranslateConfigured() {
  return !!DEEPSEEK_API_KEY;
}

export function clearTranslationCache() {
  translationCache.clear();
  console.log('🗑️ Çeviri cache temizlendi');
}
