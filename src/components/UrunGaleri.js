import React, { useState, useRef } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { resimUrl } from '../utils/resim';
import { bosluk, kose, agirlik, font } from '../theme/olculer';

// ============================================================
//  ÜRÜN GALERİSİ — ürün detayının resim şeridi + favori kalbi
//
//  ⭐ DEĞİŞTİ (GV/Faz 5.1) — ARTIK TAM GENİŞLİK.
//
//  Eskiden iki yandan 12'şer boşluklu, 20px yuvarlak köşeli,
//  sabit 360px yüksekliğinde bir kutuydu. Yeni tasarımda galeri
//  ekranın tamamını kaplıyor ve içerik yaprağı onun üstüne biniyor
//  — "kutu içinde fotoğraf" değil, "fotoğrafın üstünde kart".
//
//  ⚠️ SABİT YÜKSEKLİK YERİNE KARE ORAN.
//  360px, dar bir telefonda neredeyse ekranın yarısı; geniş bir
//  telefonda ise yassı kalıyordu. aspectRatio: 1 her cihazda aynı
//  oranı veriyor. (Ürün kartındaki kararla aynı.)
//
//  ⚠️ useWindowDimensions — Dimensions.get DEĞİL.
//  Dimensions.get bir kereliğine okur; cihaz döndürülünce ya da
//  katlanabilir bir ekran açılınca değer bayat kalır ve sayfalama
//  hesabı (contentOffset / genislik) kayardı.
// ============================================================
export default function UrunGaleri({ resimler = [], urunAdi = '', favori, onKalp, favoriRenk }) {
  const { renkler } = useTema();
  const { width: genislik } = useWindowDimensions();
  const styles = stilOlustur(renkler);
  const [aktif, setAktif] = useState(0);

  // Kaydırma sırasında gereksiz render'ı engelliyor.
  const sonAktif = useRef(0);

  function kaydirmaBitti(olay) {
    const i = Math.round(olay.nativeEvent.contentOffset.x / genislik);
    if (i !== sonAktif.current) {
      sonAktif.current = i;
      setAktif(i);
    }
  }

  return (
    <View style={[styles.galeri, { width: genislik, height: genislik }]}>
      {resimler.length > 0 ? (
        <>
          <FlatList
            data={resimler}
            keyExtractor={(img) => img.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={kaydirmaBitti}
            renderItem={({ item: img }) => (
              <Image
                source={{ uri: resimUrl(img.url) }}
                style={{ width: genislik, height: genislik }}
                resizeMode="cover"
              />
            )}
          />

          {/* ⚠️ Noktalar yarı saydam koyu hapın içinde — banner
              şeridindeki desenin aynısı. Ürün fotoğrafının alt
              bölgesi açık renkliyse (beyaz fon çekimleri sık)
              çıplak beyaz noktalar kaybolurdu. */}
          {resimler.length > 1 && (
            <View style={styles.noktaKatmani} pointerEvents="none">
              <View style={styles.noktaHap}>
                {resimler.map((img, i) => (
                  <View key={img.id} style={[styles.nokta, i === aktif && styles.noktaAktif]} />
                ))}
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.resimYok}>
          <Text style={styles.resimHarf}>{urunAdi.charAt(0)}</Text>
        </View>
      )}

      {/* Favori kalbi — sağ üstte yüzen daire */}
      <TouchableOpacity style={styles.kalp} onPress={onKalp} hitSlop={8}>
        <Ionicons
          name={favori ? 'heart' : 'heart-outline'}
          size={22}
          color={favori ? favoriRenk : renkler.yaziOrta}
        />
      </TouchableOpacity>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  // ⚠️ Köşe yarıçapı YOK ve yan boşluk YOK — galeri ekranın
  // kenarlarına dayanıyor. Yuvarlatmayı içerik yaprağı yapıyor.
  galeri: {
    backgroundColor: renkler.acikKart,
    position: 'relative',
  },

  resimYok: {
    width: '100%',
    height: '100%',
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
  },

  resimHarf: {
    color: renkler.yaziGri,
    fontSize: 96,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  /* ⚠️ Noktalar galerinin altına değil, ALTINDAN YUKARI konumlu:
     içerik yaprağı galerinin alt 16px'ini örtüyor, noktalar orada
     kalsaydı yaprağın altında kaybolurdu. */
  noktaKatmani: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: bosluk.dev,
    alignItems: 'center',
  },

  // Bu rgba'lar ELLE yazılmış ve bilerek: hapın zemini iki temada
  // da siyah olmalı. (Banner şeridindeki gerekçenin aynısı.)
  noktaHap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.mikro,
    paddingHorizontal: bosluk.kucuk,
    paddingVertical: 5,
    borderRadius: kose.tam,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },

  nokta: {
    width: 6,
    height: 6,
    borderRadius: kose.tam,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },

  noktaAktif: {
    width: 18,
    backgroundColor: renkler.anaRenk,
  },

  /* ⭐ DEĞİŞTİ — sabit beyaz yerine tema zemini.
     Eski hali rgba(255,255,255,0.92) idi ve koyu temada da beyaz
     kalıyordu; ayrıca ikon rengi '#555' sabitti ve koyu temada
     görünmüyordu. elevation de tek başınaydı (iOS'ta gölge yoktu). */
  kalp: {
    position: 'absolute',
    top: bosluk.orta,
    right: bosluk.orta,
    backgroundColor: renkler.kartArka,
    width: 40,
    height: 40,
    borderRadius: kose.tam,
    justifyContent: 'center',
    alignItems: 'center',
    ...renkler.golgeSm,
  },
});
