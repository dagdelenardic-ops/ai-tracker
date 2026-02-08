#!/usr/bin/env node

/**
 * Gunluk snapshot scripti:
 * 1) X syndication (embed timeline) uzerinden arac hesaplarinin tweet'lerini ceker (token gerekmez)
 * 2) DeepSeek varsa Turkce'ye cevirir
 * 3) backend/data/cached-tweets.json dosyasina yazar
 *
 * Kullanim:
 *   cd backend && node scripts/fetch-tweets.js
 *
 * Bu dosya git'e commit edilip Vercel'de dogrudan okunur.
 * Boylece Vercel runtime'da dis API cagrisi yapilmaz.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { aiTools } from '../data/ai-tools.js';
import { translateAllToolsTweets, isTranslateConfigured } from '../services/translateService.js';
import { fetchAllTweets, isXApiConfigured } from '../services/xApiService.js';
import { addToArchive } from '../services/archiveService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'cached-tweets.json');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-api45.p.rapidapi.com';

const MAX_RESULTS_PER_TOOL = 5;
const TWEET_WINDOW_HOURS = Number(process.env.TWEET_WINDOW_HOURS || 24);

const SYNDICATION_BASE_URL = 'https://syndication.twitter.com/srv/timeline-profile/screen-name';
const SYNDICATION_TIMEOUT_MS = Number(process.env.SYNDICATION_TIMEOUT_MS || 20000);
const SYNDICATION_USER_AGENT =
  process.env.SYNDICATION_USER_AGENT ||
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const RATE_LIMIT_SAFETY_MS = 1500;
const MAX_RATE_LIMIT_RETRIES = 3;

let syndicationRateLimit = {
  limit: null,
  remaining: null,
  resetAtMs: null
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readExistingSnapshot() {
  try {
    if (!fs.existsSync(OUTPUT_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.data)) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('⚠️ Mevcut snapshot okunamadi:', error.message);
    return null;
  }
}

function sanitizeHandle(username = '') {
  return String(username || '').trim().replace(/^@+/, '');
}

function buildProfileUrl(username = '') {
  const handle = sanitizeHandle(username);
  return handle ? `https://twitter.com/${encodeURIComponent(handle)}` : 'https://twitter.com';
}

function buildTweetUrl(username = '', tweetId = '', fallbackUrl = '') {
  if (fallbackUrl && typeof fallbackUrl === 'string' && /^https?:\/\//i.test(fallbackUrl)) {
    // x.com yerine twitter.com kullan
    return fallbackUrl.replace('https://x.com/', 'https://twitter.com/');
  }

  const profileUrl = buildProfileUrl(username);
  const id = String(tweetId || '').trim();
  if (!id || /^(undefined|null|nan)$/i.test(id)) {
    return profileUrl;
  }

  return `${profileUrl}/status/${encodeURIComponent(id)}`;
}

function enrichXApiToolsData(tools = []) {
  const toolMap = new Map(aiTools.map(tool => [tool.id, tool]));

  return tools
    .map(toolData => {
      const meta = toolMap.get(toolData.tool);
      const tweets = (toolData.tweets || []).map(tweet => ({
        ...tweet,
        source: 'x_api',
        url: buildTweetUrl(toolData.xHandle, tweet.id, tweet.url || '')
      }));

      return {
        tool: toolData.tool,
        name: toolData.name || meta?.name || toolData.tool,
        xHandle: toolData.xHandle || meta?.xHandle || '',
        category: toolData.category || meta?.category || 'other',
        categoryLabel: meta?.categoryLabel || '',
        brandColor: toolData.brandColor || meta?.brandColor || '#64748B',
        logo: toolData.logo || meta?.logo || '🤖',
        company: meta?.company || '',
        description: meta?.description || '',
        tweets,
        source: 'x_api'
      };
    })
    .filter(tool => tool.tweets.length > 0);
}

function updateSyndicationRateLimit(headers) {
  const limitRaw = headers.get('x-rate-limit-limit');
  const remainingRaw = headers.get('x-rate-limit-remaining');
  const resetRaw = headers.get('x-rate-limit-reset');

  const limit = limitRaw ? Number(limitRaw) : null;
  const remaining = remainingRaw ? Number(remainingRaw) : null;
  const resetAtMs = resetRaw ? Number(resetRaw) * 1000 : null;

  syndicationRateLimit = {
    limit: Number.isFinite(limit) ? limit : syndicationRateLimit.limit,
    remaining: Number.isFinite(remaining) ? remaining : syndicationRateLimit.remaining,
    resetAtMs: Number.isFinite(resetAtMs) ? resetAtMs : syndicationRateLimit.resetAtMs
  };
}

function computeRateLimitWaitMs(resetAtMs) {
  if (!resetAtMs || !Number.isFinite(resetAtMs)) {
    return 60_000;
  }

  const wait = resetAtMs - Date.now() + RATE_LIMIT_SAFETY_MS;
  return Math.max(wait, 1000);
}

function extractNextDataJson(html = '') {
  if (!html) return null;

  const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  return match[1];
}

// Medya bilgilerini çıkar (fotoğraflar, videolar)
function extractMedia(tweet) {
  const media = [];
  
  // Extended entities içinde media var mı?
  const entities = tweet.extended_entities || tweet.entities;
  
  if (entities?.media && Array.isArray(entities.media)) {
    for (const item of entities.media) {
      const mediaItem = {
        type: item.type, // photo, video, animated_gif
        url: item.media_url_https || item.media_url,
        display_url: item.display_url,
        expanded_url: item.expanded_url
      };
      
      // Video için ek bilgiler
      if (item.type === 'video' || item.type === 'animated_gif') {
        if (item.video_info?.variants) {
          // En yüksek kaliteli MP4'ü bul
          const mp4Variants = item.video_info.variants
            .filter(v => v.content_type === 'video/mp4')
            .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
          
          if (mp4Variants.length > 0) {
            mediaItem.video_url = mp4Variants[0].url;
          }
        }
        mediaItem.duration_millis = item.video_info?.duration_millis;
      }
      
      media.push(mediaItem);
    }
  }
  
  return media;
}

// Alıntı tweet bilgisini çıkar
function extractQuotedTweet(tweet) {
  const quoted = tweet.quoted_status || tweet.quote;
  if (!quoted) return null;
  
  return {
    id: quoted.id_str || quoted.id,
    text: quoted.full_text || quoted.text || '',
    author: {
      name: quoted.user?.name || quoted.author?.name,
      handle: quoted.user?.screen_name || quoted.author?.screen_name
    },
    media: extractMedia(quoted),
    url: quoted.permalink ? `https://twitter.com${quoted.permalink}` : undefined
  };
}

function parseSyndicationTweets({ handle, entries, maxResults, windowStart }) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [];
  }

  const seen = new Set();
  const tweets = [];

  for (const entry of entries) {
    if (entry?.type !== 'tweet') continue;

    const tweet = entry?.content?.tweet;
    if (!tweet) continue;

    const id = tweet.id_str || tweet.conversation_id_str || '';
    if (!id || seen.has(id)) continue;

    const createdAt = tweet.created_at ? new Date(tweet.created_at) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) continue;
    if (createdAt < windowStart) continue;

    seen.add(id);

    const permalink = tweet.permalink ? `https://x.com${tweet.permalink}` : '';
    const media = extractMedia(tweet);
    const quotedTweet = extractQuotedTweet(tweet);

    tweets.push({
      id,
      text: tweet.full_text || tweet.text || '',
      createdAt: createdAt.toISOString(),
      metrics: {
        like_count: tweet.favorite_count || 0,
        retweet_count: tweet.retweet_count || 0,
        reply_count: tweet.reply_count || 0,
        impression_count: tweet.view_count || 0,
        bookmark_count: tweet.bookmark_count || 0,
        quote_count: tweet.quote_count || 0
      },
      url: buildTweetUrl(handle, id, permalink),
      media: media.length > 0 ? media : undefined,
      quotedTweet: quotedTweet || undefined,
      isMock: false,
      source: 'syndication'
    });

    if (tweets.length >= maxResults) break;
  }

  tweets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return tweets.slice(0, maxResults);
}

async function fetchFromSyndication(username, maxResults = MAX_RESULTS_PER_TOOL) {
  const handle = sanitizeHandle(username);
  if (!handle) return null;

  const windowStart = new Date(Date.now() - TWEET_WINDOW_HOURS * 60 * 60 * 1000);
  const url = `${SYNDICATION_BASE_URL}/${encodeURIComponent(handle)}`;

  for (let attempt = 1; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), SYNDICATION_TIMEOUT_MS);

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'user-agent': SYNDICATION_USER_AGENT,
          'accept': 'text/html,application/xhtml+xml'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);
      updateSyndicationRateLimit(res.headers);

      if (res.status === 429) {
        const waitMs = computeRateLimitWaitMs(syndicationRateLimit.resetAtMs);
        console.warn(`  ⚠️ Syndication rate limit (@${handle}) - ${Math.ceil(waitMs / 1000)}s bekleniyor (deneme ${attempt}/${MAX_RATE_LIMIT_RETRIES})...`);
        await sleep(waitMs);
        continue;
      }

      if (!res.ok) {
        console.warn(`  ⚠️ Syndication hata (@${handle}): HTTP ${res.status}`);
        return null;
      }

      const html = await res.text();
      const nextDataJson = extractNextDataJson(html);
      if (!nextDataJson) {
        console.warn(`  ⚠️ Syndication parse hatasi (@${handle}): __NEXT_DATA__ bulunamadi`);
        return null;
      }

      let parsed;
      try {
        parsed = JSON.parse(nextDataJson);
      } catch (err) {
        console.warn(`  ⚠️ Syndication JSON parse hatasi (@${handle}): ${err.message}`);
        return null;
      }

      const entries = parsed?.props?.pageProps?.timeline?.entries || [];
      return parseSyndicationTweets({ handle, entries, maxResults, windowStart });

    } catch (err) {
      const msg = err?.name === 'AbortError' ? 'TIMEOUT' : (err?.message || String(err));
      console.warn(`  ⚠️ Syndication hata (@${handle}): ${msg}`);

      if (attempt < MAX_RATE_LIMIT_RETRIES && (msg.includes('TIMEOUT') || msg.includes('fetch') || msg.includes('network'))) {
        await sleep(1000);
        continue;
      }

      return null;
    }
  }

  return null;
}

async function fetchFromRapidAPI(username, maxResults = MAX_RESULTS_PER_TOOL) {
  if (!RAPIDAPI_KEY) {
    return null;
  }

  try {
    console.log(`  ↪️  RapidAPI fallback: @${username}`);

    const response = await axios.get(
      `https://${RAPIDAPI_HOST}/timeline.php`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST
        },
        params: { screenname: username },
        timeout: 15000
      }
    );

    const tweets = response.data?.timeline || [];
    if (!Array.isArray(tweets) || tweets.length === 0) {
      return null;
    }

    const windowStart = new Date(Date.now() - TWEET_WINDOW_HOURS * 60 * 60 * 1000);

    const parsed = tweets
      .slice(0, maxResults)
      .map(tweet => {
        const tweetId = tweet.tweet_id || tweet.id;
        
        // Medya bilgilerini çıkar
        const media = [];
        if (tweet.media && Array.isArray(tweet.media)) {
          for (const item of tweet.media) {
            const mediaItem = {
              type: item.type || 'photo',
              url: item.media_url_https || item.media_url || item.url,
              display_url: item.display_url,
              expanded_url: item.expanded_url
            };
            
            if (item.type === 'video' && item.video_url) {
              mediaItem.video_url = item.video_url;
            }
            
            media.push(mediaItem);
          }
        }
        
        // Alıntı tweet bilgisi
        let quotedTweet = null;
        if (tweet.quoted_status || tweet.quote) {
          const q = tweet.quoted_status || tweet.quote;
          quotedTweet = {
            id: q.id_str || q.id,
            text: q.full_text || q.text || '',
            author: {
              name: q.user?.name || q.author?.name,
              handle: q.user?.screen_name || q.author?.screen_name
            },
            media: q.media || []
          };
        }
        
        return {
          id: tweetId,
          text: tweet.text || tweet.full_text || '',
          createdAt: tweet.created_at
            ? new Date(tweet.created_at).toISOString()
            : new Date().toISOString(),
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
          media: media.length > 0 ? media : undefined,
          quotedTweet: quotedTweet || undefined,
          isMock: false,
          source: 'rapidapi'
        };
      })
      .filter(t => new Date(t.createdAt) >= windowStart);

    return parsed.length > 0 ? parsed : null;

  } catch (error) {
    if (error.response?.status === 429) {
      console.warn('  ⚠️ RapidAPI rate limit - atlandi');
      return null;
    }
    console.warn(`  ⚠️ RapidAPI hata (@${username}): ${error.message}`);
    return null;
  }
}

function groupToolsByHandle() {
  const handleMap = new Map();

  for (const tool of aiTools) {
    const handle = sanitizeHandle(tool.xHandle);
    if (!handle) continue;

    if (!handleMap.has(handle)) {
      handleMap.set(handle, []);
    }
    handleMap.get(handle).push(tool);
  }

  return handleMap;
}

async function main() {
  console.log(`\n📡 Gunluk snapshot: son ${TWEET_WINDOW_HOURS} saat`);
  console.log(`   Kaynak: X syndication (token gerekmez)`);
  console.log(`   DeepSeek ceviri: ${isTranslateConfigured() ? 'AKTIF' : 'PASIF'}\n`);

  const existingSnapshot = readExistingSnapshot();
  const toolsByHandle = groupToolsByHandle();
  const handles = Array.from(toolsByHandle.keys());

  console.log(`   Toplam arac: ${aiTools.length}`);
  console.log(`   Benzersiz X handle: ${handles.length}\n`);

  const results = [];
  let source = 'syndication';

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    console.log(`[${i + 1}/${handles.length}] @${handle}`);

    // Rate limit'e girdiysek bir sonraki istegi atmadan once bekle
    if (syndicationRateLimit.remaining === 0 && syndicationRateLimit.resetAtMs) {
      const waitMs = computeRateLimitWaitMs(syndicationRateLimit.resetAtMs);
      console.warn(`  ⏳ Rate limit sifir (@${handle}) - ${Math.ceil(waitMs / 1000)}s bekleniyor...`);
      await sleep(waitMs);
    }

    let tweets = await fetchFromSyndication(handle, MAX_RESULTS_PER_TOOL);

    // Syndication bosa donerse ve RapidAPI key varsa tek handle icin fallback dene
    if (!tweets && RAPIDAPI_KEY) {
      const rapidTweets = await fetchFromRapidAPI(handle, MAX_RESULTS_PER_TOOL);
      if (rapidTweets && rapidTweets.length > 0) {
        tweets = rapidTweets;
        source = 'rapidapi';
      }
    }

    if (Array.isArray(tweets) && tweets.length > 0) {
      const toolList = toolsByHandle.get(handle) || [];

      for (const tool of toolList) {
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
          tweets: tweets.map(t => ({ ...t })),
          source: tweets[0]?.source || 'syndication'
        });
      }

      console.log(`  ✅ ${tweets.length} tweet bulundu (${toolList.length} araca eklendi)`);
    } else if (Array.isArray(tweets) && tweets.length === 0) {
      console.log(`  ⚠️ Son ${TWEET_WINDOW_HOURS} saatte tweet yok`);
    } else {
      console.log('  ❌ Veri cekilemedi');
    }
  }

  if (results.length === 0 && isXApiConfigured()) {
    console.log('\n⚙️ Syndication/RapidAPI sonuc yok, X API fallback deneniyor...\n');
    const xApiResults = await fetchAllTweets(MAX_RESULTS_PER_TOOL);
    const enrichedXApiResults = enrichXApiToolsData(xApiResults || []);
    if (enrichedXApiResults.length > 0) {
      results.push(...enrichedXApiResults);
      source = 'x_api';
      console.log(`✅ X API fallback basarili: ${enrichedXApiResults.length} arac`);
    }
  }

  // Tarihe gore sirala
  results.sort((a, b) => {
    const dateA = a.tweets[0] ? new Date(a.tweets[0].createdAt) : new Date(0);
    const dateB = b.tweets[0] ? new Date(b.tweets[0].createdAt) : new Date(0);
    return dateB - dateA;
  });

  let finalResults = results;
  if (isTranslateConfigured() && results.length > 0) {
    finalResults = await translateAllToolsTweets(results);
  }

  // Hic veri yoksa: workflow'u kirmamak icin bos snapshot yaz (veya var olani koru)
  if (finalResults.length === 0) {
    const output = {
      fetchedAt: new Date().toISOString(),
      source: isTranslateConfigured() ? `${source}+deepseek` : source,
      toolCount: 0,
      tweetCount: 0,
      data: []
    };

    // Eski snapshot doluysa ve yeni veri yoksa, daha onceki veriyi koru
    if (existingSnapshot && Array.isArray(existingSnapshot.data) && existingSnapshot.data.length > 0) {
      console.warn('\n⚠️ Yeni veri 0; mevcut snapshot korunuyor (dosya guncellenmedi).\n');
      return;
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
    console.warn('\n⚠️ Hic tweet bulunamadi; bos snapshot yazildi.\n');
    return;
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    source: isTranslateConfigured() ? `${source}+deepseek` : source,
    toolCount: finalResults.length,
    tweetCount: finalResults.reduce((acc, r) => acc + r.tweets.length, 0),
    data: finalResults
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  // Arşive ekle (tüm geçmiş tweetleri biriktir)
  const archiveResult = addToArchive(finalResults);

  console.log(`\n✅ Tamamlandi!`);
  console.log(`   ${output.toolCount} arac, ${output.tweetCount} tweet`);
  console.log(`   Ceviri: ${isTranslateConfigured() ? 'DeepSeek ile yapildi' : 'Atlandi (DEEPSEEK_API_KEY yok)'}`);
  console.log(`   Arsiv: ${archiveResult.totalTweets} toplam tweet`);
  console.log(`   Kaydedildi: ${OUTPUT_FILE}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
