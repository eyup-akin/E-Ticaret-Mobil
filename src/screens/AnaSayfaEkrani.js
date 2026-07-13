import React, { useState, useEffect } from 'react';
import { Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet } from '../services/api';
import { useFavorite } from '../context/FavoriteContext';
import { useTema } from '../context/TemaContext';
import AramaCubugu from '../components/AramaCubugu';
import UrunKarti from '../components/UrunKarti';

export default function AnaSayfaEkrani({ navigation }) {
  const { favorileriYukle, favoriIdler } = useFavorite();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  async function urunleriGetir(arama = '') {
    try {
      setYukleniyor(true);
      const yol = arama
        ? '/products?search=' + encodeURIComponent(arama)
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
    urunleriGetir();
    favorileriYukle();
  }, []);

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <AramaCubugu
        value={aramaMetni}
        onChangeText={setAramaMetni}
        onSubmit={(metin) => urunleriGetir(metin)}
        onMenuBas={() => navigation.navigate('Kategoriler')}
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
          ListEmptyComponent={<Text style={styles.bosYazi}>Ürün bulunamadı.</Text>}
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