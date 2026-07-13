import { API_URL } from './config';
import { tokenAl } from './tokenStorage';

// Bütün istekler buradan geçer. Token'ı otomatik ekler.
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

  const cevap = await fetch(API_URL + yol, { ...secenekler, headers });

  // Backend'in gönderdiği metni JSON'a çevirmeye çalış
  const metin = await cevap.text();
  let veri = null;
  if (metin) {
    try { veri = JSON.parse(metin); } catch { veri = metin; }
  }

  // İstek başarısızsa (400, 401, 404, 500...) hata fırlat
  if (!cevap.ok) {
    const hataMesaji = veri && veri.mesaj ? veri.mesaj : 'Bir hata oluştu';
    throw new Error(hataMesaji);
  }

  return veri;
}

// Kısa yollar — ileride bunları kullanacağız
export function apiGet(yol)          { return apiIstek(yol, { method: 'GET' }); }
export function apiPost(yol, govde)  { return apiIstek(yol, { method: 'POST', body: JSON.stringify(govde) }); }
export function apiPut(yol, govde)   { return apiIstek(yol, { method: 'PUT', body: JSON.stringify(govde) }); }
export function apiDelete(yol)       { return apiIstek(yol, { method: 'DELETE' }); }