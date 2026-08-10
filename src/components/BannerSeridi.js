import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTema } from '../context/TemaContext';
import { bosluk, kose } from '../theme/olculer';
import { bannerlariGetir } from '../services/bannerlar';

// ============================================================
//  BANNER ŞERİDİ — yatay kaydırmalı kampanya görselleri
//
//  onBannerBas(banner) : bir banner'a basılınca çağrılır
//
//  ⚠️ SAYFA SAYFA KAYIYOR, SERBEST DEĞİL.
//  pagingEnabled + snapToInterval ile her kaydırma tam bir
//  banner ilerliyor. Serbest kaydırma bıraksaydık şerit iki
//  banner'ın ortasında durur ve ikisi de yarım görünürdü.
//
//  ⚠️ GENİŞLİK EKRANDAN OKUNUYOR, SABİT DEĞİL.
//  useWindowDimensions cihaz döndürülünce de güncelleniyor.
//  Sabit bir sayı yazsaydık yatay modda banner ya taşar ya
//  ortada dururdu.
// ============================================================
export default function BannerSeridi({ onBannerBas }) {
  const { renkler } = useTema();
  const { width: ekranGenisligi } = useWindowDimensions();
  const styles = stilOlustur(renkler);

  const [bannerlar, setBannerlar] = useState([]);
  const [aktif, setAktif] = useState(0);

  // Kaydırma olayı saniyede onlarca kez tetikleniyor; aktif nokta
  // değişmediyse setState çağırmıyoruz. Çağırsaydık her karede
  // bileşen yeniden render olurdu.
  const sonAktif = useRef(0);

  useEffect(() => {
    let iptal = false;

    (async () => {
      const veri = await bannerlariGetir();
      if (!iptal) setBannerlar(veri);
    })();

    return () => { iptal = true; };
  }, []);

  // ⚠️ Banner yoksa bölüm HİÇ çizilmiyor — boş bir kutu ya da
  // "kampanya yok" yazısı değil. Kampanya olmaması bir haber
  // değil; müşteriye söylenecek bir şey yok.
  if (bannerlar.length === 0) {
    return null;
  }

  // Banner genişliği: ekran eksi iki yan boşluk.
  const kart = ekranGenisligi - bosluk.orta * 2;

  function kaydirildi(olay) {
    const x = olay.nativeEvent.contentOffset.x;
    const sira = Math.round(x / (kart + bosluk.kucuk));

    if (sira !== sonAktif.current) {
      sonAktif.current = sira;
      setAktif(sira);
    }
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={kart + bosluk.kucuk}
        decelerationRate="fast"
        onScroll={kaydirildi}
        scrollEventThrottle={32}
        contentContainerStyle={styles.serit}
        style={styles.seritKap}
        directionalLockEnabled
      >
        {bannerlar.map((b) => (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.9}
            onPress={() => onBannerBas && onBannerBas(b)}
            style={[styles.kart, { width: kart }]}
          >
            {/* ⚠️ resizeMode="cover": görselin oranı 2:1 değilse
                bile kutuyu tam dolduruyor. "contain" olsaydı
                kenarlarda boş şeritler kalırdı. */}
            <Image source={b.gorsel} style={styles.gorsel} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ⚠️ Nokta ŞERİDİN ALTINDA, görselin üstünde değil.
          Tasarımda görselin üstündeydi ama oradaki fotoğrafın
          rengi bilinmiyor: açık bir görselde beyaz nokta
          kayboluyor. Altta, sayfa zemininde her zaman okunuyor.

          ⚠️ Tek banner varsa nokta çizilmiyor — bir noktanın
          gösterecek bir şeyi yok. */}
      {bannerlar.length > 1 && (
        <View style={styles.noktalar}>
          {bannerlar.map((b, i) => (
            <View
              key={b.id}
              style={[styles.nokta, i === aktif && styles.noktaAktif]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  // ⚠️ flexGrow/flexShrink 0 — yatay ScrollView'in dikey akışta
  // kalan alanı yutma huyu. (SiralamaSeridi'nde yaşandı.)
  seritKap: {
    flexGrow: 0,
    flexShrink: 0,
  },

  serit: {
    paddingHorizontal: bosluk.orta,
    gap: bosluk.kucuk,
  },

  kart: {
    // 2:1 — tasarımdaki oran. Görsel bundan farklı oranda olsa
    // bile kutu sabit kalıyor, kırpma resizeMode'un işi.
    aspectRatio: 2,
    borderRadius: kose.dev,
    overflow: 'hidden',
    backgroundColor: renkler.acikKart,
  },

  gorsel: {
    width: '100%',
    height: '100%',
  },

  noktalar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: bosluk.mikro,
    marginTop: bosluk.kucuk,
  },

  nokta: {
    width: 6,
    height: 6,
    borderRadius: kose.tam,
    backgroundColor: renkler.pasif,
  },

  // Aktif nokta yuvarlak değil KISA BİR HAP: renk körü bir
  // kullanıcı için de "hangisi aktif" biçimden okunuyor.
  noktaAktif: {
    width: 18,
    backgroundColor: renkler.anaRenk,
  },
});
