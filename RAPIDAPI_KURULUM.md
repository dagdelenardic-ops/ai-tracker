# RapidAPI Kurulum Rehberi

## Adım 1: Hesap Oluştur
1. Git: https://rapidapi.com/
2. "Sign Up" → Email veya Google ile kaydol

## Adım 2: Twitter API Bul
1. Arama çubuğuna yaz: **"Twitter API45"**
2. Veya: https://rapidapi.com/alexanderxbx/api/twitter-api45

## Adım 3: Abone Ol (Ücretsiz)
1. API sayfasına gir
2. "Pricing" sekmesine tıkla
3. "Free" planı seç (Basic $0)
4. "Subscribe" butonuna tıkla

## Adım 4: API Key Al
1. Sağ üstten "Code Snippets" sekmesi
2. "JavaScript (fetch)" seç
3. `X-RapidAPI-Key:` değerini kopyala

```javascript
// Örnek:
"X-RapidAPI-Key": "123456789mshabcdef1234567890p1abcd1jsnabcdef123456"
```

## Adım 5: Projeye Ekle

### .env dosyasını aç:
```bash
ai-tracker/backend/.env
```

### RapidAPI Key'i yapıştır:
```env
RAPIDAPI_KEY=123456789mshabcdef1234567890p1abcd1jsnabcdef123456
```

### Sunucuyu yeniden başlat:
```bash
cd ai-tracker
npm run dev
```

---

## ✅ Kontrol Et

Siteye gir (http://localhost:5173) ve API Durumu kartına bak:
- **Mavi renk** görmelisin: "Alternatif API"
- RapidAPI: ✓ görmelisin

---

## 📊 RapidAPI Limitleri (Free Plan)

| Limit | Değer |
|-------|-------|
| Aylık istek | 500 |
| Saniye başına | 1 istek |

35 AI aracı × 5 tweet = 175 istek
Günde 2-3 kere yenileme = yeterli!

---

## 🔧 Sorun Olursa

### "Unauthorized" hatası
- API key yanlıştır
- Boşluk karakteri olabilir
- Başındaki "X-RapidAPI-Key:" yazısını kaldır

### "Too Many Requests"
- Limit aşıldı
- 1 dakika bekle veya yarın dene

### Hiçbir veri gelmiyor
- Username değişmiş olabilir
- Hesap gizli olabilir
- Mock veriye otomatik düşer (sorun değil)
