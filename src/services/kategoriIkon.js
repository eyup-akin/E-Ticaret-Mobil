// ============================================================
//  KATEGORİ İKONU
//
//  Kategori adına göre bir Ionicons ikon adı seçer.
//
//  ⭐ DEĞİŞTİ (4.7) — emoji yerine ikon adı dönüyor.
//
//  ⚠️ Emoji neden bırakılmadı?
//  Her işletim sisteminde FARKLI çiziliyor (Windows'ta düz,
//  Android'de bambaşka), rengi kontrol edilemiyor — koyu temada
//  aynı kalıyor — ve boyutu font metriğine bağlı olduğu için
//  satır hizası ikondan ikona kayıyor.
//
//  Ionicons SVG: rengi ve boyutu prop'tan geliyor, yani tema
//  token'larına bağlanabiliyor.
//
//  ⚠️ FONKSİYON ADI DA DEĞİŞTİ: kategoriEmoji → kategoriIkonu.
//  Artık emoji döndürmüyor; eski ad çağrı yerinde yalan söylerdi.
//  Dosya adı (kategoriIkon.js) zaten baştan doğruydu.
// ============================================================

// ⚠️ ANAHTAR KELİMELER TÜRKÇE KARAKTERSİZ YAZILIR.
//
// ⚠️ BU BİR HATA DÜZELTMESİ (GV/Faz 3).
//
// Liste daha önce Türkçe karakterle yazılıydı ('ayakkabı', 'gıda',
// 'yaşam'). Veritabanındaki kategori adları ise ASCII girilmiş:
// "Ayakkabi". 'ayakkabı'.includes karşılaştırması eşleşmiyordu ve
// o kategori sessizce varsayılan kutu ikonuna düşüyordu. Filtre
// panelinde yan yana yedi kategori karosu çizilince görüldü:
// ikisi kutu ikonluydu.
//
// Çözüm iki taraflı: kelimeler ASCII yazılıyor VE gelen ad da
// ASCII'ye çevriliyor. Böylece "Ayakkabı", "Ayakkabi", "AYAKKABI"
// üçü de aynı ikonu buluyor — admin adı nasıl yazarsa yazsın.
const eslesmeler = [
  { kelimeler: ['elektronik', 'teknoloji', 'bilgisayar'], ikon: 'phone-portrait-outline' },
  { kelimeler: ['ayakkabi', 'bot', 'sneaker'], ikon: 'footsteps-outline' },
  { kelimeler: ['giyim', 'moda', 'tekstil'], ikon: 'shirt-outline' },
  { kelimeler: ['ev', 'yasam', 'mobilya', 'dekorasyon'], ikon: 'home-outline' },
  { kelimeler: ['kitap', 'kirtasiye', 'hobi'], ikon: 'book-outline' },
  { kelimeler: ['spor', 'outdoor', 'fitness'], ikon: 'football-outline' },
  { kelimeler: ['kozmetik', 'bakim', 'guzellik'], ikon: 'color-palette-outline' },
  { kelimeler: ['yemek', 'gida', 'market', 'supermarket', 'yiyecek'], ikon: 'fast-food-outline' },
  { kelimeler: ['oyuncak', 'cocuk', 'bebek'], ikon: 'game-controller-outline' },
  { kelimeler: ['otomobil', 'motosiklet', 'arac'], ikon: 'car-outline' },
  { kelimeler: ['saat', 'aksesuar', 'taki'], ikon: 'watch-outline' },
];

// ⚠️ "Ayakkabı" → "ayakkabi". toLowerCase() TEK BAŞINA YETMEZ:
// Türkçe karakterler küçültülse bile ASCII karşılıklarına dönmez
// ('İ' → 'i̇' gibi tuhaf sonuçlar da üretebiliyor).
// ⚠️ İKİ DİZİ AYNI UZUNLUKTA OLMAK ZORUNDA — 13 karakter.
// İlk yazımda ASCII tarafında 'C' unutulmuştu: 'Ç' sonrası her
// eşleme bir kaydı ve 'I' karşılığı undefined oluyordu. Sonuç
// sessizdi — büyük harfle yazılmış kategori adı ikonunu bulamıyordu.
// Aşağıdaki testle yakalandı.
const TURKCE = 'ıİĞğÜüŞşÖöÇçI';
const ASCII  = 'iiGgUuSsOoCcI';

function sadelestir(metin) {
  let sonuc = '';

  for (const harf of metin) {
    const yer = TURKCE.indexOf(harf);
    sonuc += yer === -1 ? harf : ASCII[yer];
  }

  return sonuc.toLowerCase();
}

export function kategoriIkonu(kategoriAdi) {
  // ⚠️ Ad boş ya da tanımsız gelirse toLowerCase patlardı.
  // Eski hali bu koruma olmadan çalışıyordu; kategori adı zorunlu
  // bir alan olduğu için sorun çıkmamıştı ama tek satırlık savunma
  // ucuz.
  const ad = sadelestir(kategoriAdi ?? '');

  for (const e of eslesmeler) {
    if (e.kelimeler.some((k) => ad.includes(k))) {
      return e.ikon;
    }
  }

  // Varsayılan: eşleşmeyen kategori. "Kutu" hem ürünü hem
  // "sınıflandırılmamış"ı anlatıyor.
  return 'cube-outline';
}
