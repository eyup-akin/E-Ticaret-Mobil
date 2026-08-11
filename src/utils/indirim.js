// ============================================================
//  İNDİRİM GÖSTERİMİ (B1) — kural tek yerde
//
//  Sunucu yalnızca iki sayı gönderiyor: price ve eskiFiyat.
//  "İndirim var mı" ve "yüzde kaç" soruları istemcide cevaplanıyor.
//
//  ⚠️ YÜZDE NEDEN SUNUCUDAN GELMİYOR?
//  ProductDto'da yazılı: aynı gerçek iki alanda yaşasaydı, fiyat
//  değişip yüzde bayatladığında ekranda çelişki çıkardı. Tek
//  satırlık bir bölme için ağa fazladan alan koymanın anlamı yok.
//
//  ⚠️ NEDEN AYRI DOSYA, NEDEN HER EKRANDA İKİ SATIR DEĞİL?
//  Üç tüketici var: UrunKarti (ızgara), UrunKartiKompakt (son
//  gezilenler şeridi) ve UrunDetayEkrani. Üçüne ayrı ayrı
//  yazsaydık, yuvarlama yönünü bir gün değiştirdiğimizde ürün
//  kartında "-%16", detayda "-%17" yazabilirdi — aynı ürün için
//  iki farklı indirim iddiası. "İkinci tüketici çıktığı an ortak
//  yere taşınır" kuralı.
// ============================================================

/**
 * urun → { indirimliMi, eskiFiyat, yuzde }
 *
 * yuzde = 0 ise rozet çizilmez (aşağıda gerekçesi).
 */
export function indirimBilgisi(urun) {
  const fiyat = Number(urun?.price) || 0;

  // ⚠️ null ile 0 farkı burada kritik.
  // Backend "indirim yok" durumunu null ile anlatıyor; 0 yazsaydı
  // her ürün "%100 indirimli" görünürdü. Number(null) = 0 olduğu
  // için dönüşümden ÖNCE varlığı kontrol ediyoruz.
  const ham = urun?.eskiFiyat;
  const eskiFiyat = ham === null || ham === undefined ? null : Number(ham);

  // ⚠️ "eskiFiyat > fiyat" ŞARTI SAVUNMA AMAÇLI.
  //
  // Alanı admin elle giriyor ve sunucuda "eski fiyat güncelden
  // büyük olmalı" diye bir kilit yok. Yanlışlıkla düşük bir sayı
  // girilirse üstü çizili fiyat GÜNCEL fiyattan ucuz görünür ve
  // rozet "-%-12" gibi anlamsız bir şey yazardı. Böyle bir veride
  // hiçbir şey göstermemek, saçma bir şey göstermekten iyidir.
  const indirimliMi = eskiFiyat !== null && eskiFiyat > fiyat && fiyat > 0;

  if (!indirimliMi) {
    return { indirimliMi: false, eskiFiyat: null, yuzde: 0 };
  }

  // ⚠️ AŞAĞI YUVARLANIYOR (floor), en yakına DEĞİL.
  //
  // 15,6'lık bir indirimi "%16" diye yazmak, olmayan bir indirimi
  // iddia etmek olur. İndirim oranı reklamdır ve reklamda abartma
  // yasal risk taşır (Fiyat Etiketi Yönetmeliği). Aşağı yuvarlamak
  // en fazla müşteri lehine küçük bir eksiklik üretir.
  const yuzde = Math.floor(((eskiFiyat - fiyat) / eskiFiyat) * 100);

  // ⚠️ %1'İN ALTINDA ROZET YOK.
  // 1.000,00 → 999,50 gerçek bir indirim ama "-%0" yazan bir rozet
  // bilgi değil gürültü. Üstü çizili fiyat yine gösteriliyor —
  // müşteri farkı iki sayıdan zaten görüyor.
  return { indirimliMi: true, eskiFiyat, yuzde: yuzde >= 1 ? yuzde : 0 };
}

/**
 * 16 → "-%16"
 *
 * ⚠️ SİMGE ÖNDE, SAYI ARKADA — tasarımdaki "-18%" DEĞİL.
 * Türkçe yazımda yüzde işareti sayıdan önce gelir (%18). Aynı
 * kararı para biriminde de verdik ama ters yönde: orada simge
 * sonda (89 ₺). İkisi de Türkçe yazım kuralı, ikisi de tasarımın
 * İngilizce alışkanlığından farklı.
 */
export function yuzdeYazisi(yuzde) {
  return `-%${yuzde}`;
}
