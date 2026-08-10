import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFavorite } from '../context/FavoriteContext';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { resimUrl } from '../utils/resim';
import { paraBicimle } from '../utils/bicimlendir';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

// ============================================================
//  KOMPAKT ÜRÜN KARTI — yatay şeritler için
//
//  ⚠️ NEDEN UrunKarti'NIN "kucuk" VARYANTI DEĞİL?
//
//  Aynı bileşene boyut prop'u eklemek cazipti ama iki kart
//  farklı BİLGİ taşıyor, farklı boyutta aynı bilgiyi değil:
//
//    UrunKarti (ızgara) → ad, yıldız, puan sayısı, fiyat,
//                          stok rozeti, sepete ekle butonu
//    Bu kart (şerit)    → ad, fiyat. Hepsi bu.
//
//  Tek bileşende toplasaydık render'ın yarısı "boyut === 'kompakt'
//  ise çizme" koşullarından oluşurdu ve ikisinden birini
//  değiştirmek diğerini kırma riski taşırdı.
//
//  ⚠️ BU KART BİR HATIRLATMA, BİR LİSTELEME DEĞİL.
//  "Son gezdiğin ürünler" şeridinde müşteri zaten bildiği bir
//  ürüne bakıyor; ona yıldızı ve stok durumunu tekrar göstermek
//  şeridi ağırlaştırır. Karar vermek için detaya gidecek.
//
//  ⚠️ SEPETE EKLE BUTONU DA YOK — bilerek. Şeritte hızlı hızlı
//  kaydırırken 36dp'lik bir butona yanlışlıkla basmak kolay.
//  Izgarada kart büyük ve duruyor; şeritte hareket halinde.
// ============================================================

const GENISLIK = 140;

function UrunKartiKompaktIc({ urun, onPress }) {
  const { favoriMi, favoriDegistir } = useFavorite();
  const { token } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);
  const navigation = useNavigation();

  const favori = favoriMi(urun.id);
  const resim = resimUrl(urun.mainImageUrl);
  const tukendi = urun.stokDurumu === 'yok';

  function kalbeBasildi() {
    if (!token) {
      navigation.navigate('Giris');
      return;
    }
    favoriDegistir(urun.id);
  }

  return (
    <TouchableOpacity style={styles.kart} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.resimAlan}>
        {resim ? (
          <Image source={{ uri: resim }} style={styles.resim} resizeMode="cover" />
        ) : (
          <View style={styles.resimYok}>
            <Text style={styles.resimHarf}>{urun.name.charAt(0)}</Text>
          </View>
        )}

        {/* Tükendi bilgisi burada da var: müşteri şeritten
            tıklayıp detayda "bu yok" diye öğrenmesin. */}
        {tukendi && (
          <View style={styles.tukendiOrtu}>
            <Text style={styles.tukendiYazi}>TÜKENDİ</Text>
          </View>
        )}

        <TouchableOpacity style={styles.kalpButon} onPress={kalbeBasildi} hitSlop={8}>
          <Ionicons
            name={favori ? 'heart' : 'heart-outline'}
            size={15}
            color={favori ? renkler.favoriRenk : renkler.yaziOrta}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.urunAd} numberOfLines={2}>{urun.name}</Text>
      <Text style={styles.fiyat}>{paraBicimle(urun.price)}</Text>
    </TouchableOpacity>
  );
}

// Şeritte 12 kart var ve ana sayfa sık render oluyor.
// Gerekçenin tamamı UrunKarti'nın altında yazılı.
export default React.memo(UrunKartiKompaktIc);

const stilOlustur = (renkler) => StyleSheet.create({
  kart: {
    width: GENISLIK,
    backgroundColor: renkler.kartArka,
    borderRadius: kose.orta,
    padding: bosluk.kucuk,

    /* ⚠️ Gölge YOK, ince kenarlık VAR — ızgara kartının aksine.
       Yan yana 12 gölgeli kart, şeridi "kabarcıklı" gösteriyor ve
       kaydırırken gölgeler birbirine giriyor. Şeritte ayrımı
       kenarlık yapıyor. */
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },

  resimAlan: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: kose.kucuk,
    overflow: 'hidden',
    backgroundColor: renkler.acikKart,
    position: 'relative',
    marginBottom: bosluk.kucuk,
  },

  resim: {
    width: '100%',
    height: '100%',
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
    fontSize: yazi.dev,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  tukendiOrtu: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tukendiYazi: {
    color: '#ffffff',
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    letterSpacing: 1,
  },

  kalpButon: {
    position: 'absolute',
    top: bosluk.mikro,
    right: bosluk.mikro,
    backgroundColor: renkler.kartArka,
    width: 26,
    height: 26,
    borderRadius: kose.tam,
    justifyContent: 'center',
    alignItems: 'center',
    ...renkler.golgeSm,
  },

  urunAd: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.orta,
    fontFamily: font.orta,
    lineHeight: satir.kucuk,
    color: renkler.yaziKoyu,

    // İki satırlık yer ayrılıyor ki kısa ve uzun adlı kartların
    // fiyatı aynı hizada kalsın.
    minHeight: satir.kucuk * 2,
    marginBottom: bosluk.mikro,
  },

  fiyat: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    lineHeight: satir.orta,
    color: renkler.yaziKoyu,
  },
});
