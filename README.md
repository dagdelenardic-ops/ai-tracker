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

## 🔑 X API Etkinleştirme (Opsiyonel)

API'siz de çalışır (demo veri), gerçek X tweet'leri için:

### 1. Token Al
1. Git: https://developer.twitter.com
2. "Sign up" → Free plan seç
3. Projects & Apps → Create App
4. "Keys and Tokens" → **Bearer Token** kopyala

### 2. Token'ı Yapıştır
```bash
# ai-tracker/backend/.env dosyasını aç
X_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxxxxxxxxxx
```

### 3. Yeniden Başlat
```bash
npm run dev
```

✅ **Hazır!** Gerçek tweet'ler çekilecek.

## ✨ Özellikler

| Özellik | Açıklama |
|---------|----------|
| 🤖 **35+ AI Aracı** | ChatGPT, Claude, Gemini, Grok, Midjourney, Runway, Cursor... |
| 🐦 **X Entegrasyonu** | Doğrudan X gönderilerini sitede görüntüle |
| 📅 **Son 3 Ay** | Son 90 günlük paylaşımları takip et |
| 🏷️ **6 Kategori** | Chatbots, Image, Video, Audio, Coding, Productivity |
| ❤️ **Favoriler** | Sevdiğin araçları kaydet |
| 🔍 **Arama & Filtre** | İsim, kategori, tarih |
| 🌙 **Dark Mode** | Modern dark tema + marka renkleri |
| 📱 **Responsive** | Mobil ve masaüstü |

## 📁 Proje Yapısı

```
ai-tracker/
├── backend/                 # Node.js + Express API
│   ├── data/ai-tools.js     # 35+ AI aracı veritabanı
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
| `POST /api/tools/refresh` | Verileri yenile |

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

# Üretim build
npm run build
```

## 📝 Notlar

- **API'siz çalışır:** Demo verilerle çalışmaya devam eder
- **Otomatik yenileme:** Her saat başı veriler güncellenir
- **Cache:** 15 dakika boyunca veriler önbellekten gelir
- **Hata yönetimi:** X API hata verirse otomatik demo veriye döner

## 📄 Lisans

MIT

---

Made with ❤️ for AI enthusiasts
