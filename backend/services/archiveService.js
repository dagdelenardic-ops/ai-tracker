import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { aiTools } from '../data/ai-tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVE_FILE = path.join(__dirname, '..', 'data', 'archive.json');
const MAX_ARCHIVE_DAYS = 90; // 90 gün tut

// Arşiv dosyasını oku
function readArchive() {
  try {
    if (fs.existsSync(ARCHIVE_FILE)) {
      const raw = fs.readFileSync(ARCHIVE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('⚠️ Arşiv okunamadı:', err.message);
  }
  return { 
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(),
    totalTweets: 0,
    data: {} 
  };
}

// Arşiv dosyasını yaz
function writeArchive(archive) {
  try {
    fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(archive, null, 2), 'utf-8');
  } catch (err) {
    console.error('⚠️ Arşiv yazılamadı:', err.message);
  }
}

// Tweet ID'sine göre benzersiz anahtar oluştur
function getTweetKey(toolId, tweetId) {
  return `${toolId}_${tweetId}`;
}

// Tarihe göre gruplama anahtarı (YYYY-MM-DD)
function getDateKey(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

// Yeni tweetleri arşive ekle
export function addToArchive(toolsData) {
  const archive = readArchive();
  const now = new Date().toISOString();
  let addedCount = 0;

  for (const tool of toolsData) {
    const toolId = tool.tool;
    
    if (!archive.data[toolId]) {
      archive.data[toolId] = {
        tool: toolId,
        name: tool.name,
        xHandle: tool.xHandle,
        category: tool.category,
        categoryLabel: tool.categoryLabel,
        brandColor: tool.brandColor,
        logo: tool.logo,
        tweets: []
      };
    }

    // Mevcut tweet ID'lerini set olarak tut
    const existingIds = new Set(archive.data[toolId].tweets.map(t => t.id));

    for (const tweet of tool.tweets || []) {
      if (!existingIds.has(tweet.id)) {
        archive.data[toolId].tweets.push({
          ...tweet,
          archivedAt: now
        });
        addedCount++;
      }
    }
  }

  // Eski tweetleri temizle (90 günden eski)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_ARCHIVE_DAYS);

  for (const toolId in archive.data) {
    archive.data[toolId].tweets = archive.data[toolId].tweets.filter(tweet => {
      const tweetDate = new Date(tweet.createdAt);
      return tweetDate >= cutoffDate;
    });
  }

  // Boş kalan tool'ları kaldır
  for (const toolId in archive.data) {
    if (archive.data[toolId].tweets.length === 0) {
      delete archive.data[toolId];
    }
  }

  // İstatistikleri güncelle
  archive.updatedAt = now;
  archive.totalTweets = Object.values(archive.data).reduce(
    (acc, tool) => acc + tool.tweets.length, 0
  );

  writeArchive(archive);
  
  if (addedCount > 0) {
    console.log(`📦 Arşive ${addedCount} yeni tweet eklendi (Toplam: ${archive.totalTweets})`);
  }
  
  return { addedCount, totalTweets: archive.totalTweets };
}

// Arşivi getir (zaman çizelgesi formatında)
export function getArchive({ category = 'all', days = 90, toolId = null } = {}) {
  const archive = readArchive();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let tools = Object.values(archive.data);

  // Kategori filtresi
  if (category !== 'all') {
    tools = tools.filter(tool => tool.category === category);
  }

  // Tool filtresi
  if (toolId) {
    tools = tools.filter(tool => tool.tool === toolId);
  }

  // Zaman çizelgesi oluştur
  const timeline = [];
  
  for (const tool of tools) {
    for (const tweet of tool.tweets) {
      const tweetDate = new Date(tweet.createdAt);
      if (tweetDate >= cutoffDate) {
        timeline.push({
          ...tweet,
          toolId: tool.tool,
          toolName: tool.name,
          xHandle: tool.xHandle,
          category: tool.category,
          brandColor: tool.brandColor,
          logo: tool.logo
        });
      }
    }
  }

  // Tarihe göre sırala (en yeni en üstte)
  timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    archiveDateRange: {
      from: cutoffDate.toISOString(),
      to: new Date().toISOString()
    },
    totalTweets: timeline.length,
    toolsCount: tools.length,
    data: timeline
  };
}

// Arşiv istatistikleri
export function getArchiveStats() {
  const archive = readArchive();
  const tools = Object.values(archive.data);
  
  // Günlük tweet sayıları
  const dailyStats = {};
  
  for (const tool of tools) {
    for (const tweet of tool.tweets) {
      const dateKey = getDateKey(tweet.createdAt);
      dailyStats[dateKey] = (dailyStats[dateKey] || 0) + 1;
    }
  }

  // Kategori dağılımı
  const categoryStats = {};
  for (const tool of tools) {
    categoryStats[tool.category] = (categoryStats[tool.category] || 0) + tool.tweets.length;
  }

  return {
    createdAt: archive.createdAt,
    updatedAt: archive.updatedAt,
    totalTweets: archive.totalTweets,
    toolsCount: tools.length,
    dailyStats,
    categoryStats
  };
}

// Belirli bir tool'un arşivini getir
export function getToolArchive(toolId, days = 90) {
  return getArchive({ toolId, days });
}
