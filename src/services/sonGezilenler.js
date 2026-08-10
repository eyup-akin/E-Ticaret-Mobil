import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
//  SON GEZİLEN ÜRÜNLER — cihazda saklanır
//
//  ⚠️ SUNUCUYA YAZILMIYOR — bilinçli karar (yol haritası 7.2).
//
//  "Hangi ürünlere baktım" bir davranış izi. Sunucuya yazsaydık:
//    • Her ürün detayı açılışında bir yazma isteği daha giderdi
//    • Misafir kullanıcının kaydı tutulamazdı (UserId yok) ve
//      bölüm giriş yapmayanlarda hiç çalışmazdı
//    • KVKK tarafında "bu kullanıcı şunlara baktı" diye
//      saklanan yeni bir kişisel veri doğardı — Aşama 10'un işini
//      sebepsiz büyütürdü
//
//  Cihazda tutunca üçü de olmuyor: istek yok, misafirde de
//  çalışıyor, sunucuda kişisel veri birikmiyor.
//
//  ⚠️ NEDEN guvenliDepo DEĞİL?
//
//  guvenliDepo, SecureStore'u sarmalıyor: işletim sisteminin
//  ŞİFRELİ KASASI. Orası token'ların yeri. Gezme geçmişi bir sır
//  değil; kasaya yazmak hem anlamsız hem yavaş (her erişimde
//  Keychain/Keystore çağrısı) hem de SecureStore'un 2 KB değer
//  sınırına gereksiz yaklaşmak olurdu.
//
//  AsyncStorage tam olarak bunun için var: şifresiz, hızlı,
//  sınırsıza yakın yerel anahtar-değer deposu.
// ============================================================

const ANAHTAR = 'sonGezilenUrunler';

// ⚠️ Neden 12? Şeritte aynı anda ~2,5 kart görünüyor; 12 kayıt
// birkaç ekran kaydırmaya yetiyor. Sınırsız bıraksaydık liste
// aylar içinde yüzlerce id'ye çıkar, her açılışta hepsi
// ayrıştırılır ve ürünleri getiren istek şişerdi.
const SINIR = 12;

// ---- OKU ----
//
// Her zaman bir dizi döndürür. Bozuk/eksik veri sessizce boş
// diziye düşüyor: gezme geçmişi uğruna ana sayfayı çökertmek
// kabul edilebilir değil.
export async function sonGezilenleriOku() {
  try {
    const ham = await AsyncStorage.getItem(ANAHTAR);
    if (!ham) return [];

    const veri = JSON.parse(ham);
    return Array.isArray(veri) ? veri.filter((x) => Number.isInteger(x)) : [];
  } catch {
    return [];
  }
}

// ---- EKLE ----
//
// urunId : yeni gezilen ürünün id'si
//
// ⚠️ ÖNCE SİL, SONRA BAŞA EKLE.
// Aynı ürüne ikinci kez bakan müşteride ürün listede iki kez
// görünmemeli; ayrıca en son bakılan HER ZAMAN başta olmalı.
// Sadece "varsa ekleme" deseydik, ürün eski sırasında kalır ve
// "son gezilen" iddiası yanlış olurdu.
export async function sonGezileneEkle(urunId) {
  if (!Number.isInteger(urunId)) return;

  try {
    const mevcut = await sonGezilenleriOku();
    const yeni = [urunId, ...mevcut.filter((x) => x !== urunId)].slice(0, SINIR);

    await AsyncStorage.setItem(ANAHTAR, JSON.stringify(yeni));
  } catch {
    // ⚠️ Yazma hatası YUTULUYOR. Depo dolu ya da erişilemez ise
    // müşteriye gösterilecek bir şey yok — bu bir arka plan
    // kolaylığı, bir işlem değil.
  }
}

// ---- TEMİZLE ----
// Hesap kapatma ve çıkış akışlarında kullanılabilir.
export async function sonGezilenleriTemizle() {
  try {
    await AsyncStorage.removeItem(ANAHTAR);
  } catch {
    // yut
  }
}
