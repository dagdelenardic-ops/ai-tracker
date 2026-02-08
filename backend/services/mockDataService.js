import { aiTools } from '../data/ai-tools.js';

// Gerçekçi ve detaylı mock tweet'ler
const mockTweetTemplates = {
  chatbots: [
    {
      text: "🚀 Yeni modelimiz {feature} özelliğiyle yayında! Daha hızlı, daha akıllı ve daha güvenli. Bu güncelleme ile birlikte kullanıcı deneyimi büyük ölçüde iyileştirildi. Hemen deneyin ve farkı görün! #AI #YapayZeka #Teknoloji",
      engagement: { likes: 15420, retweets: 3420, replies: 890 }
    },
    {
      text: "📢 Önemli duyuru: Artık {feature} destekliyoruz! Uzun zamandır beklenen bu özellik nihayet kullanıma sunuldu. Tüm kullanıcılarımız için aktif olacak. Detaylar için blog yazımızı okuyun. {url}",
      engagement: { likes: 12300, retweets: 2800, replies: 650 }
    },
    {
      text: "✨ Topluluğumuzdan gelen geri bildirimlerle {feature} geliştirdik. Sizin istekleriniz bizim için çok değerli. Yeni sürümde neler değişti? 🧵👇 (1/5)",
      engagement: { likes: 8900, retweets: 2100, replies: 420 }
    },
    {
      text: "🎉 Bugün itibariyle {feature} kullanıma açıldı! Beta sürecindeki binlerce kullanıcımızdan aldığımız olumlu geri dönüşler sonrası bu özelliği herkese sunuyoruz. Teşekkürler!",
      engagement: { likes: 22100, retweets: 5600, replies: 1200 }
    },
    {
      text: "🔥 Yapay zeka tarihinde bir ilk: {feature} ile tanışın! Rakiplerimizden 3x daha hızlı, %40 daha ucuz. İşte kanıtlanmış test sonuçlarımız. Bu devrim niteliğindeki değişimi kaçırmayın!",
      engagement: { likes: 45600, retweets: 12300, replies: 3400 }
    }
  ],
  image: [
    {
      text: "🎨 Yeni görsel modelimiz {feature} ile inanılmaz sonuçlar! Metinden 4K görsel oluşturma artık saniyeler içinde. Örnek görseller ve detaylar için profilimize göz atın. #AIArt #ImageGeneration",
      engagement: { likes: 18900, retweets: 4500, replies: 780 }
    },
    {
      text: "✨ {feature} desteği eklendi! Artık portrelerde yüz tutarlılığı çok daha iyi. Müşterilerimizin talepleri doğrultusunda geliştirdiğimiz bu özellik şimdi kullanımda. Önce/sonra örnekleri? 👇",
      engagement: { likes: 11200, retweets: 2300, replies: 540 }
    },
    {
      text: "📸 Görsel oluşturma kalitemizde devrim: {feature} aktif! Fotoğraf-realistik görseller için yeni standart. Profesyonel fotoğrafçılar bile farkı ayırt edemiyor. Test etmek için ücretsiz krediler dağıtıyoruz! 🎁",
      engagement: { likes: 26700, retweets: 6700, replies: 1500 }
    },
    {
      text: "🚀 Artık {feature} mümkün! İlk deneyen siz olun. Reklamlar, sosyal medya görselleri, ürün fotoğrafları... Hepsi için hazır. İşte örnek çalışmalarımızdan bir thread 🧵",
      engagement: { likes: 9800, retweets: 1900, replies: 320 }
    },
    {
      text: "💡 Yeni özellik: {feature} ile yaratıcılığınızı konuşturun! Tarihi figürleri modern ortamlarda, fantastik sahneleri gerçekçi detaylarla oluşturun. Sınır sizsiniz!",
      engagement: { likes: 14500, retweets: 3100, replies: 670 }
    }
  ],
  video: [
    {
      text: "🎬 Video oluşturma yenilendi! {feature} ile tanışın. 1080p, 60fps sinematik videolar artık birkaç dakikada hazır. Film yapımcıları bile şokta. Örnek videolar için thread'a göz atın 👇",
      engagement: { likes: 32100, retweets: 8900, replies: 2100 }
    },
    {
      text: "🎥 {feature} artık destekleniyor. Kamera hareketleri, zoom, pan... Hepsi AI tarafından otomatik yönetiliyor. Sinematik videolar için profesyonel ekipmana gerek yok artık!",
      engagement: { likes: 23400, retweets: 5600, replies: 980 }
    },
    {
      text: "✨ Yeni video modelimiz {feature} özelliklerini sunuyor. Karakter tutarlılığı, fizik kuralları, ışıklandırma... Her şey bir üst seviyeye taşındı. Hollywood kalitesinde videolar evinizde!",
      engagement: { likes: 28900, retweets: 7200, replies: 1500 }
    },
    {
      text: "🚀 Sürüm güncellemesi: {feature} yayında! Uzun metinleri 2 dakikalık videolara dönüştürün. Eğitim içerikleri, pazarlama videoları, sosyal medya... Tüm ihtiyaçlarınız için hazır.",
      engagement: { likes: 17800, retweets: 3400, replies: 650 }
    },
    {
      text: "🎭 Videolarda yeni dönem: {feature} ile hayal gücünüzü serbest bırakın. Tek bir fotoğraftan hareketli video, metinden senaryolu kısa film... Artık herkes yönetmen olabilir!",
      engagement: { likes: 21300, retweets: 4800, replies: 890 }
    }
  ],
  audio: [
    {
      text: "🎵 Müzik oluşturma {feature} ile daha da güçlü! Profesyonel prodüksiyon kalitesinde şarkılar saniyeler içinde. İşte yeni özelliklerimiz ve örnek parçalar. Dinlemek için linke tıklayın! 🎧",
      engagement: { likes: 15600, retweets: 4200, replies: 760 }
    },
    {
      text: "🎙️ Yeni ses özellikleri: {feature} ile tanışın. Gerçekçi vokal sentezi, çoklu dil desteği, duygusal tonlama... Podcast'ler, sesli kitaplar, reklamlar için mükemmel!",
      engagement: { likes: 12300, retweets: 2800, replies: 540 }
    },
    {
      text: "🎶 {feature} desteği eklendi. Müziğinizi oluşturun, düzenleyin, paylaşın! Amatörden profesyonele herkes için. Ücretsiz deneme süresi başladı, kaçırmayın! 🎁",
      engagement: { likes: 9800, retweets: 2100, replies: 430 }
    },
    {
      text: "🔊 Ses sentezinde devrim: {feature} 🎶 Artık kendi sesinizi klonlayabilir veya binlerce farklı ses tonu arasından seçim yapabilirsiniz. Örnekleri dinlemek için profilimizi ziyaret edin.",
      engagement: { likes: 18900, retweets: 4500, replies: 890 }
    },
    {
      text: "🎼 Yeni güncelleme: {feature} ile müzik yapımı hiç bu kadar kolay olmamıştı. Melodi önerileri, otomatik armoni, profesyonel mix... Sadece fikrinizi getirin, gerisini bize bırakın!",
      engagement: { likes: 11200, retweets: 2400, replies: 560 }
    }
  ],
  coding: [
    {
      text: "💻 Kod yazmayı kolaylaştıran {feature} özelliği yayında! Artık doğal dilde açıklama yapın, biz kodu yazalım. 40+ programlama dili desteği, entegre debugger, otomatik test üretimi...",
      engagement: { likes: 28900, retweets: 7800, replies: 1800 }
    },
    {
      text: "⚡ Developer'lar için müjde: {feature} aktif! Legacy kodları modernize edin, otomatik refactor yapın, güvenlik açıklarını tespit edin. Zamanınızı değerli işlere ayırın.",
      engagement: { likes: 23400, retweets: 5600, replies: 1200 }
    },
    {
      text: "🤖 {feature} ile kodlama daha hızlı ve akıllı. Otomatik tamamlama, context-aware öneriler, dokümantasyon üretimi... IDE'nize entegre edin, verimliliğinizi 3x artırın!",
      engagement: { likes: 19800, retweets: 4500, replies: 980 }
    },
    {
      text: "🔥 Yeni sürümde {feature} bulunuyor. GitHub repolarınızı analiz edin, PR'leri otomatik review edin, CI/CD entegrasyonu ile sorunsuz deploy yapın. Enterprise müşterilerimiz için hazır!",
      engagement: { likes: 16700, retweets: 3400, replies: 670 }
    },
    {
      text: "⌨️ IDE'mize {feature} eklendi! Artık terminalde, tarayıcıda, mobilde kod yazabilirsiniz. Cross-platform senkronizasyon, offline mod, gerçek zamanlı işbirliği... Her yerde kod yazın!",
      engagement: { likes: 21300, retweets: 5200, replies: 1100 }
    }
  ],
  productivity: [
    {
      text: "⚡ Verimliliğinizi artıracak {feature} özelliği! Toplantı notlarını otomatik özetleyin, action item'ları çıkarın, entegrasyonlarla görev yönetimine aktarın. Haftada 5 saat kazanın!",
      engagement: { likes: 14500, retweets: 3200, replies: 540 }
    },
    {
      text: "📝 {feature} ile işlerinizi hızlandırın. E-posta taslağı oluşturun, raporları otomatik yazın, sunumları saniyeler içinde hazırlayın. Ofis işleri hiç bu kadar kolay olmamıştı!",
      engagement: { likes: 11200, retweets: 2400, replies: 430 }
    },
    {
      text: "🔗 Yeni entegrasyon: {feature} 🚀 Artık 100+ uygulama ile tek tıkla bağlanın. Slack, Notion, Trello, Asana... Tüm iş akışınızı otomatize edin. Kurulum sadece 2 dakika!",
      engagement: { likes: 18900, retweets: 4200, replies: 760 }
    },
    {
      text: "🎯 Toplantılarınızda {feature} desteği! Gerçek zamanlı transkript, otomatik özet, katılımcı analizi... Zoom, Teams, Meet ile entegre. Ücretsiz deneme için DM atın!",
      engagement: { likes: 15600, retweets: 3100, replies: 650 }
    },
    {
      text: "✨ {feature} artık kullanılabilir. Dokümanlarınızı analiz edin, anlamsal arama yapın, ilgili içerikleri otomatik bulun. Bilgi yönetiminde yeni bir dönem başlıyor!",
      engagement: { likes: 12300, retweets: 2600, replies: 480 }
    }
  ]
};

