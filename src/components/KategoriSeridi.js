import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { bosluk, sayfaKenari } from '../theme/olculer';
import { kategoriIkonu } from '../services/kategoriIkon';
import SecimKarosu from './SecimKarosu';

// ============================================================
//  KATEGORİ ŞERİDİ — ana sayfada yatay kategori karoları
//
//  kategoriler  : [{ id, name }]
//  seciliIdler  : şu an filtrede seçili olan kategori id'leri
//  onSec(id)    : bir karoya basıldı
//  onTumuBas()  : sondaki "Tümü" karosuna basıldı
//
//  ⚠️ FİLTRE PANELİNDEKİ KARONUN AYNISI — bilerek.
//
//  Aynı SecimKarosu bileşeni kullanılıyor, aynı ikonlar, aynı
//  seçili görünümü. Müşteri ana sayfada bastığı karoyu filtre
//  panelinde de aynı biçimde görüyor ve "burada seçtiğim şey
//  oradaki filtreyle aynı şey mi?" sorusu hiç doğmuyor.
//
//  İki yerde iki farklı görünüm çizseydik ikisinin AYNI durumu
//  gösterdiğini kimse tahmin edemezdi.
//
//  ⚠️ BASINCA ANINDA FİLTRELENİYOR — panelden farkı bu.
//  Panelde seçimler taslakta birikiyor ve "göster"e basılınca
//  uygulanıyor; orada müşteri birden çok ayar yapıyor. Burada tek
//  bir dokunuş var ve beklenti "tak diye o kategori gelsin".
//
//  ⚠️ ŞERİT TEK SEÇİM GİBİ DAVRANIR, PANEL ÇOKLU. Karar bu
//  bileşende değil `AnaSayfaEkrani`'nın `kategoriSec`'inde ve
//  gerekçesi orada yazılı: buradaki dokunuş bir kısayol, "şimdi
//  bunu göster" demek. `seciliIdler` yine bir dizi — panel birden
//  çok kategori seçmişse şerit hepsini seçili gösterir.
//
//  ⚠️ ŞERİT ALT SATIRA SARMIYOR. Yedi kategori sarsaydı üç satır
//  ederdi ve banner'ın altındaki alanı yiyip son gezilenleri
//  ekranın dışına iterdi.
// ============================================================
export default function KategoriSeridi({ kategoriler, seciliIdler = [], onSec, onTumuBas }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.serit}
      style={styles.kap}
      directionalLockEnabled
    >
      {kategoriler.map((k) => (
        <SecimKarosu
          key={k.id}
          ikon={kategoriIkonu(k.name)}
          etiket={k.name}
          secili={seciliIdler.includes(k.id)}
          onBas={() => onSec(k.id)}
        />
      ))}

      {/* ⚠️ "Tümü" karosu SONDA, başta değil.
          Başta olsaydı her açılışta ilk göze çarpan şey "tüm
          kategoriler" olurdu — oysa müşterinin ilk aradığı şey
          kendi kategorisi. Sonda durunca "listede aradığını
          bulamadıysan buradan hepsine bak" anlamı çıkıyor. */}
      {onTumuBas && (
        <SecimKarosu
          ikon="grid-outline"
          etiket="Tümü"
          secili={false}
          onBas={onTumuBas}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ⚠️ flexGrow/flexShrink 0 — yatay ScrollView'in dikey akışta
  // kalan alanı yutma huyu. (SiralamaSeridi'nde yaşandı.)
  kap: {
    flexGrow: 0,
    flexShrink: 0,
  },

  serit: {
    paddingHorizontal: sayfaKenari,
    gap: bosluk.kucuk,

    // Onay rozeti karonun üstünden taşıyor; dikey boşluk olmadan
    // üst kenarı kırpılırdı.
    paddingVertical: bosluk.kucuk,
  },
});
