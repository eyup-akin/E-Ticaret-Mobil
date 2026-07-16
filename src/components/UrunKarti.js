import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFavorite } from '../context/FavoriteContext';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { resimUrl } from '../utils/resim';
import { paraBicimle } from '../utils/bicimlendir';

export default function UrunKarti({ urun, onPress }) {
  const { favoriMi, favoriDegistir } = useFavorite();
  const { token } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);
  const navigation = useNavigation();

  const favori = favoriMi(urun.id);
  const resim = resimUrl(urun.mainImageUrl);
  const tukendi = urun.stock <= 0;

  // ⭐ Puan satırı: backend averageRating + reviewCount gönderince yanacak.
  //    Şu an yorum sistemi yokken bu değerler undefined → satır görünmez.
  const puanVar = urun.reviewCount > 0;

  function kalbeBasildi() {
    if (!token) {
      navigation.navigate('Giris');
      return;
    }
    favoriDegistir(urun.id);
  }

  return (
    <TouchableOpacity style={styles.kart} activeOpacity={0.85} onPress={onPress}>
      {/* ---------- RESİM ALANI (kartın ~%65'i) ---------- */}
      <View style={styles.resimAlan}>
        {resim ? (
          <Image source={{ uri: resim }} style={styles.resim} resizeMode="cover" />
        ) : (
          <View style={styles.resimYok}>
            <Text style={styles.resimHarf}>{urun.name.charAt(0)}</Text>
          </View>
        )}

        {tukendi && (
          <View style={styles.tukendiOrtu}>
            <Text style={styles.tukendiYazi}>TÜKENDİ</Text>
          </View>
        )}

        <TouchableOpacity style={styles.kalpButon} onPress={kalbeBasildi} hitSlop={8}>
          <Ionicons
            name={favori ? 'heart' : 'heart-outline'}
            size={20}
            color={favori ? renkler.favoriRenk : '#555'}
          />
        </TouchableOpacity>
      </View>

      {/* ---------- BİLGİ ALANI ---------- */}
      <View style={styles.bilgi}>
        <Text style={styles.urunAd} numberOfLines={2}>{urun.name}</Text>

        {/* ⭐ Puan satırı — sadece yorum varsa */}
        {puanVar && (
          <View style={styles.puanSatir}>
            <Ionicons name="star" size={13} color="#f5a623" />
            <Text style={styles.puanYazi}>{Number(urun.averageRating).toFixed(1)}</Text>
            <Text style={styles.puanAdet}>({urun.reviewCount})</Text>
          </View>
        )}

        <Text style={styles.fiyat}>{paraBicimle(urun.price)}</Text>

        <View style={styles.stokSatir}>
          <View
            style={[styles.stokNokta, { backgroundColor: tukendi ? renkler.yaziGri : renkler.basari }]}
          />
          <Text style={[styles.stokYazi, { color: tukendi ? renkler.yaziGri : renkler.basari }]}>
            {tukendi ? 'Tükendi' : 'Stokta var'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kart: {
    width: '48%',
    backgroundColor: renkler.kartArka,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    overflow: 'hidden',
    elevation: 2,
  },
  resimAlan: {
    width: '100%',
    height: 200,            // ⭐ 150 → 200 (kartın ~%65'i). Ayar düğmesi burası.
    backgroundColor: renkler.acikGri,
    position: 'relative',
  },
  resim: {
    width: '100%',
    height: '100%',
  },
  resimYok: {
    width: '100%',
    height: '100%',
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resimHarf: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 56,
    fontWeight: 'bold',
  },
  tukendiOrtu: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tukendiYazi: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  kalpButon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  bilgi: {
    padding: 10,
  },
  urunAd: {
    fontSize: 14,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    minHeight: 36,
    marginBottom: 4,
  },
  puanSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  puanYazi: {
    fontSize: 12,
    fontWeight: '700',
    color: renkler.yaziKoyu,
    marginLeft: 3,
  },
  puanAdet: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginLeft: 3,
  },
  fiyat: {
    fontSize: 17,
    fontWeight: 'bold',
    color: renkler.anaRenk,
    marginBottom: 6,
  },
  stokSatir: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stokNokta: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  stokYazi: {
    fontSize: 12,
    fontWeight: '500',
  },
});