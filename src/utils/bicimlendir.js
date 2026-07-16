// ============================================
// Ekranda gösterilecek verileri güzelleştiren yardımcılar.
// Admin paneldeki bicimlendir.js ile AYNI mantık —
// böylece mobil ve panel her yerde aynı formatı gösteriyor.
// ============================================

// 2499.9  →  "2.499,90 ₺"
export function paraBicimle(sayi) {
  const deger = Number(sayi) || 0;

  return deger.toLocaleString('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  });
}

// 28  →  "28"     |     1250  →  "1.250"
export function sayiBicimle(sayi) {
  const deger = Number(sayi) || 0;

  return deger.toLocaleString('tr-TR');
}

// "2026-07-13T14:30:00"  →  "13.07.2026 14:30"
export function tarihBicimle(tarihMetni) {
  if (!tarihMetni) {
    return '-';
  }

  const tarih = new Date(tarihMetni);

  return tarih.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}