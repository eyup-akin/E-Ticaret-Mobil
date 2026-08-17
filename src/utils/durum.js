// Sipariş ve ödeme durum kodlarını okunabilir yazıya + renge çeviren TEK kaynak.
// Backend kodları:
//   status:        odeme_bekliyor · hazirlaniyor · kargoda · teslim_edildi · iptal
//   paymentStatus: odeme_bekliyor · odeme_incelemede · odendi ·
//                  odeme_basarisiz · iade_edildi · kismi_iade · beklemede (eski)

export function durumYazisi(kod) {
  // ⭐ YENİ — ödeme onayı beklenen sipariş.
  if (kod === 'odeme_bekliyor') return 'Ödeme Bekliyor';
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

  // ⭐ Ödeme bekliyor: sıra müşteride, eylem gerekiyor → uyarı rengi.
  if (kod === 'odeme_bekliyor') return renkler.uyari;

  return renkler.yaziOrta;                  // hazirlaniyor
}

export function odemeYazisi(kod) {
  if (kod === 'odendi') return 'Ödendi';
  if (kod === 'odeme_bekliyor') return 'Ödeme Bekliyor';

  // ⚠️ "Ödendi" DEĞİL: banka doğrulaması sürüyor, ret gelebilir.
  if (kod === 'odeme_incelemede') return 'Doğrulanıyor';

  if (kod === 'odeme_basarisiz') return 'Ödeme Alınamadı';
  if (kod === 'iade_edildi') return 'İade Edildi';
  if (kod === 'kismi_iade') return 'Kısmi İade';
  if (kod === 'beklemede') return 'Beklemede';
  return kod;
}

export function odemeRengi(kod, renkler) {
  if (kod === 'odendi') return renkler.basari;
  if (kod === 'iade_edildi' || kod === 'kismi_iade') return renkler.iadeRengi;
  if (kod === 'odeme_basarisiz') return renkler.hata;
  if (kod === 'odeme_bekliyor' || kod === 'odeme_incelemede') return renkler.uyari;
  return renkler.yaziOrta;                          // beklemede
}

// Bu durumdaki sipariş iptal edilebilir mi? (backend IptalEdilebilirDurumlar ile aynı)
//
// ⭐ odeme_bekliyor eklendi: müşteri ödemeden vazgeçip 30 dakika
// beklemek zorunda kalmasın.
export function iptalEdilebilirMi(kod) {
  return kod === 'odeme_bekliyor'
    || kod === 'hazirlaniyor'
    || kod === 'kargoda';
}

// ⭐ YENİ — bu siparişin ödemesi hâlâ tamamlanabilir mi?
//
// Sipariş oluştu ama para gelmedi; müşteri "Ödemeyi tamamla" ile
// aynı siparişe dönebiliyor. Doğrulanmakta olan ödeme HARİÇ: orada
// para çekilmiş olabilir, ikinci deneme çift ödeme demek.
export function odemeTamamlanabilirMi(siparis) {
  return siparis.durum === 'odeme_bekliyor'
    && siparis.odemeDurumu !== 'odeme_incelemede';
}
