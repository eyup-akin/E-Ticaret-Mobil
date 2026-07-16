import { API_URL } from './config';
import { tokenAl, tokenSil, kullaniciSil } from './tokenStorage';

// ============================================
// OTURUM BİTTİ BİLDİRİMİ
//
// Problem: api.js düz bir modül — React bileşeni değil.
// Yani içinden useAuth() çağırıp cikisYap() diyemeyiz (hook kuralları).
//
// Çözüm: AuthContext açılışta buraya kendi çıkış fonksiyonunu "kaydeder".
// api.js 401 görünce o fonksiyonu çağırır. Ters bağımlılık kurmadan haberleşiyoruz.
// ============================================
let oturumBittiBildir = null;

export function oturumBittiKaydet(fonksiyon) {
  oturumBittiBildir = fonksiyon;
}

// ============================================
// Bütün istekler buradan geçer.
// Token'ı otomatik ekler, hataları tek yerde yakalar.
// ============================================
export async function apiIstek(yol, secenekler = {}) {
  const token = await tokenAl();

  const headers = {
    'Content-Type': 'application/json',
    ...(secenekler.headers || {}),
  };

  // Token varsa "bilek bandını" isteğe iliştir
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  let cevap;

  try {
    cevap = await fetch(API_URL + yol, { ...secenekler, headers });
  } catch {
    // Buraya düşüyorsa: backend kapalı, IP yanlış, veya telefon ağda değil.
    // Ham "Network request failed" yerine anlaşılır bir mesaj veriyoruz.
    throw new Error('Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.');
  }

  // Backend'in gönderdiği metni JSON'a çevirmeye çalış
  const metin = await cevap.text();
  let veri = null;

  if (metin) {
    try {
      veri = JSON.parse(metin);
    } catch {
      veri = metin;
    }
  }

  // ---------- OTURUM DÜŞTÜ ----------
  // 401 = token bayat, kullanıcı pasifleştirilmiş, veya süre dolmuş.
  // Kasayı boşaltıp AuthContext'e haber veriyoruz → giriş ekranına düşer.
  //
  // AMA: login/register denemesinin 401'i "oturum bitti" DEĞİL —
  // "şifre yanlış" veya "hesap pasif" demek. Orada zaten oturum yok,
  // kasayı boşaltmaya gerek yok; backend'in gerçek mesajını göstereceğiz.
  const authIstegi = yol.startsWith('/auth/');

  if (cevap.status === 401 && !authIstegi) {
    await tokenSil();
    await kullaniciSil();

    if (oturumBittiBildir) {
      oturumBittiBildir();
    }

    throw new Error('Oturumun sona erdi. Lütfen tekrar giriş yap.');
  }

  // İstek başarısızsa (400, 403, 404, 500...) hata fırlat
  if (!cevap.ok) {
    const hataMesaji = veri && veri.mesaj ? veri.mesaj : 'Bir hata oluştu';
    throw new Error(hataMesaji);
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