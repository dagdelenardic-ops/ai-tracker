#!/usr/bin/env node

/**
 * Günlük snapshot scripti:
 * 1) RapidAPI'den araç tweet'lerini çeker
 * 2) DeepSeek varsa Türkçeye çevirir
 * 3) backend/data/cached-tweets.json dosyasına yazar
 *
 * Kullanım:
 *   cd backend && node scripts/fetch-tweets.js
 *
 * Bu dosya git'e commit edilip Vercel'de doğrudan okunur.
 * Böylece Vercel runtime'da dış API çağrısı yapılmaz.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { aiTools } from '../data/ai-tools.js';
import { translateAllToolsTweets, isTranslateConfigured } from '../services/translateService.js';
import { fetchAllTweets, isXApiConfigured } from '../services/xApiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'cached-tweets.json');

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'twitter-api45.p.rapidapi.com';
const MAX_RESULTS_PER_TOOL = 5;
const REQUEST_DELAY_MS = 2000;
const TWEET_WINDOW_HOURS = Number(process.env.TWEET_WINDOW_HOURS || 24);

if (!RAPIDAPI_KEY) {
  console.error('❌ RAPIDAPI_KEY bulunamadı! .env dosyasını kontrol edin.');
  process.exit(1);
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
    console.warn('⚠️ Mevcut snapshot okunamadı:', error.message);
    return null;
  }
}

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

async function fetchFromRapidAPI(username, maxResults = MAX_RESULTS_PER_TOOL) {
  try {
    console.log(`🚀 ${username} için veri çekiliyor...`);

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
      console.log(`  ⚠️ ${username}: tweet bulunamadı`);
      return null;
    }

    const windowStart = new Date(Date.now() - TWEET_WINDOW_HOURS * 60 * 60 * 1000);

    const parsed = tweets
      .slice(0, maxResults)
      .map(tweet => {
        const tweetId = tweet.tweet_id || tweet.id;
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
          isMock: false,
          source: 'rapidapi'
        };
      })
      .filter(t => new Date(t.createdAt) >= windowStart);

    if (parsed.length === 0) {
      console.log(`  ⚠️ ${username}: Son ${TWEET_WINDOW_HOURS} saatte tweet yok`);
      return null;
    }

    console.log(`  ✅ ${username}: ${parsed.length} tweet`);
    return parsed;

  } catch (error) {
    if (error.response?.status === 429) {
      console.warn(`  ⚠️ Rate limit (${username}) - 5s bekleniyor...`);
      await new Promise(r => setTimeout(r, 5000));
      // Bir kez daha dene
      try {
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
        if (tweets.length > 0) {
          const windowStart = new Date(Date.now() - TWEET_WINDOW_HOURS * 60 * 60 * 1000);
          const parsed = tweets.slice(0, 5).map(tweet => ({
            id: tweet.tweet_id || tweet.id,
            text: tweet.text || tweet.full_text || '',
            createdAt: tweet.created_at ? new Date(tweet.created_at).toISOString() : new Date().toISOString(),
            metrics: {
              like_count: tweet.favorites || 0,
              retweet_count: tweet.retweets || 0,
              reply_count: tweet.replies || 0,
              impression_count: parseInt(tweet.views) || 0,
              bookmark_count: tweet.bookmarks || 0,
              quote_count: tweet.quotes || 0
            },
            url: buildTweetUrl(
              username,
              tweet.tweet_id || tweet.id,
              tweet.url || tweet.tweet_url || tweet.permalink || ''
            ),
            isMock: false,
            source: 'rapidapi'
          })).filter(t => new Date(t.createdAt) >= windowStart);
          if (parsed.length > 0) {
            console.log(`  ✅ ${username}: ${parsed.length} tweet (retry)`);
            return parsed;
          }
        }
      } catch {
        // ignore retry error
      }
      return null;
    }
    console.error(`  ❌ ${username}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log(`\n📡 RapidAPI'den ${aiTools.length} AI aracının tweet'leri çekiliyor...\n`);
  console.log(`   Rate limit koruması: istekler arası ${REQUEST_DELAY_MS / 1000}s bekleme\n`);
  console.log(`   Zaman penceresi: son ${TWEET_WINDOW_HOURS} saat\n`);
  console.log(`   DeepSeek çeviri: ${isTranslateConfigured() ? 'AKTIF' : 'PASIF'}\n`);

  const existingSnapshot = readExistingSnapshot();
  const results = [];
  let successCount = 0;
  let failCount = 0;
  let source = 'rapidapi';

  for (const tool of aiTools) {
    const tweets = await fetchFromRapidAPI(tool.xHandle, MAX_RESULTS_PER_TOOL);

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
      successCount++;
      failCount = 0;
    } else {
      failCount++;
      if (failCount >= 10) {
        console.warn('\n⚠️ 10 ardışık hata - durduruluyor.\n');
        break;
      }
    }

    // Rate limit koruması
    await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
  }

  if (results.length === 0 && isXApiConfigured()) {
    console.log('\n⚙️ RapidAPI sonuçsuz kaldı, X API fallback deneniyor...\n');
    const xApiResults = await fetchAllTweets(MAX_RESULTS_PER_TOOL);
    const enrichedXApiResults = enrichXApiToolsData(xApiResults || []);
    if (enrichedXApiResults.length > 0) {
      results.push(...enrichedXApiResults);
      successCount = enrichedXApiResults.length;
      source = 'x_api';
      console.log(`✅ X API fallback başarılı: ${enrichedXApiResults.length} araç`);
    }
  }

  if (results.length === 0) {
    if (existingSnapshot && existingSnapshot.data.length > 0) {
      console.warn('\n⚠️ Yeni veri 0; mevcut snapshot korunuyor (dosya güncellenmedi).\n');
      return;
    }

    console.error('\n❌ Hiç veri çekilemedi ve korunacak eski snapshot da yok.\n');
    process.exit(1);
  }

  // Tarihe göre sırala
  results.sort((a, b) => {
    const dateA = a.tweets[0] ? new Date(a.tweets[0].createdAt) : new Date(0);
    const dateB = b.tweets[0] ? new Date(b.tweets[0].createdAt) : new Date(0);
    return dateB - dateA;
  });

  let finalResults = results;
  if (isTranslateConfigured()) {
    finalResults = await translateAllToolsTweets(results);
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    source: isTranslateConfigured() ? `${source}+deepseek` : source,
    toolCount: finalResults.length,
    tweetCount: finalResults.reduce((acc, r) => acc + r.tweets.length, 0),
    data: finalResults
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ Tamamlandı!`);
  console.log(`   ${successCount} araç, ${output.tweetCount} tweet`);
  console.log(`   Çeviri: ${isTranslateConfigured() ? 'DeepSeek ile yapıldı' : 'Atlandı (DEEPSEEK_API_KEY yok)'}`);
  console.log(`   Kaydedildi: ${OUTPUT_FILE}\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
