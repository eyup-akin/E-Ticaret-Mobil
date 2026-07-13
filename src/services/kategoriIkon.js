// Kategori adına göre emoji seçer. Eşleşme yoksa varsayılan kutu emojisi.
const eslesmeler = [
  { kelimeler: ['elektronik', 'teknoloji', 'bilgisayar'], emoji: '📱' },
  { kelimeler: ['giyim', 'moda', 'tekstil', 'ayakkabı'], emoji: '👕' },
  { kelimeler: ['ev', 'yaşam', 'mobilya', 'dekorasyon'], emoji: '🏠' },
  { kelimeler: ['kitap', 'kırtasiye', 'hobi'], emoji: '📚' },
  { kelimeler: ['spor', 'outdoor', 'fitness'], emoji: '⚽' },
  { kelimeler: ['kozmetik', 'bakım', 'güzellik'], emoji: '💄' },
  { kelimeler: ['market', 'gıda', 'süpermarket'], emoji: '🛒' },
  { kelimeler: ['oyuncak', 'çocuk', 'bebek'], emoji: '🧸' },
  { kelimeler: ['otomobil', 'motosiklet', 'araç'], emoji: '🚗' },
  { kelimeler: ['saat', 'aksesuar', 'takı'], emoji: '⌚' },
];

export function kategoriEmoji(kategoriAdi) {
  const ad = kategoriAdi.toLowerCase();

  for (const e of eslesmeler) {
    if (e.kelimeler.some((k) => ad.includes(k))) {
      return e.emoji;
    }
  }

  return '📦'; // varsayılan
}