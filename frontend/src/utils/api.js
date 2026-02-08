const API_BASE = '/api';

export async function fetchTools(category = 'all') {
  const res = await fetch(`${API_BASE}/tools?category=${category}`);
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/tools/categories`);
  return res.json();
}

// X API veya Mock veri - refresh parametresi ile cache'i atla
export async function fetchToolsWithTweets(category = 'all', limit = 50, refresh = false) {
  const refreshParam = refresh ? '&refresh=true' : '';
  const res = await fetch(`${API_BASE}/tools/with-tweets?category=${category}&limit=${limit}${refreshParam}`);
  return res.json();
}

export async function fetchTimeline(category = 'all', limit = 100, refresh = false) {
  const refreshParam = refresh ? '&refresh=true' : '';
  const res = await fetch(`${API_BASE}/tools/timeline?category=${category}&limit=${limit}${refreshParam}`);
  return res.json();
}

export async function searchTools(query) {
  const res = await fetch(`${API_BASE}/tools/search/${encodeURIComponent(query)}`);
  return res.json();
}

// API durumunu kontrol et
export async function fetchApiStatus() {
  const res = await fetch(`${API_BASE}/tools/status/api`);
  return res.json();
}

// X API bağlantısını test et
export async function testXApiConnection() {
  const res = await fetch(`${API_BASE}/tools/test/x-api`);
  return res.json();
}

// Verileri yenile (cache'i temizle)
export async function refreshData() {
  const res = await fetch(`${API_BASE}/tools/refresh`, { method: 'POST' });
  return res.json();
}

// ========== ARŞİV API'LERİ ==========

// Arşiv zaman çizelgesini getir (tüm geçmiş tweetler)
export async function fetchArchive(category = 'all', days = 90, limit = 500) {
  const res = await fetch(`${API_BASE}/tools/archive?category=${category}&days=${days}&limit=${limit}`);
  return res.json();
}

// Arşiv istatistiklerini getir
export async function fetchArchiveStats() {
  const res = await fetch(`${API_BASE}/tools/archive/stats`);
  return res.json();
}

// Belirli bir aracın arşivini getir
export async function fetchToolArchive(toolId, days = 90) {
  const res = await fetch(`${API_BASE}/tools/archive/${toolId}?days=${days}`);
  return res.json();
}
