# 🤖 AI Tracker

X (Twitter) hesaplarından AI araçlarının son gelişmelerini takip eden modern dashboard uygulaması.

![AI Tracker](https://img.shields.io/badge/AI-Tracker-purple)
![React](https://img.shields.io/badge/React-18-61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4)

## 🚀 Hızlı Başlangıç

```bash
# 1. Projeyi indir
cd ai-tracker

# 2. Bağımlılıkları kur
npm run install:all

# 3. Çalıştır
npm run dev
```

**Site:** http://localhost:5173

## 🔑 Veri Modeli (24 Saatte Bir Güncelleme)

Vercel tarafında runtime'da RapidAPI çağrısı yapılmaz. Site yalnızca
`backend/data/cached-tweets.json` snapshot dosyasını okur.

Bu snapshot dosyası her 24 saatte bir GitHub Actions ile güncellenir:

- X verisi: RapidAPI (`twitter-api45`)
- Türkçe çeviri: DeepSeek (opsiyonel ama önerilir)

Workflow dosyası:

- `.github/workflows/daily-refresh.yml`

GitHub repository **Secrets** alanına ekleyin:

- `RAPIDAPI_KEY` (zorunlu)
- `DEEPSEEK_API_KEY` (opsiyonel)
- `X_BEARER_TOKEN` (opsiyonel fallback)

Manuel test için:

```bash
cd backend
node scripts/fetch-tweets.js
```

## ✨ Özellikler

| Özellik | Açıklama |
|---------|----------|
| 🤖 **35+ AI Aracı** | ChatGPT, Claude, Gemini, Grok, Midjourney, Runway, Cursor... |
| 🐦 **X Entegrasyonu** | Doğrudan X gönderilerini sitede görüntüle |
| 📅 **Son 24 Saat** | Son 24 saatteki gelişmeleri takip et |
| 🏷️ **6 Kategori** | Chatbots, Image, Video, Audio, Coding, Productivity |
| ❤️ **Favoriler** | Sevdiğin araçları kaydet |
| 🔍 **Arama & Filtre** | İsim, kategori, tarih |
| 🌙 **Dark Mode** | Modern dark tema + marka renkleri |
| 📱 **Responsive** | Mobil ve masaüstü |

## 📁 Proje Yapısı

```
ai-tracker/
├── .github/workflows/       # Daily snapshot workflow
├── backend/                 # Node.js + Express API
│   ├── data/ai-tools.js     # 35+ AI aracı veritabanı
│   ├── data/cached-tweets.json # Günlük snapshot
│   ├── scripts/fetch-tweets.js # RapidAPI + DeepSeek çekim scripti
│   ├── services/
│   │   ├── xApiService.js   # X API entegrasyonu
│   │   ├── mockDataService.js # Demo veri
│   │   └── dataService.js   # Veri yönetimi
│   ├── routes/tools.js      # API routes
│   └── server.js            # Express server
│
├── frontend/                # React + Vite + Tailwind
│   └── src/
│       ├── components/      # React komponentleri
│       ├── context/         # Global state
│       ├── pages/           # Sayfalar
│       └── utils/           # API fonksiyonları
│
└── package.json
```

## 🔌 API Endpoints

| Endpoint | Açıklama |
|----------|----------|
| `GET /api/health` | Sağlık kontrolü |
| `GET /api/tools` | Tüm AI araçları |
| `GET /api/tools/with-tweets` | Tweet'lerle birlikte |
| `GET /api/tools/timeline` | Zaman çizelgesi |
| `GET /api/tools/status/api` | API durumu |
| `POST /api/tools/refresh` | Runtime cache temizle (yerel kullanım) |

## ⚠️ X API Limitleri (Free Plan)

| Limit | Değer |
|-------|-------|
| Aylık tweet okuma | 1,500 |
| Saatte max istek | 100 |
| Tek seferde max | 5 tweet/hesap |

## 🛠️ Komutlar

```bash
# Her ikisini aynı anda başlat
npm run dev

# Sadece backend
npm run dev:backend

# Sadece frontend
npm run dev:frontend

# Snapshot'ı manuel yenile (RapidAPI + DeepSeek)
npm run snapshot:refresh

# Üretim build
npm run build
```

## 📝 Notlar

- **Güncelleme sıklığı:** Snapshot her 24 saatte bir güncellenir
- **Vercel davranışı:** Runtime'da dış API yerine snapshot dosyası kullanılır
- **Cache:** API cevapları 24 saat edge cache ile servis edilir
- **Fallback:** RapidAPI limitinde snapshot job otomatik X API (`X_BEARER_TOKEN`) dener
- **Canlı veri yoksa:** Production'da demo yerine boş liste gösterilir (`Canlı Veri Yok`)

## 📄 Lisans

MIT

---

Made with ❤️ for AI enthusiasts
