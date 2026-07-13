import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavorite } from '../context/FavoriteContext';
import { useTema } from '../context/TemaContext';

// Grid'de kullanılan tek bir ürün kartı. Hem Ana Sayfa hem Kategori Ürünleri kullanır.
export default function UrunKarti({ urun, onPress }) {
  const { favoriMi, favoriDegistir } = useFavorite();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const favori = favoriMi(urun.id);

  return (
    <TouchableOpacity style={styles.kart} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.resimKutu}>
        <Text style={styles.resimYazi}>{urun.name.charAt(0)}</Text>
      </View>

      <TouchableOpacity
        style={styles.kalpButon}
        onPress={() => favoriDegistir(urun.id)}
      >
        <Ionicons
          name={favori ? 'heart' : 'heart-outline'}
          size={22}
          color={favori ? renkler.favoriRenk : renkler.yaziGri}
        />
      </TouchableOpacity>

      <Text style={styles.urunAd} numberOfLines={2}>
        {urun.name}
      </Text>

      <Text style={styles.fiyat}>
        {urun.price} ₺
      </Text>

      <Text style={urun.stock > 0 ? styles.stokVar : styles.stokYok}>
        {urun.stock > 0 ? 'Stokta var' : 'Tükendi'}
      </Text>
    </TouchableOpacity>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kart: {
    width: '48%',
    backgroundColor: renkler.kartArka,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },
  resimKutu: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  resimYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 48,
    fontWeight: 'bold',
  },
  kalpButon: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: renkler.kartArka,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 2,
  },
  urunAd: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    minHeight: 36,
    color: renkler.yaziKoyu,
  },
  fiyat: {
    fontSize: 16,
    color: renkler.anaRenk,
    fontWeight: 'bold',
  },
  stokVar: {
    fontSize: 12,
    color: renkler.basari,
    marginTop: 2,
  },
  stokYok: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginTop: 2,
  },
});