const featureList = [
  "çoklu dil desteği", "gerçek zamanlı arama", "görsel analiz",
  "uzun bağlam penceresi", "4K çözünürlük", "video üretimi",
  "ses klonlama", "API erişimi", "plugin desteği",
  "özel talimatlar", "takım çalışması", "otomatik çeviri",
  "kod optimizasyonu", "hata ayıklama", "dokümantasyon oluşturma",
  "mobil uygulama", "masaüstü uygulaması", "tarayıcı uzantısı",
  "arka plan kaldırma", "stil transferi", "yüz değiştirme",
  "metin animasyonu", "3D modelleme", "sanal kamera",
  "podcast oluşturma", "müzik remix", "vokal değiştirme"
];

function getRandomFeatures(count = 1) {
  const shuffled = [...featureList].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Gerçek X tweet ID'leri (örnek)
const sampleTweetIds = [
  "1751234567890123456",
  "1752345678901234567",
  "1753456789012345678",
  "1754567890123456789",
  "1755678901234567890",
  "1756789012345678901",
  "1757890123456789012",
  "1758901234567890123"
];

function generateMockTweet(tool, daysAgo, tweetIndex) {
  const templates = mockTweetTemplates[tool.category] || mockTweetTemplates.chatbots;
  const template = templates[Math.floor(Math.random() * templates.length)];
  const features = getRandomFeatures();
  
  // Template'deki {feature} yerine özellik ekle
  let text = template.text.replace('{feature}', features[0]);
  // {url} varsa kaldır veya gerçek URL ekle
  text = text.replace(/\{url\}/g, '');
  
  // Tarih hesapla - son 90 gün içinde
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);
  createdAt.setHours(Math.floor(Math.random() * 24));
  createdAt.setMinutes(Math.floor(Math.random() * 60));
  
  // Gerçekçi engagement sayıları
  const engagement = template.engagement;
  const variance = 0.3; // ±30% varyasyon
  const likes = Math.floor(engagement.likes * (1 + (Math.random() * variance * 2 - variance)));
  const retweets = Math.floor(engagement.retweets * (1 + (Math.random() * variance * 2 - variance)));
  const replies = Math.floor(engagement.replies * (1 + (Math.random() * variance * 2 - variance)));
  const impressions = Math.floor(likes * (8 + Math.random() * 4)); // Görüntülenme
  
  // Gerçek X URL'si oluştur (mock ID ile)
  const tweetId = sampleTweetIds[tweetIndex % sampleTweetIds.length];
  const url = `https://x.com/${tool.xHandle}/status/${tweetId}`;
  
  return {
    id: tweetId,
    text,
    createdAt: createdAt.toISOString(),
    metrics: {
      like_count: likes,
      retweet_count: retweets,
      reply_count: replies,
      impression_count: impressions
    },
    url,
    isMock: true
  };
}

