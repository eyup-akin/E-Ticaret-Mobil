// ============================================================
//  BANNER'LAR — ana sayfadaki kaydırmalı kampanya şeridi
//
//  ⚠️⚠️ BU VERİ GEÇİCİ VE YERELDİR.
//
//  Bizde banner diye bir kavram YOK: ne tablo, ne uç, ne admin
//  ekranı, ne görsel yükleme. Yol haritasında **B2** olarak onay
//  bekliyor ve onaylanırsa ayrı bir iş olarak yapılacak.
//
//  O gelene kadar şerit bu dosyadaki sabit listeyi çiziyor.
//  Görseller Stitch'in ürettiği kampanya çekimleri
//  (referans resimler/stitch_.../premium_editorial_...).
//
//  ⚠️ NEDEN SAHTE VERİ BU DURUMDA SORUN DEĞİL?
//
//  Bu projede "yanlış sayı, eksik sayıdan tehlikelidir" kuralı
//  var ve uydurma veriden kaçınıyoruz. Ama o kural BİR ŞEY İDDİA
//  EDEN veriler için: fiyat, stok, puan, kâr. Banner bir iddia
//  değil, bir vitrin görseli — üstünde "%50 indirim" gibi bir
//  sayı YAZMIYOR (bilerek). Yanlış yönlendirebileceği tek şey
//  yok.
//
//  ⚠️ ÜSTLERİNE İNDİRİM ORANI / FİYAT YAZILMAYACAK. Yazsaydık
//  müşteriye tutmayacağımız bir söz vermiş olurduk.
//
//  ---- B2 GELDİĞİNDE NE DEĞİŞECEK ----
//  Yalnızca bu dosya: `bannerlariGetir()` bir apiGet çağrısına
//  dönüşecek. Şerit bileşeni ve ana sayfa değişmeyecek — o yüzden
//  liste doğrudan export edilmiyor, bir FONKSİYONUN arkasında
//  duruyor.
// ============================================================

const yerelBannerlar = [
  {
    id: 1,
    gorsel: require('../../assets/bannerlar/spor.png'),
    // Basınca nereye gidilecek. Şimdilik kategori filtresine.
    kategoriAdi: 'Spor & Outdoor',
  },
  {
    id: 2,
    gorsel: require('../../assets/bannerlar/elektronik.png'),
    kategoriAdi: 'Elektronik',
  },
];

// ⚠️ async — bugün beklemeye gerek yok ama B2 geldiğinde ağdan
// gelecek. Şimdiden async yazmak, o gün çağrı yerlerinin
// değişmemesini sağlıyor.
export async function bannerlariGetir() {
  return yerelBannerlar;
}
