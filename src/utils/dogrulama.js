// ============================================================
//  FORM DOĞRULAMALARI  ⭐ YENİ (GV/Faz 8)
//
//  ⚠️ BUNLAR GÜVENLİK KATMANI DEĞİL.
//
//  Kullanıcıyı boşa bir ağ turundan kurtaran kolaylık katmanı.
//  Asıl kurallar backend'de: `[EmailAddress]`, `[MinLength(6)]`,
//  benzersiz e-posta indeksi. Biri Postman'den istek atsa buradaki
//  hiçbir kontrol çalışmaz ve sunucu yine reddeder.
//
//  ⚠️ İKİNCİ TÜKETİCİ ÇIKTIĞI İÇİN ORTAK YERE TAŞINDI.
//  Önce yalnızca Giriş ekranındaydı; Kayıt ekranı da aynı kontrolü
//  isteyince buraya alındı. İki kopya kalsaydı biri gevşetilip
//  diğeri unutulduğunda iki ekran aynı adresi farklı yargılardı.
// ============================================================

// ⚠️ Bilerek GEVŞEK: "@ var mı, noktalı bir alan adı var mı".
// Katı bir RFC deseni yazsaydık geçerli ama sıra dışı adresleri
// (uzun TLD'ler, artı işaretli etiketler) reddederdik — kendi
// müşterimizi kapıda çevirmek olurdu. Yanlış adresi zaten
// doğrulama maili yakalıyor.
export function epostaGecerliMi(metin) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((metin || '').trim());
}
