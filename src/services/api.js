import { API_URL } from './config';
import {
  tokenAl, tokenKaydet, tokenSil,
  refreshTokenAl, refreshTokenKaydet, refreshTokenSil,
  kullaniciSil,
} from './tokenStorage';

// AuthContext açılışta buraya çıkış fonksiyonunu kaydeder; oturum düşünce çağırırız.
let oturumBittiBildir = null;
export function oturumBittiKaydet(fonksiyon) {
  oturumBittiBildir = fonksiyon;
}

// ⭐ TEK REFRESH KİLİDİ
// Aynı anda birçok istek 401 yerse HEPSİ ayrı ayrı refresh denemesin diye
// tek bir yenileme işlemi tutuyoruz; diğerleri onu bekler.
//
// NEDEN ŞART? Refresh "rotating" — ilk yenileme eski token'ı iptal eder.
// İkinci istek o iptalli token'la /refresh'e giderse sunucu "hırsızlık" sanıp
// TÜM oturumu uçurur. Tek işlem paylaşınca bu çakışma hiç yaşanmaz.
let yenilemeIslemi = null;

// Refresh token ile taze access + taze refresh alır, kasaya yazar.
// true = yenilendi, false = yenilenemedi (refresh yok/geçersiz/ağ hatası).
async function tokenYenile() {
  const refresh = await refreshTokenAl();
  if (!refresh) return false;

  let cevap;
  try {
    cevap = await fetch(API_URL + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
  } catch {
    return false; // ağ hatası
  }

  if (!cevap.ok) return false; // refresh geçersiz/süresi dolmuş

  const veri = await cevap.json();
  await tokenKaydet(veri.token);
  await refreshTokenKaydet(veri.refreshToken); // rotation: yenisini sakla
  return true;
}

// Oturumu tamamen kapatır: kasayı boşalt + AuthContext'e haber ver.
async function oturumuKapat() {
  await tokenSil();
  await refreshTokenSil();
  await kullaniciSil();
  if (oturumBittiBildir) oturumBittiBildir();
}

// Bütün istekler buradan geçer. Token'ı ekler, 401'de sessiz yenileme yapar.
// yenidenDenendi: bu istek yenilemeden sonra bir kez tekrarlandı mı (sonsuz döngü kalkanı).
export async function apiIstek(yol, secenekler = {}, yenidenDenendi = false) {
  const token = await tokenAl();

  const headers = {
    'Content-Type': 'application/json',
    ...(secenekler.headers || {}),
  };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let cevap;
  try {
    cevap = await fetch(API_URL + yol, { ...secenekler, headers });
  } catch {
    throw new Error('Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.');
  }

  // login/register/refresh gibi /auth/ istekleri "oturum düştü" mantığından muaf:
  // oradaki 401 "şifre yanlış" demek, "access bayat" değil.
  const authIstegi = yol.startsWith('/auth/');

  // ---------- ACCESS BAYATLADI → SESSİZCE YENİLE ----------
  if (cevap.status === 401 && !authIstegi && !yenidenDenendi) {
    // Yenileme sürüyorsa ona katıl; yoksa başlat. (finally: bitince kilidi bırak)
    if (!yenilemeIslemi) {
      yenilemeIslemi = tokenYenile().finally(() => { yenilemeIslemi = null; });
    }
    const basarili = await yenilemeIslemi;

    if (basarili) {
      // Taze access ile isteği AYNEN bir kez tekrarla (yenidenDenendi=true).
      return apiIstek(yol, secenekler, true);
    }

    // Yenileyemedik → oturumu kapat.
    await oturumuKapat();
    throw new Error('Oturumun sona erdi. Lütfen tekrar giriş yap.');
  }

  const metin = await cevap.text();
  let veri = null;
  if (metin) {
    try { veri = JSON.parse(metin); } catch { veri = metin; }
  }

  // Yenilemeden SONRA hâlâ 401 ise (yenidenDenendi=true durumu) → çıkış.
  if (cevap.status === 401 && !authIstegi) {
    await oturumuKapat();
    throw new Error('Oturumun sona erdi. Lütfen tekrar giriş yap.');
  }

  if (!cevap.ok) {
    const hataMesaji = veri && veri.mesaj ? veri.mesaj : 'Bir hata oluştu';

    // ⭐ Backend "kod" gönderdiyse hata nesnesine iliştir.
    // JS'te Error bir nesnedir; üstüne kendi alanlarını ekleyebilirsin.
    // Böylece ekranlar metne bakmadan durumu ayırt edebilir:
    //    catch (hata) { if (hata.kod === 'EMAIL_DOGRULANMADI') ... }
    const hata = new Error(hataMesaji);
    hata.kod = veri && veri.kod ? veri.kod : null;

    throw hata;
  }

  return veri;
}

// ---------- KISA YOLLAR ----------
export function apiGet(yol) {
  return apiIstek(yol, { method: 'GET' });
}

export function apiPost(yol, govde) {
  return apiIstek(yol, { method: 'POST', body: JSON.stringify(govde) });
}

export function apiPut(yol, govde) {
  return apiIstek(yol, { method: 'PUT', body: JSON.stringify(govde) });
}

export function apiDelete(yol) {
  return apiIstek(yol, { method: 'DELETE' });
}