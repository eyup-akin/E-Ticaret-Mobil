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

export function durumRengi(kod, renkler) {
  if (kod === 'teslim_edildi') return renkler.basari;
  if (kod === 'kargoda') return renkler.anaRenk;
  if (kod === 'iptal') return '#e74c3c';   // kırmızı
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
  if (kod === 'iade_edildi') return '#8e44ad';   // mor
  return renkler.yaziOrta;                          // beklemede
}