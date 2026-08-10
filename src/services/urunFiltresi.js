// ============================================================
//  ÜRÜN FİLTRESİ — durum şekli, sorgu kurma, aktif sayısı
//
//  ⚠️ NEDEN AYRI DOSYA, NEDEN EKRANIN İÇİNDE DEĞİL?
//
//  Filtreyi İKİ ekran birden kullanıyor: ana sayfa ve kategori
//  ürünleri. Sorgu metnini iki yerde kursaydık, yarın backend'e
//  yeni bir parametre eklendiğinde birini güncelleyip diğerini
//  unutmak işten değildi — ve sonuç, aynı filtrenin iki ekranda
//  farklı sonuç vermesi olurdu.
//
//  ⚠️ BURADA HİÇ GÖRSEL KOD YOK — bilerek. Bu dosya "filtre nedir"
//  sorusunu cevaplıyor, "nasıl görünür" sorusunu değil. Panel
//  değişse bile burası aynı kalır.
//
//  ⚠️ HESAP YOK. Kaç ürün çıkacağını SUNUCU söylüyor
//  (GET /products/sayi). Burada ürünleri sayan bir kod olsaydı
//  aynı sorunun iki cevabı olurdu ve panelde yazan sayı ile
//  listenin çelişmesi, sayının hiç olmamasından kötü olurdu.
// ============================================================

// ---------- BOŞ FİLTRE ----------
//
// ⚠️ Fonksiyon, sabit nesne DEĞİL. Sabit bir nesne export etseydik
// "Temizle"ye basan ekran onu state'e koyar, sonra kategori
// seçtiğinde (yanlışlıkla mutasyonla) PAYLAŞILAN nesneyi bozardı.
// Her çağrıda taze kopya dönüyor.
export function bosFiltre() {
  return {
    kategoriler: [],      // int[] — çoklu seçim
    minFiyat: null,       // null = alt sınır serbest
    maxFiyat: null,       // null = üst sınır serbest
    minPuan: null,        // 3 | 4 | 5
    sadeceStokta: false,
  };
}

// ---------- SIRALAMA SEÇENEKLERİ ----------
//
// ⚠️ Değerler backend'deki beyaz listeyle BİREBİR aynı olmalı
// (ProductsController.GecerliSiralamalar). Uymayan bir değer hata
// vermez, sunucu sessizce varsayılana düşer — yani yazım hatası
// ekranda "sıralama çalışmıyor" diye görünür, hata olarak değil.
//
// ⚠️ SIRALAMA BİR FİLTRE DEĞİL. Filtre listeyi daraltır, sıralama
// sadece sırasını değiştirir; hiçbir ürünü elemez. Bu yüzden
// aktif filtre sayacına girmiyor ve panelin içinde durmuyor.
export const siralamaSecenekleri = [
  { deger: 'yeni', etiket: 'En yeni' },
  { deger: 'populer', etiket: 'Çok satan' },
  { deger: 'fiyat_artan', etiket: 'Fiyat ↑' },
  { deger: 'fiyat_azalan', etiket: 'Fiyat ↓' },
  { deger: 'puan', etiket: 'Puan' },
];

export const varsayilanSiralama = 'yeni';

// ---------- PUAN EŞİKLERİ ----------
//
// 1 ve 2 yıldız bilerek yok: "en az 1 yıldız" pratikte puanı olan
// her ürün demek, kullanıcıya bir şey sormuyor. Eşik ancak
// ayırt ediyorsa seçenek olmayı hak eder.
export const puanEsikleri = [3, 4, 5];

// ---------- AKTİF FİLTRE SAYISI ----------
//
// Arama çubuğundaki rozette görünen sayı. "Kaç kutucuk işaretli"
// değil, "kaç BOYUT daraltılmış" sayıyor: üç kategori seçmek tek
// bir daraltmadır, rozette 3 yazmak müşteriyi yanıltırdı.
//
// ⚠️ Fiyat tek sayılıyor (min ve max ayrı ayrı değil) — ikisi
// tek bir kaydırıcının iki ucu, kullanıcı için tek bir karar.
export function aktifFiltreSayisi(filtre) {
  let sayi = 0;

  if (filtre.kategoriler.length > 0) sayi++;
  if (filtre.minFiyat !== null || filtre.maxFiyat !== null) sayi++;
  if (filtre.minPuan !== null) sayi++;
  if (filtre.sadeceStokta) sayi++;

  return sayi;
}

// ---------- SORGU METNİNİ KUR ----------
//
// filtre   : bosFiltre() şeklinde bir nesne
// ekstra   : { kategoriId, arama, siralama } — filtreye ait olmayan,
//            ekranın kendi bağlamından gelen parametreler
//
// ⚠️ "kategoriId" ile "kategoriler" AYNI ANDA gönderilebilir;
// sunucu kategoriler doluysa onu tercih ediyor. Burada eleme
// yapmıyoruz çünkü kural sunucunun kuralı — iki yerde birden
// tanımlamak, birini değiştirince diğerinin sessizce çelişmesi
// demek olurdu.
//
// ⚠️ Boş/varsayılan değerler URL'e HİÇ yazılmıyor. "&minPuan="
// göndermek sunucuda ayrıştırma hatasına açık kapı bırakır ve
// ağ günlüğünü okunmaz hale getirir.
export function filtreSorgusuKur(filtre, ekstra = {}) {
  const parcalar = [];

  if (ekstra.kategoriId) {
    parcalar.push('categoryId=' + ekstra.kategoriId);
  }

  if (ekstra.arama) {
    parcalar.push('search=' + encodeURIComponent(ekstra.arama));
  }

  if (ekstra.siralama && ekstra.siralama !== varsayilanSiralama) {
    parcalar.push('siralama=' + encodeURIComponent(ekstra.siralama));
  }

  if (filtre.kategoriler.length > 0) {
    parcalar.push('kategoriler=' + filtre.kategoriler.join(','));
  }

  if (filtre.minFiyat !== null) {
    parcalar.push('minFiyat=' + filtre.minFiyat);
  }

  if (filtre.maxFiyat !== null) {
    parcalar.push('maxFiyat=' + filtre.maxFiyat);
  }

  if (filtre.minPuan !== null) {
    parcalar.push('minPuan=' + filtre.minPuan);
  }

  if (filtre.sadeceStokta) {
    parcalar.push('sadeceStokta=true');
  }

  return parcalar.length > 0 ? '?' + parcalar.join('&') : '';
}

// ---------- SINIRDAKİ DEĞERİ null'A ÇEVİR ----------
//
// Kaydırıcı her zaman bir sayı tutar; uçlarda duruyorsa bu
// "filtre yok" demektir.
//
// ⚠️ Bu dönüşüm olmasaydı kaydırıcıya hiç dokunmamış bir müşteride
// bile rozette "1" yazardı ve sorguya gereksiz minFiyat/maxFiyat
// eklenirdi. Kullanıcının yapmadığı bir seçimi yapmış gibi
// göstermek, sayacı güvenilmez kılar.
export function sinirdakiniBosalt(deger, sinir) {
  return deger === sinir ? null : deger;
}
