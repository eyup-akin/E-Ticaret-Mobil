import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useFavorite } from '../context/FavoriteContext';
import { useTema } from '../context/TemaContext';
import AramaCubugu from '../components/AramaCubugu';
import UrunKarti from '../components/UrunKarti';

export default function KategoriUrunleriEkrani({ route, navigation }) {
  // Kategoriler ekranından gelen bilgiler
  const { kategoriId, kategoriAdi, baslangicArama } = route.params;

  const { favoriIdler } = useFavorite();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState(baslangicArama || '');

  // Hem kategoriye göre hem aramaya göre filtreler (ikisi birlikte de çalışır)
  async function urunleriGetir(arama = '') {
    try {
      setYukleniyor(true);

      const parcalar = [];
      if (kategoriId) {
        parcalar.push('categoryId=' + kategoriId);
      }
      if (arama) {
        parcalar.push('search=' + encodeURIComponent(arama));
      }

      const yol = parcalar.length > 0
        ? '/products?' + parcalar.join('&')
        : '/products';

      const veri = await apiGet(yol);
      setUrunler(veri);
    } catch (hata) {
      console.log('Ürünler alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    urunleriGetir(baslangicArama || '');
  }, [kategoriId]);

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      {/* Üst bar: geri + kategori adı */}
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik} numberOfLines={1}>{kategoriAdi}</Text>
      </View>

      <AramaCubugu
        value={aramaMetni}
        onChangeText={setAramaMetni}
        onSubmit={(metin) => urunleriGetir(metin)}
      />

      {yukleniyor ? (
        <ActivityIndicator size="large" color={renkler.anaRenk} style={styles.cark} />
      ) : (
        <FlatList
          data={urunler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <UrunKarti
              urun={item}
              onPress={() => navigation.navigate('UrunDetay', { urunId: item.id })}
            />
          )}
          numColumns={2}
          columnWrapperStyle={styles.satir}
          contentContainerStyle={styles.liste}
          extraData={favoriIdler}
          ListEmptyComponent={<Text style={styles.bosYazi}>Bu kategoride ürün bulunamadı.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },
  geriButon: {
    marginRight: 12,
  },
  ustBaslik: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  cark: {
    marginTop: 40,
  },
  liste: {
    padding: 8,
  },
  satir: {
    justifyContent: 'space-between',
  },
  bosYazi: {
    textAlign: 'center',
    marginTop: 40,
    color: renkler.yaziGri,
    fontSize: 16,
  },
});