// ============================================================
//  ÖLÇÜ TOKEN'LARI — boşluk, köşe, punto
//
//  ⚠️ NEDEN tema.js'TE DEĞİL, AYRI DOSYADA?
//
//  Bu değerler açık ve koyu temada AYNI. tema.js'e koysaydık iki
//  nesnede birden tanımlamak gerekirdi; biri güncellenip diğeri
//  unutulduğunda tema değiştirince yerleşim kayardı.
//
//  Kural: bir değer temaya göre değişmiyorsa temada durmaz.
//
//  ⚠️ NEDEN useTema() İLE GELMİYOR, DOĞRUDAN import EDİLİYOR?
//  Ölçüler bir bağlama (context) ihtiyaç duymuyor — sabitler.
//  Context'e koysaydık her bileşen tema değiştiğinde yeniden
//  render olurken bu değerleri de boşuna taşırdı.
//
//  KULLANIM:
//      import { bosluk, kose, yazi } from '../theme/olculer';
//      ...
//      padding: bosluk.orta,
//      borderRadius: kose.buyuk,
//      fontSize: yazi.normal,
//
//  ⚠️ Değerler BİRİMSİZ sayı — React Native'de ölçüler sayıdır.
//  Web'deki gibi '16px' yazsaydık RN bunu string olarak alır ve
//  bazı özelliklerde sessizce yok sayardı.
//
//  ⚠️ Admin paneldeki index.css :root bloğuyla AYNI SAYILAR.
//  İki arayüz aynı tasarım dilini konuşuyor; birinde 16 diğerinde
//  14 kullanırsak "aynı ürün" hissi kaybolur.
// ============================================================

// ---------- BOŞLUK ----------
//
// 4'ün katları. Ara değer yok: 10 veya 18 gerekiyorsa genelde
// yanlış olan ölçek değil, yerleşimdir.
export const bosluk = {
  mikro: 4,
  kucuk: 8,
  orta: 12,
  normal: 16,
  genis: 24,
  dev: 32,
};

// ---------- KÖŞE YARIÇAPI ----------
//
// Referans tasarımlardaki kartlar belirgin şekilde yuvarlak
// (16-20). Mevcut ekranlarda 8-12 kullanılıyordu ve bu, arayüzü
// "premium" değil "varsayılan" gösteren en büyük tek etkendi.
//
// tam: hap şeklindeki rozet ve chip'ler için. 999, yükseklik ne
// olursa olsun tam yuvarlak uç verir.
export const kose = {
  kucuk: 8,
  orta: 12,
  buyuk: 16,
  dev: 20,
  tam: 999,
};

// ---------- PUNTO ----------
//
// Yedi basamak. Aradaki değerler (17, 19 gibi) bilerek yok:
// gözle ayırt edilemeyen fark, kod tabanında gürültüden başka
// bir şey üretmiyor.
export const yazi = {
  mikro: 11,
  kucuk: 12,
  normal: 14,
  orta: 15,
  buyuk: 18,
  baslik: 22,
  dev: 30,
};

// ---------- YAZI AĞIRLIĞI ----------
//
// ⚠️ Metin olarak yazılıyor ('600'), sayı olarak değil.
// React Native fontWeight'i string bekler; 600 yazarsak Android'de
// sessizce yok sayılır ve yazı normal ağırlıkta kalır.
//
// 'bold' yerine '700' kullanıyoruz: 'bold' platformlar arasında
// farklı ağırlıklara eşleniyor, sayısal değer öngörülebilir.
export const agirlik = {
  normal: '400',
  orta: '500',
  yari: '600',
  kalin: '700',
};

// ---------- YAZI TİPİ AİLESİ ----------  ⭐ YENİ (GV/Faz 1)
//
// ⚠️⚠️ REACT NATIVE'İN EN SİNSİ TUZAĞI BURADA.
//
// ÖZEL BİR FONT YÜKLENDİĞİNDE `fontWeight` ARTIK ÇALIŞMAZ.
//
// Sistem fontunda `fontWeight: '700'` yazmak yeterliydi — platform
// ailenin kalın kesimini kendisi buluyordu. Özel fontta öyle
// olmuyor: her ağırlık AYRI BİR AİLE olarak yükleniyor
// ('PlusJakartaSans_400Regular', '..._700Bold' gibi). Sadece
// fontWeight verirsen Android o satırı sessizce yok sayar ve yazı
// NORMAL ağırlıkta kalır. Hata yok, uyarı yok — sadece kalın
// olması gereken başlık ince çıkar.
//
// Bu projede en çok kaçındığımız hata türü: patlamayan hata.
//
// ⚠️ KURAL: fontWeight yazdığın HER YERE fontFamily de yaz.
//
//     fontSize: yazi.buyuk,
//     fontWeight: agirlik.kalin,      // iOS ve sistem fontu için
//     fontFamily: font.kalin,         // Android ve özel font için
//
// İkisi birlikte veriliyor çünkü ikisi de gerekli: font henüz
// yüklenmemişken (açılışın ilk anı) ya da yükleme başarısızsa
// fontWeight devreye giriyor ve yazı yine de kalın çıkıyor.
// Yalnızca fontFamily verseydik o durumda hiyerarşi tamamen
// kaybolurdu.
//
// ⚠️ Bu isimler @expo-google-fonts/plus-jakarta-sans paketinin
// export ettiği adların BİREBİR aynısı. Bir harf sapması sessiz
// bir geri düşüşe yol açar — App.js'te yüklenen anahtarla aynı
// olmak zorunda.
export const font = {
  normal: 'PlusJakartaSans_400Regular',
  orta: 'PlusJakartaSans_500Medium',
  yari: 'PlusJakartaSans_600SemiBold',
  kalin: 'PlusJakartaSans_700Bold',
};

// ---------- SATIR YÜKSEKLİĞİ ----------
//
// ⚠️ React Native'de lineHeight MUTLAK bir sayıdır, çarpan değil.
// Web'deki gibi 1.5 yazsaydık satır yüksekliği 1.5 piksel olurdu
// ve metin üst üste binerdi.
//
// Bu yüzden puntoya göre hazır değerler veriyoruz. Çarpanlar:
// sık ~1.3, normal ~1.45, geniş ~1.7.
export const satir = {
  kucuk: 16,   // yazi.kucuk (12) için
  normal: 20,  // yazi.normal (14) için
  orta: 22,    // yazi.orta (15) için
  buyuk: 26,   // yazi.buyuk (18) için
  baslik: 30,  // yazi.baslik (22) için
};
