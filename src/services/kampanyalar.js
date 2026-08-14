import { apiGet } from './api';
import { SUNUCU_URL } from './config';

// ============================================================
//  KAMPANYALAR — ana sayfadaki banner şeridi ve detay ekranı
//
//  ⭐⭐ DEĞİŞTİ (B2) — VERİ ARTIK SUNUCUDAN.
//
//  Bu dosya kampanyaları sabit bir dizide tutuyordu: görsel
//  değiştirmek APK almayı gerektiriyordu. Artık tablo, admin
//  ekranı ve görsel yükleme var; afişleri panelden yönetiliyor.
//
//  ⚠️ NEDEN "kampanyalar" ADI, "bannerlar" DEĞİL?
//
//  Banner bir GÖRSEL; kampanya ise arkasındaki iş. Detay ekranı
//  açıldığında müşteri banner'ı değil kampanyayı okuyor: koşullar,
//  tarih, kupon kodları.
//
//  ⚠️ KUPON KODLARI HÂLÂ GERÇEK. Sunucu kaydederken kodların
//  Coupons tablosunda var olduğunu doğruluyor; uydurma kod
//  kaydedilemiyor. Kampanya metni serbest ama İNDİRİM UYDURULMAZ.
// ============================================================

// Sunucunun cevabını ekranların beklediği şekle çevirir.
//
// ⚠️ `gorsel` adı KORUNDU. Eskiden require(...) ile gelen bir modül,
// şimdi { uri } nesnesi — ikisi de <Image source> olarak geçerli.
// Alanı `gorselUrl` diye açsaydık şerit ve detay ekranının ikisine
// de dokunmak gerekirdi; oysa ikisinin de bu değişiklikten haberi
// olmamalı.
function cevir(k) {
  return {
    id: k.id,
    gorsel: { uri: SUNUCU_URL + k.gorselUrl },
    baslik: k.baslik,
    kisaAciklama: k.kisaAciklama,
    bitisMetni: k.bitisMetni,
    aciklama: k.aciklama,
    kuponKodlari: k.kuponKodlari ?? [],
    kosullar: k.kosullar ?? [],
  };
}

// ⚠️ HATA YUTULUYOR ve BOŞ LİSTE DÖNÜYOR — bilerek.
//
// Şerit ana sayfanın süsü; listesi boş gelince bölüm hiç
// çizilmiyor. Hatayı yukarı fırlatsaydık ya ana sayfa bir kampanya
// isteği yüzünden hata ekranına düşerdi ya da her çağıran yerde
// try/catch yazmak gerekirdi.
export async function kampanyalariGetir() {
  try {
    const veri = await apiGet('/kampanyalar');
    return veri.map(cevir);
  } catch {
    return [];
  }
}

// ⚠️ BURADA HATA YUTULMUYOR — şeritten farklı olarak.
//
// Müşteri afişe basıp bu ekranı AÇTI: bir şey beklemiyor.
// Sessizce "kampanya bulunamadı" demek, silinmiş bir kampanyayla
// kopuk bir bağlantıyı aynı şeymiş gibi gösterirdi; ikisinin
// cevabı farklı ("bu kampanya kalktı" / "tekrar dene").
export async function kampanyaGetir(id) {
  return cevir(await apiGet('/kampanyalar/' + id));
}
