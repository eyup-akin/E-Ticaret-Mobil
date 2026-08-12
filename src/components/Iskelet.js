import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, sayfaKenari } from '../theme/olculer';

/* ⭐ YENİ (GV/Faz 2.7 + 9.1 + 9.2) — YÜKLENİYOR İSKELETLERİ
 *
 * Tasarım: `y_kleniyor_ve_bo_durumlar`
 *
 * ⚠️ NEDEN ÇARK DEĞİL İSKELET?
 *
 * Dönen çark "bekle" der ve hepsi budur. İskelet ise ne geleceğini
 * de söyler: iki sütunluk bir ızgara mı, alt alta satırlar mı.
 * Müşteri içerik gelmeden önce ekranın şeklini öğreniyor ve içerik
 * geldiğinde yerleşim ZIPLAMAYOR — çark tek bir nokta kadar yer
 * kaplarken kartlar birden ekranı dolduruyordu.
 *
 * ⚠️ İSKELET GERÇEK YERLEŞİMİ TAKLİT ETMELİ, SÜSLEMEMELİ.
 * Ölçüler `UrunKarti` ve sipariş kartıyla aynı token'lardan geliyor;
 * uydurma bir kutu dizisi çizseydik yükleme bitince ekran kayardı
 * ve iskeletin tek faydası ortadan kalkardı.
 *
 * ⚠️ ANİMASYON `useNativeDriver` İLE.
 * Opaklık JS iş parçacığında sürülseydi, tam da liste render
 * ederken (yani JS'in en meşgul olduğu anda) takılırdı — "yavaş"
 * hissini azaltmak için koyduğumuz şey onu artırırdı.
 */

// Nabız: 1 → 0.4 → 1. Kaydırma (shimmer) yerine nabız seçildi:
// kayan parıltı bir gradyan katmanı ve ek bir kütüphane ister;
// kazancı bu ekranlarda görünmüyor.
function Nabiz({ children, style }) {
  const deger = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const dongu = Animated.loop(
      Animated.sequence([
        Animated.timing(deger, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(deger, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    dongu.start();

    // ⚠️ Temizlik şart: ekran kapandıktan sonra dönen bir animasyon
    // arka planda çalışmaya devam eder ve cihazın pilini yer.
    return () => dongu.stop();
  }, [deger]);

  return <Animated.View style={[style, { opacity: deger }]}>{children}</Animated.View>;
}

/* Tek bir gri blok. Genişlik/yükseklik/köşe çağırandan gelir. */
export default function Iskelet({ genislik, yukseklik, kose: koseYaricapi, stil }) {
  const { renkler } = useTema();

  return (
    <View
      style={[
        {
          width: genislik,
          height: yukseklik,
          borderRadius: koseYaricapi ?? kose.kucuk,
          backgroundColor: renkler.iskeletArka,
        },
        stil,
      ]}
    />
  );
}

/* ---- ÜRÜN IZGARASI (2 sütun) ---- (9.1)
 *
 * `adet` kart sayısı. Varsayılan 6: ekranı doldurmaya yetiyor ve
 * fazlası boşuna çizim. Ekranın altında yarım kalan bir kart
 * görünmesi zaten doğru — liste orada bitmiyor demek. */
export function UrunIzgarasiIskeleti({ adet = 6 }) {
  const { width: ekran } = useWindowDimensions();
  const styles = stilOlustur();

  // UrunKarti ile aynı hesap: iki sütun, aralarında ve kenarlarda
  // sayfaKenari kadar boşluk.
  const kartGenisligi = (ekran - sayfaKenari * 3) / 2;

  return (
    <View style={styles.izgara}>
      {Array.from({ length: adet }).map((_, i) => (
        <Nabiz key={i} style={[styles.izgaraKart, { width: kartGenisligi }]}>
          {/* Görsel: kartın kendisiyle aynı oran (1:1) */}
          <Iskelet genislik="100%" yukseklik={kartGenisligi} kose={kose.buyuk} />
          <Iskelet genislik="85%" yukseklik={12} stil={styles.satirBosluk} />
          <Iskelet genislik="55%" yukseklik={12} stil={styles.satirBosluk} />
        </Nabiz>
      ))}
    </View>
  );
}

/* ---- LİSTE SATIRLARI ---- (9.2)
 *
 * Sipariş, ödeme, adres gibi "solda kare, sağda iki satır yazı"
 * düzenindeki listeler için. */
export function SatirListesiIskeleti({ adet = 4 }) {
  const styles = stilOlustur();

  return (
    <View style={styles.liste}>
      {Array.from({ length: adet }).map((_, i) => (
        <Nabiz key={i} style={styles.satir}>
          <Iskelet genislik={56} yukseklik={56} kose={kose.orta} />

          <View style={styles.satirIcerik}>
            <Iskelet genislik="70%" yukseklik={12} />
            <Iskelet genislik="45%" yukseklik={12} stil={styles.satirBosluk} />
          </View>
        </Nabiz>
      ))}
    </View>
  );
}

const stilOlustur = () => StyleSheet.create({
  izgara: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: sayfaKenari,
  },

  izgaraKart: {
    marginBottom: bosluk.orta,
  },

  liste: {
    paddingHorizontal: sayfaKenari,
  },

  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    paddingVertical: bosluk.orta,
  },

  satirIcerik: {
    flex: 1,
  },

  satirBosluk: {
    marginTop: bosluk.kucuk,
  },
});
