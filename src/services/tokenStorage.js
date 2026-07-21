import * as SecureStore from 'expo-secure-store';

// Kasadaki "anahtar" isimleri (etiket gibi düşün)
const TOKEN_KEY = 'userToken';
const KULLANICI_KEY = 'kullaniciBilgi';
const REFRESH_KEY = 'refreshToken'; // ⭐ YENİ

// --- TOKEN ---
export async function tokenKaydet(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function tokenAl() {
  return await SecureStore.getItemAsync(TOKEN_KEY); // token yoksa null döner
}
export async function tokenSil() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}


// --- REFRESH TOKEN --- ⭐ YENİ
// Uzun ömürlü (30 gün) "yeni access ver" bileti. O da SecureStore'da (şifreli kasa).
export async function refreshTokenKaydet(token) {
  await SecureStore.setItemAsync(REFRESH_KEY, token);
}
export async function refreshTokenAl() {
  return await SecureStore.getItemAsync(REFRESH_KEY);
}
export async function refreshTokenSil() {
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// --- KULLANICI (ad soyad + rol) ---
// SecureStore sadece metin saklar, o yüzden objeyi JSON metnine çeviriyoruz
export async function kullaniciKaydet(kullanici) {
  await SecureStore.setItemAsync(KULLANICI_KEY, JSON.stringify(kullanici));
}
export async function kullaniciAl() {
  const metin = await SecureStore.getItemAsync(KULLANICI_KEY);
  return metin ? JSON.parse(metin) : null;
}
export async function kullaniciSil() {
  await SecureStore.deleteItemAsync(KULLANICI_KEY);
}