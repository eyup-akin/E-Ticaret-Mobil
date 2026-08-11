// Sipariş ve ödeme durum kodlarını okunabilir yazıya + renge çeviren TEK kaynak.
// Backend kodları:
//   status:        hazirlaniyor · kargoda · teslim_edildi · iptal
//   paymentStatus: odendi · beklemede · iade_edildi

export function durumYazisi(kod) {
  if (kod === 'hazirlaniyor') return 'Hazırlanıyor';
  if (kod === 'kargoda') return 'Kargoda';
  if (kod === 'teslim_edildi') return 'Teslim Edildi';
  if (kod === 'iptal') return 'İptal Edildi';
  return kod;
}

// ⭐ DEĞİŞTİ (GV/Faz 7) — elle yazılı renkler token'a bağlandı.
//
// ⚠️ Burada '#e74c3c' ve '#8e44ad' sabit yazılıydı: ikisi de koyu
// temada değişmiyordu ve tasarım sisteminin sabit renk yasağını
// çiğniyordu. Renk kararının tek yeri tema.js.
export function durumRengi(kod, renkler) {
  if (kod === 'teslim_edildi') return renkler.basari;
  if (kod === 'kargoda') return renkler.anaRenk;
  if (kod === 'iptal') return renkler.hata;
  return renkler.yaziOrta;                  // hazirlaniyor
}

export function odemeYazisi(kod) {
  if (kod === 'odendi') return 'Ödendi';
  if (kod === 'beklemede') return 'Beklemede';
  if (kod === 'iade_edildi') return 'İade Edildi';
  return kod;
}

export function odemeRengi(kod, renkler) {
  if (kod === 'odendi') return renkler.basari;
  if (kod === 'iade_edildi') return renkler.iadeRengi;
  return renkler.yaziOrta;                          // beklemede
}

// Bu durumdaki sipariş iptal edilebilir mi? (backend IptalEdilebilirDurumlar ile aynı)
export function iptalEdilebilirMi(kod) {
  return kod === 'hazirlaniyor' || kod === 'kargoda';
}