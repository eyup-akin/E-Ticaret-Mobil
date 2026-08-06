import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik } from '../theme/olculer';

// ============================================================
//  ROZET — küçük durum / bilgi etiketi
//
//  tip  : 'basari' | 'uyari' | 'hata' | 'vurgu' | 'notr' | 'indirim'
//  yazi : gösterilecek metin
//
//  ⚠️ ROZET BİR DURUM GÖSTERGESİDİR, BUTON DEĞİL.
//  Tıklanabilir bir seçim gerekiyorsa (kategori filtresi gibi)
//  Chip yazılmalı — aynı görünüp farklı iş yapan iki şeyi tek
//  bileşende toplamak, yarın birini değiştirince diğerini de
//  bozmak demek.
//
//  ⚠️ NEDEN "indirim" AYRI BİR TİP, NEDEN "hata" DEĞİL?
//  İkisi de kırmızı ama anlamları zıt: biri "bir şey ters gitti",
//  diğeri "fırsat". Aynı tipi paylaşsalardı, yarın hata rengini
//  değiştirdiğimizde indirim rozeti de değişirdi.
//
//  Ayrıca indirim rozeti DOLU zeminli (dikkat çekmeli), diğerleri
//  yumuşak zeminli (bilgi verir, bağırmaz).
// ============================================================
export default function Rozet({ tip = 'notr', yazi: metin }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  return (
    <View style={[styles.rozet, styles['zemin_' + tip]]}>
      <Text style={[styles.yaziStil, styles['renk_' + tip]]} numberOfLines={1}>
        {metin}
      </Text>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  rozet: {
    alignSelf: 'flex-start',
    paddingHorizontal: bosluk.kucuk,
    paddingVertical: 3,

    // Hap biçimi: yükseklik ne olursa olsun uçlar tam yuvarlak
    borderRadius: kose.tam,
  },

  yaziStil: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,

    // ⚠️ lineHeight AÇIKÇA veriliyor.
    // Verilmezse React Native platforma göre farklı satır
    // yüksekliği seçiyor ve aynı rozet iOS'ta bir, Android'de
    // başka yükseklikte çıkıyor.
    lineHeight: 15,
  },

  /* ---------- YUMUŞAK ZEMİNLİ TİPLER ---------- */

  zemin_basari: { backgroundColor: renkler.yumusakBasari },
  zemin_uyari: { backgroundColor: renkler.yumusakUyari },
  zemin_hata: { backgroundColor: renkler.yumusakHata },
  zemin_vurgu: { backgroundColor: renkler.yumusakVurgu },
  zemin_notr: { backgroundColor: renkler.acikGri },

  renk_basari: { color: renkler.basari },
  renk_uyari: { color: renkler.uyari },
  renk_hata: { color: renkler.hata },
  renk_vurgu: { color: renkler.anaRenk },
  renk_notr: { color: renkler.yaziOrta },

  /* ---------- DOLU ZEMİNLİ: İNDİRİM ---------- */

  // Referans tasarımlardaki kırmızı indirim hapı. Ürün görselinin
  // üstünde duruyor, o yüzden yumuşak zemin yetmez — görselin
  // rengi ne olursa olsun okunması gerekiyor.
  zemin_indirim: { backgroundColor: renkler.indirimArka },
  renk_indirim: { color: renkler.indirimYazi },
});
