import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { bosluk, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

// ============================================================
//  BÖLÜM BAŞLIĞI — ana sayfadaki her bölümün üstünde
//
//  baslik      : sol taraftaki metin
//  onTumunuBas : verilirse sağda "Tümünü gör" bağlantısı çıkar
//
//  ⚠️ AYIRICI ÇİZGİ YOK — bölümleri boşluk ayırıyor.
//  Her bölümün üstüne çizgi çekseydik ana sayfa bir ayar ekranı
//  gibi okunurdu. Vitrin ferah olmalı; ayrım için 24dp boşluk
//  yeterli.
//
//  ⚠️ "Tümünü gör" İSTEĞE BAĞLI. Bazı bölümlerin gidilecek bir
//  "tümü" sayfası yok (ürün ızgarası zaten tümü). Zorunlu
//  olsaydı oralara anlamsız bir bağlantı koymak gerekirdi.
// ============================================================
export default function BolumBasligi({ baslik, onTumunuBas }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  return (
    <View style={styles.satir}>
      <Text style={styles.baslik} numberOfLines={1}>{baslik}</Text>

      {onTumunuBas && (
        <TouchableOpacity onPress={onTumunuBas} style={styles.baglanti} hitSlop={8}>
          <Text style={styles.baglantiYazi}>Tümünü gör</Text>
          <Ionicons name="chevron-forward" size={14} color={renkler.anaRenk} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // ⚠️ Başlık da sayfaKenari'nda: "Kategoriler" yazısının sol
    // kenarı, altındaki ilk karonun sol kenarıyla aynı çizgide
    // olmalı. Farklı olsaydı başlık kaymış görünürdü.
    paddingHorizontal: sayfaKenari,
    marginBottom: bosluk.kucuk,
  },

  baslik: {
    flex: 1,
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    lineHeight: satir.buyuk,
    color: renkler.yaziKoyu,
  },

  baglanti: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: bosluk.kucuk,
  },

  baglantiYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.normal,
    color: renkler.anaRenk,
  },
});
