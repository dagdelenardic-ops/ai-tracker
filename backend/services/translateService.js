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
 * Birden fazla metni tek API çağrısında toplu çevir
 */
async function translateBatch(texts) {
  if (!DEEPSEEK_API_KEY || texts.length === 0) return texts;

  // Cache'te olanları ayır
  const uncachedIndices = [];
  const results = [...texts];

  texts.forEach((text, i) => {
    if (translationCache.has(text)) {
      results[i] = translationCache.get(text);
    } else {
      // Türkçe kontrolü
      const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
      const turkishWords = /\b(bir|ve|ile|için|olan|bu|da|de|mi|ki|ama|hem|ya)\b/i;
      if (turkishChars.test(text) && turkishWords.test(text)) {
        results[i] = text; // Zaten Türkçe
      } else {
        uncachedIndices.push(i);
      }
    }
  });

  if (uncachedIndices.length === 0) return results;

  // Toplu çeviri isteği
  const textsToTranslate = uncachedIndices.map(i => texts[i]);
  const numberedTexts = textsToTranslate.map((t, i) => `[${i + 1}] ${t}`).join('\n---\n');

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Sen bir çeviri asistanısın. Sana numaralı metinler verilecek. Her birini Türkçeye çevir. Yanıtını aynı numaralama formatında döndür: [1] çeviri1\n---\n[2] çeviri2\nEmoji ve hashtag'leri koru. Teknik terimleri ve marka isimlerini çevirme (örn: AI, API, LLM, GPU, token). Kısa ve doğal Türkçe kullan.`
          },
          {
            role: 'user',
            content: numberedTexts
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const responseText = response.data?.choices?.[0]?.message?.content?.trim();
    if (responseText) {
      // Yanıtı parse et
      const parts = responseText.split(/\n---\n/);
      parts.forEach((part, i) => {
        if (i < uncachedIndices.length) {
          const cleaned = part.replace(/^\[\d+\]\s*/, '').trim();
          if (cleaned) {
            const originalIndex = uncachedIndices[i];
            results[originalIndex] = cleaned;
            translationCache.set(texts[originalIndex], cleaned);
          }
        }
      });
    }
  } catch (error) {
    console.error('❌ DeepSeek toplu çeviri hatası:', error.response?.data?.error?.message || error.message);
    // Hata durumunda orijinal metinleri koru
  }

  return results;
}

/**
 * Birden fazla tweet'i toplu çevir (batch API çağrısı)
 */
export async function translateTweets(tweets) {
  if (!DEEPSEEK_API_KEY || !tweets || tweets.length === 0) return tweets;

  console.log(`🌐 ${tweets.length} tweet Türkçeye çevriliyor (toplu)...`);

  const texts = tweets.map(t => t.text);
  const translatedTexts = await translateBatch(texts);

  const translated = tweets.map((tweet, i) => ({
    ...tweet,
    text: translatedTexts[i] || tweet.text,
    originalText: tweet.text
  }));

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
 * Tüm araçların tweet'lerini çevir - 3 paralel batch
 */
export async function translateAllToolsTweets(toolsData) {
  if (!DEEPSEEK_API_KEY) {
    console.log('⚠️ DEEPSEEK_API_KEY yok, çeviri atlanıyor');
    return toolsData;
  }

  console.log(`\n🌐 DeepSeek ile ${toolsData.length} aracın tweet'leri çevriliyor (paralel)...\n`);

  // 3'erli paralel batch'ler halinde çevir
  const BATCH_SIZE = 3;
  const results = [...toolsData];

  for (let i = 0; i < toolsData.length; i += BATCH_SIZE) {
    const batch = toolsData.slice(i, i + BATCH_SIZE);
    const translated = await Promise.allSettled(
      batch.map(tool => translateToolTweets(tool))
    );

    translated.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results[i + idx] = result.value;
      }
    });

    // Batch arası kısa bekleme
    if (i + BATCH_SIZE < toolsData.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
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
