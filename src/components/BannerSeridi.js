import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, sayfaKenari } from '../theme/olculer';
import { bannerlariGetir } from '../services/bannerlar';

// ============================================================
//  BANNER ŞERİDİ — yatay kaydırmalı kampanya görselleri
//
//  ⚠️ Şu an TIKLANMIYOR — gerekçesi bannerlar.js'te.
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
export default function BannerSeridi() {
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
  // ⚠️ sayfaKenari kullanılıyor — arama çubuğu ve ürün ızgarasıyla
  // AYNI dikey çizgide dursun diye. Önce bosluk.orta yazılıydı ve
  // banner, altındaki kartlardan 4dp içeride kalıyordu.
  const kart = ekranGenisligi - sayfaKenari * 2;

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
          <View key={b.id} style={[styles.kart, { width: kart }]}>
            {/* ⚠️ resizeMode="cover": görselin oranı 2:1 değilse
                bile kutuyu tam dolduruyor. "contain" olsaydı
                kenarlarda boş şeritler kalırdı. */}
            <Image source={b.gorsel} style={styles.gorsel} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>

      {/* ⭐ DEĞİŞTİ — NOKTALAR ARTIK GÖRSELİN İÇİNDE.

          Önce şeridin altındaydı ve altında ~14dp'lik ölü bir şerit
          bırakıyordu; ekranda banner ile "Kategoriler" başlığı
          arasındaki boşluğun bir kısmı buydu.

          ⚠️ Görselin üstüne koymanın bir bedeli var: fotoğrafın o
          bölgesi açık renkliyse noktalar kaybolur. Bu yüzden
          noktalar YARI SAYDAM KOYU BİR HAPIN içinde duruyor — hangi
          fotoğraf olursa olsun okunuyor. İlk yazımda tam da bu
          riskten kaçınmak için dışarı alınmıştı; hap onu çözüyor.

          ⚠️ Kapsayıcı pointerEvents="none": hapın üstüne basmak
          banner'a basmayı engellememeli.

          ⚠️ Tek banner varsa hiç çizilmiyor — bir noktanın
          gösterecek bir şeyi yok. */}
      {bannerlar.length > 1 && (
        <View style={styles.noktaKatmani} pointerEvents="none">
          <View style={styles.noktaHap}>
            {bannerlar.map((b, i) => (
              <View
                key={b.id}
                style={[styles.nokta, i === aktif && styles.noktaAktif]}
              />
            ))}
          </View>
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
    paddingHorizontal: sayfaKenari,
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

  /* Noktalar görselin ALT-ORTASINDA yüzüyor.
     ⚠️ Mutlak konum + left/right 0 + alignItems:'center' üçlüsü
     genişlik hesabı yapmadan ortalıyor. Sabit bir genişlik
     verseydik nokta sayısı değişince orta kayardı. */
  noktaKatmani: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: bosluk.orta,
    alignItems: 'center',
  },

  /* Yarı saydam koyu hap — noktaların okunmasını fotoğraftan
     bağımsız hale getiriyor.
     ⚠️ Bu rgba ELLE yazılmış ve bilerek: iki temada da SİYAH
     olmalı. Koyu temada açık bir hap, üstündeki fotoğrafı
     aydınlatırdı. Karartma perdesiyle aynı gerekçe. */
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

    // ⚠️ Pasif nokta da ELLE beyaz: hapın içindeki zemin siyah,
    // tema nötrleri orada okunmuyor.
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },

  // Aktif nokta yuvarlak değil KISA BİR HAP: renk körü bir
  // kullanıcı için de "hangisi aktif" biçimden okunuyor.
  noktaAktif: {
    width: 18,
    backgroundColor: renkler.anaRenk,
  },
});
