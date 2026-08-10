import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { bosluk } from '../theme/olculer';
import { siralamaSecenekleri } from '../services/urunFiltresi';
import Chip from './Chip';

// ============================================================
//  SIRALAMA ŞERİDİ — listenin üstünde yatay chip dizisi
//
//  secili   : yürürlükteki sıralama değeri
//  onSec(d) : yeni sıralama seçildi
//
//  ⚠️ NEDEN FİLTRE PANELİNİN İÇİNDE DEĞİL?
//
//  Sıralama, filtrelerin en sık kullanılanı. Panelin içine
//  gömseydik her değişiklik üç dokunuş isterdi: paneli aç, seç,
//  uygula. Burada tek dokunuş.
//
//  Ayrıca sıralama bir DARALTMA değil: hiçbir ürünü elemiyor,
//  yalnızca sırasını değiştiriyor. Filtrelerle aynı yerde durması
//  bu farkı gizlerdi ve "sıralamayı temizle" gibi anlamsız bir
//  beklenti doğururdu.
//
//  ⚠️ SEÇİLİYE TEKRAR BASMAK SEÇİMİ KALDIRMIYOR — Chip'in filtre
//  panelindeki davranışının aksine. Sebebi: liste her zaman BİR
//  sıraya göre diziliyor, "sıralamasız" diye bir durum yok.
//  Kaldırılabilir olsaydı boşta kalan durum sessizce varsayılana
//  düşer, kullanıcı da neden değiştiğini anlamazdı.
// ============================================================
export default function SiralamaSeridi({ secili, onSec }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.serit}

      // ⚠️ BU SATIR OLMADAN ŞERİT EZİLİYOR — yaşandı.
      //
      // ScrollView varsayılan olarak flexGrow:1 gibi davranıyor.
      // Dikey bir kolonun (SafeAreaView) içinde, altında flex:1
      // olan bir FlatList varken kalan yüksekliği paylaşmaya
      // çalışıyor ve kendisine birkaç piksel düşüyor: chip'lerin
      // sadece üst kenarı görünüyor.
      //
      // flexGrow/flexShrink 0 demek "içeriğin kadar yer kapla,
      // ne fazla ne az". Yükseklik ELLE verilmedi çünkü punto
      // ölçeği değişince şerit de kendiliğinden büyümeli.
      style={styles.kapsayici}

      // ⚠️ Yatay kaydırılan bir şerit, dikey listenin içinde duruyor.
      // Bu olmadan Android'de parmak hafif eğik kayarsa jest dikey
      // listeye kapılır ve şerit hiç kaymaz.
      directionalLockEnabled
    >
      {siralamaSecenekleri.map((secenek) => (
        <Chip
          key={secenek.deger}
          etiket={secenek.etiket}
          secili={secili === secenek.deger}
          onBas={() => onSec(secenek.deger)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kapsayici: {
    flexGrow: 0,
    flexShrink: 0,
  },

  // ⚠️ Dolgu contentContainerStyle'da, style'da değil. style'a
  // yazsaydık yatay dolgu kaydırma alanını daraltır, son chip
  // ekranın kenarına yapışırdı.
  serit: {
    paddingHorizontal: bosluk.orta,
    paddingBottom: bosluk.kucuk,
    gap: bosluk.kucuk,
  },
});
