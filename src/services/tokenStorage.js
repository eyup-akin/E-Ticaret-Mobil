// ⭐ DEĞİŞTİ — doğrudan SecureStore yerine guvenliDepo.
//
// SecureStore web'i desteklemiyor ve web'de çağrıldığında hata
// fırlatıyordu. guvenliDepo platforma göre doğru olanı seçiyor:
// native'de SecureStore (şifreli kasa), web'de localStorage
// (yalnızca geliştirme önizlemesi için — gerekçesi o dosyada).
//
// Bu dosyanın API'si HİÇ DEĞİŞMEDİ; çağıran hiçbir yer
// güncellenmek zorunda kalmadı.
import { deoyaYaz, depodanOku, depodanSil } from './guvenliDepo';

// Kasadaki "anahtar" isimleri (etiket gibi düşün)
const TOKEN_KEY = 'userToken';
const KULLANICI_KEY = 'kullaniciBilgi';
const REFRESH_KEY = 'refreshToken';

// --- TOKEN ---
export async function tokenKaydet(token) {
  await deoyaYaz(TOKEN_KEY, token);
}
export async function tokenAl() {
  return await depodanOku(TOKEN_KEY); // token yoksa null döner
}
export async function tokenSil() {
  await depodanSil(TOKEN_KEY);
}


// --- REFRESH TOKEN ---
// Uzun ömürlü (30 gün) "yeni access ver" bileti.
export async function refreshTokenKaydet(token) {
  await deoyaYaz(REFRESH_KEY, token);
}
export async function refreshTokenAl() {
  return await depodanOku(REFRESH_KEY);
}
export async function refreshTokenSil() {
  await depodanSil(REFRESH_KEY);
}

// --- KULLANICI (ad soyad + rol) ---
// Depo sadece metin saklar, o yüzden objeyi JSON metnine çeviriyoruz
export async function kullaniciKaydet(kullanici) {
  await deoyaYaz(KULLANICI_KEY, JSON.stringify(kullanici));
}
export async function kullaniciAl() {
  const metin = await depodanOku(KULLANICI_KEY);
  return metin ? JSON.parse(metin) : null;
}
export async function kullaniciSil() {
  await depodanSil(KULLANICI_KEY);
}