// Generate mock data for all tools
export function generateAllMockTweets(daysBack = 90) {
  const results = [];
  
  aiTools.forEach((tool, toolIndex) => {
    // Her araç için 1-4 arası tweet
    const tweetCount = Math.floor(Math.random() * 4) + 1;
    const tweets = [];
    
    for (let i = 0; i < tweetCount; i++) {
      // Son 90 gün içinde rastgele dağılım
      const daysAgo = Math.floor(Math.random() * daysBack * 0.9) + 1;
      tweets.push(generateMockTweet(tool, daysAgo, toolIndex + i));
    }
    
    // Tarihe göre sırala (en yeni en üstte)
    tweets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
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
      tweets
    });
  });
  
  // En son paylaşım yapan araç en üstte
  results.sort((a, b) => {
    const dateA = a.tweets[0] ? new Date(a.tweets[0].createdAt) : new Date(0);
    const dateB = b.tweets[0] ? new Date(b.tweets[0].createdAt) : new Date(0);
    return dateB - dateA;
  });
  
  return results;
}

// Timeline oluştur
export function getTimeline() {
  const allData = generateAllMockTweets();
  const timeline = [];
  
  allData.forEach(toolData => {
    toolData.tweets.forEach(tweet => {
      timeline.push({
        ...tweet,
        toolId: toolData.tool,
        toolName: toolData.name,
        xHandle: toolData.xHandle,
        category: toolData.category,
        brandColor: toolData.brandColor,
        logo: toolData.logo
      });
    });
  });
  
  timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return timeline;
}

// Tools with latest tweet
export function getToolsWithLatestTweet(category = 'all') {
  const allData = generateAllMockTweets();
  
  let filtered = allData;
  if (category !== 'all') {
    filtered = allData.filter(t => t.category === category);
  }
  
  return filtered.map(tool => ({
    ...tool,
    latestTweet: tool.tweets[0] || null,
    tweetCount: tool.tweets.length
  }));
}
