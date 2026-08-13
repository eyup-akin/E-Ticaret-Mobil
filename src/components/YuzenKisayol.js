import React, { useRef, useEffect } from 'react';
import { Animated, Easing, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, font } from '../theme/olculer';

// ⭐ YENİ — YÜZEN KISAYOL
//
// Sayfanın sağ altında duran, kaydırınca yumuşakça kaybolup geri
// gelen kısayol.
//
// ⚠️ NE ZAMAN görüneceğine BU BİLEŞEN KARAR VERMİYOR — `gorunur`
// prop'u olarak dışarıdan geliyor (bkz. useKaydirmaGizleme). Kararı
// da animasyonu da tek yere koysaydık, kuralı değiştirmek için
// görünüm kodunu okumak gerekirdi.
//
// ⚠️ NEDEN react-native-reanimated DEĞİL?
//
// Projede kurulu değil ve yerel bir bağımlılık: eklemek dev client'ı
// yeniden derlemeyi gerektirir. Tek bir buton için bu bedel ağır.
// RN'in kendi Animated'ı `useNativeDriver: true` ile opaklık ve
// dönüşümü UI iş parçacığında çalıştırıyor — animasyon boyunca JS
// hiç çalışmıyor, yani kaydırma sırasında kare düşmüyor.
//
// ⚠️ SADECE opacity VE transform ANİMASYONLU. useNativeDriver bu iki
// özelliği destekliyor; genişlik/yükseklik/renk desteklemiyor ve
// onları animasyona katsaydık sürücü sessizce JS'e düşerdi.
export default function YuzenKisayol({
  gorunur = true,
  ikon = 'bookmark',
  yazi: etiket,
  onPress,
}) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  // ⚠️ useRef: Animated.Value her render'da yeniden üretilmemeli,
  // yoksa animasyon her state değişiminde baştan başlardı.
  const canlandirma = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(canlandirma, {
      toValue: gorunur ? 1 : 0,

      // ⚠️ Gelme, gitmeden YAVAŞ. Kaybolma fark edilmemeli (müşteri
      // ürünlere bakıyor), geri gelme ise fark edilmeli — kısayolun
      // orada olduğunu hatırlatan şey o hareket.
      duration: gorunur ? 260 : 180,

      // Doğrusal değil: hızlı başlayıp yumuşak duran eğri, "yerine
      // oturdu" hissi veriyor.
      easing: gorunur ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),

      useNativeDriver: true,
    }).start();
  }, [gorunur, canlandirma]);

  const canliStil = {
    opacity: canlandirma,
    transform: [
      // Sağa doğru kayarak çıkıyor — ekranın dışına doğru. Yukarı ya
      // da aşağı kayması, altındaki içerikle çakışan bir hareket
      // olurdu.
      {
        translateX: canlandirma.interpolate({
          inputRange: [0, 1],
          outputRange: [72, 0],
        }),
      },
      // Hafif küçülme, kaybolmayı "uzaklaşma" gibi gösteriyor.
      {
        scale: canlandirma.interpolate({
          inputRange: [0, 1],
          outputRange: [0.86, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[styles.kap, canliStil]}
      /* ⚠️ Opaklığın 0 olması dokunmayı ENGELLEMİYOR — görünmez bir
         buton yine tıklanır. pointerEvents olmadan müşteri boş bir
         yere basıp kendini bu ekranda bulurdu. */
      pointerEvents={gorunur ? 'auto' : 'none'}
    >
      <Pressable
        style={({ pressed }) => [styles.buton, pressed && styles.butonBasili]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={etiket}
        /* Gizliyken ekran okuyucu da atlasın — görünmeyen bir
           düğmeyi okumak kafa karıştırır. */
        accessibilityElementsHidden={!gorunur}
        importantForAccessibility={gorunur ? 'auto' : 'no-hide-descendants'}
      >
        <Ionicons name={ikon} size={18} color={renkler.anaRenkUstuYazi} />
        <Text style={styles.yazi} numberOfLines={1}>{etiket}</Text>
      </Pressable>
    </Animated.View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kap: {
    position: 'absolute',
    right: bosluk.normal,

    // ⚠️ Alt sekme çubuğu BU ekranın dışında (MainTabNavigator);
    // burada yalnızca ekranın kendi alt kenarından pay bırakıyoruz.
    bottom: bosluk.genis,

    // Listenin üstünde kalmalı.
    zIndex: 10,

    // ⚠️ elevation TEK BAŞINA yetmez — yalnızca Android'de çalışır,
    // iOS'ta buton tamamen düz görünürdü. Tema gölgesi ikisini de
    // veriyor.
    ...renkler.golgeMd,
  },

  buton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,

    paddingVertical: bosluk.orta,
    paddingHorizontal: bosluk.normal,

    // Hap biçimi: yüzen öğe köşeli olursa kart gibi görünüyor ve
    // sayfanın parçası sanılıyor.
    borderRadius: kose.tam,
    backgroundColor: renkler.anaRenk,
  },

  /* Dokunma geri bildirimi: TouchableOpacity yerine Pressable
     kullanıldı çünkü kap zaten Animated ve opaklığı animasyon
     yönetiyor — ikinci bir opaklık kaynağı ikisini çakıştırırdı.
     Burada opaklık değil ZEMİN koyulaşıyor. */
  butonBasili: {
    backgroundColor: renkler.anaRenkKoyu,
  },

  yazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },
});
