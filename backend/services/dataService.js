import { generateAllMockTweets } from './mockDataService.js';
import { fetchAllTweetsAlternative, isAlternativeApiConfigured } from './alternativeApiService.js';
import { translateAllToolsTweets, isTranslateConfigured, clearTranslationCache } from './translateService.js';
import { aiTools } from '../data/ai-tools.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Serverless ortam kontrolü (Vercel)
const IS_SERVERLESS = !!process.env.VERCEL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHED_TWEETS_FILE = path.join(__dirname, '..', 'data', 'cached-tweets.json');
const TWEET_WINDOW_HOURS = Number(process.env.TWEET_WINDOW_HOURS || 24);
const TWEET_WINDOW_MS = TWEET_WINDOW_HOURS * 60 * 60 * 1000;

// Cache (sadece persistent process'lerde çalışır - lokalde)
let cachedData = null;
let cacheTime = null;
let cachedSource = 'mock';
let lastSnapshotFetchedAt = null;
let fetchInProgress = null;
const CACHE_DURATION = 1000 * 60 * 15; // 15 dakika

function readSnapshotFile({ requireNonEmpty = true } = {}) {
  try {
    if (fs.existsSync(CACHED_TWEETS_FILE)) {
      const raw = fs.readFileSync(CACHED_TWEETS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.data) && (!requireNonEmpty || parsed.data.length > 0)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('⚠️ Snapshot okunamadı:', err.message);
  }
  return null;
}

function writeSnapshotFile(data, source = 'rapidapi') {
  const output = {
    fetchedAt: new Date().toISOString(),
    source,
    toolCount: data.length,
    tweetCount: data.reduce((acc, tool) => acc + (tool.tweets?.length || 0), 0),
    data
  };

  fs.writeFileSync(CACHED_TWEETS_FILE, JSON.stringify(output, null, 2), 'utf-8');
  lastSnapshotFetchedAt = output.fetchedAt;
}

function withToolMeta(tools = []) {
  return tools.map(tool => ({
    ...tool,
    latestTweet: tool.tweets && tool.tweets.length > 0 ? tool.tweets[0] : null,
    tweetCount: tool.tweets ? tool.tweets.length : 0
  }));
}

function filterToolsByWindow(tools = [], referenceTimeMs = Date.now()) {
  const threshold = referenceTimeMs - TWEET_WINDOW_MS;

  return tools
    .map(tool => {
      const tweets = (tool.tweets || []).filter(tweet => {
        const ts = new Date(tweet.createdAt).getTime();
        return Number.isFinite(ts) && ts >= threshold;
      });

      return {
        ...tool,
        tweets
      };
    })
    .filter(tool => tool.tweets.length > 0);
}

function buildEmptyToolsList(source = 'unavailable') {
  return aiTools.map(tool => ({
    tool: tool.id,
    name: tool.name,
    xHandle: tool.xHandle,
    category: tool.category,
    categoryLabel: tool.categoryLabel,
    brandColor: tool.brandColor,
    logo: tool.logo,
    company: tool.company,
    description: tool.description,
    tweets: [],
    source
  }));
}

async function fetchLiveData() {
  let result = await fetchAllTweetsAlternative();

  if (!result || result.length === 0) {
    return null;
  }

  if (isTranslateConfigured()) {
    result = await translateAllToolsTweets(result);
  }

  return result;
}

export async function getToolsWithTweets(category = 'all', forceRefresh = false) {
  try {
    let data = null;
    let hasSnapshotSource = false;

    // 1) Önce process cache (forceRefresh değilse)
    if (!forceRefresh && cachedData && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      data = cachedData;
      hasSnapshotSource = cachedSource !== 'mock' && cachedSource !== 'unavailable';
    }

    // 2) Snapshot dosyasını kullan (Vercel + local varsayılan akış)
    if (!data) {
      const snapshot = readSnapshotFile();
      if (snapshot) {
        data = snapshot.data;
        hasSnapshotSource = true;
        lastSnapshotFetchedAt = snapshot.fetchedAt || null;
        cachedSource = snapshot.source || 'snapshot';
        cachedData = data;
        cacheTime = Date.now();
      }
    }

    // 3) Canlı çekim sadece lokal + zorunlu yenilemede çalışsın
    if (!IS_SERVERLESS && forceRefresh && isAlternativeApiConfigured()) {
      if (fetchInProgress) {
        data = await fetchInProgress;
      } else {
        fetchInProgress = (async () => {
          const liveData = await fetchLiveData();
          if (liveData && liveData.length > 0) {
            writeSnapshotFile(liveData, 'rapidapi');
            cachedSource = 'rapidapi';
            cachedData = liveData;
            cacheTime = Date.now();
            hasSnapshotSource = true;
          }
          return liveData;
        })();

        try {
          data = await fetchInProgress;
        } finally {
          fetchInProgress = null;
        }
      }
    }

    // 4) Son çare
    if (data === null) {
      // Production/serverless ortamında sahte veri üretme, boş dön.
      if (IS_SERVERLESS || IS_PRODUCTION) {
        data = buildEmptyToolsList();
        cachedSource = 'unavailable';
        cachedData = data;
        cacheTime = Date.now();
      } else {
        data = generateAllMockTweets();
        cachedSource = 'mock';
        cachedData = data;
        cacheTime = Date.now();
      }
    }

    // 24 saatlik pencere filtresi (canlı/snapshot veriler)
    // Snapshot akışında pencereyi snapshot'in alindigi ana gore uygula (gunluk digest gibi kalsin).
    if (hasSnapshotSource || cachedSource.startsWith('rapidapi') || cachedSource === 'x_api') {
      const referenceTimeMs = hasSnapshotSource && lastSnapshotFetchedAt
        ? new Date(lastSnapshotFetchedAt).getTime()
        : Date.now();

      const filtered = filterToolsByWindow(data, referenceTimeMs);

      // Snapshot var ama pencere icinde tweet yoksa UI bos kalmasin.
      if (filtered.length === 0 && (IS_SERVERLESS || IS_PRODUCTION)) {
        data = buildEmptyToolsList(cachedSource || 'unavailable');
        cachedData = data;
        cacheTime = Date.now();
      } else {
        data = filtered;
      }
    }

    data = withToolMeta(data);

    // Kategori filtresi uygula
    if (category !== 'all') {
      data = data.filter(tool => tool.category === category);
    }

    return data;
  } catch (error) {
    console.error('❌ Hata:', error);
    if (IS_SERVERLESS || IS_PRODUCTION) {
      return [];
    }
    return withToolMeta(generateAllMockTweets());
  }
}

export async function getTimeline(category = 'all', forceRefresh = false) {
  const tools = await getToolsWithTweets(category, forceRefresh);
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
  cachedSource = 'snapshot';
  clearTranslationCache();
  console.log('🗑️ Cache temizlendi');
}

export function getApiStatus() {
  const snapshot = readSnapshotFile({ requireNonEmpty: false });
  const snapshotAvailable = !!(snapshot && Array.isArray(snapshot.data) && snapshot.data.length > 0);

  return {
    source: cachedSource,
    mode: IS_SERVERLESS ? 'snapshot_only' : 'snapshot_local_refresh',
    tweetWindowHours: TWEET_WINDOW_HOURS,
    rapidApiConfigured: isAlternativeApiConfigured(),
    translateConfigured: isTranslateConfigured(),
    cached: !!cachedData,
    snapshotAvailable,
    snapshotToolCount: snapshot?.toolCount || 0,
    snapshotTweetCount: snapshot?.tweetCount || 0,
    lastUpdated: snapshotAvailable ? (lastSnapshotFetchedAt || snapshot?.fetchedAt || null) : null
  };
}
