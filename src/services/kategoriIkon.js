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

const eslesmeler = [
  { kelimeler: ['elektronik', 'teknoloji', 'bilgisayar'], ikon: 'phone-portrait-outline' },
  { kelimeler: ['giyim', 'moda', 'tekstil', 'ayakkabı'], ikon: 'shirt-outline' },
  { kelimeler: ['ev', 'yaşam', 'mobilya', 'dekorasyon'], ikon: 'home-outline' },
  { kelimeler: ['kitap', 'kırtasiye', 'hobi'], ikon: 'book-outline' },
  { kelimeler: ['spor', 'outdoor', 'fitness'], ikon: 'football-outline' },
  { kelimeler: ['kozmetik', 'bakım', 'güzellik'], ikon: 'color-palette-outline' },
  { kelimeler: ['market', 'gıda', 'süpermarket'], ikon: 'cart-outline' },
  { kelimeler: ['oyuncak', 'çocuk', 'bebek'], ikon: 'game-controller-outline' },
  { kelimeler: ['otomobil', 'motosiklet', 'araç'], ikon: 'car-outline' },
  { kelimeler: ['saat', 'aksesuar', 'takı'], ikon: 'watch-outline' },
];

export function kategoriIkonu(kategoriAdi) {
  // ⚠️ Ad boş ya da tanımsız gelirse toLowerCase patlardı.
  // Eski hali bu koruma olmadan çalışıyordu; kategori adı zorunlu
  // bir alan olduğu için sorun çıkmamıştı ama tek satırlık savunma
  // ucuz.
  const ad = (kategoriAdi ?? '').toLowerCase();

  for (const e of eslesmeler) {
    if (e.kelimeler.some((k) => ad.includes(k))) {
      return e.ikon;
    }
  }

  // Varsayılan: eşleşmeyen kategori. "Kutu" hem ürünü hem
  // "sınıflandırılmamış"ı anlatıyor.
  return 'cube-outline';
}
