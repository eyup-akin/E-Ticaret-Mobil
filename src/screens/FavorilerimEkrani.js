import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { useFavorite } from '../context/FavoriteContext';
import AramaCubugu from '../components/AramaCubugu';

export default function FavorilerimEkrani({ navigation }) {
  const { renkler } = useTema();
  const { favoriDegistir, favoriIdler } = useFavorite();
  const styles = stilOlustur(renkler);

  const [favoriler, setFavoriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  async function favorileriGetir() {
    try {
      const veri = await apiGet('/favorites');
      setFavoriler(veri);
    } catch (hata) {
      console.log('Favoriler alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      favorileriGetir();
    }, [])
  );

  async function cikar(item) {
    await favoriDegistir(item.productId);
    setFavoriler((onceki) => onceki.filter((f) => f.productId !== item.productId));
  }

  // Elimizdeki listede süz — backend'e gitmeye gerek yok
  const filtreliFavoriler = aramaMetni
    ? favoriler.filter((f) =>
        f.productName.toLowerCase().includes(aramaMetni.toLowerCase())
      )
    : favoriler;

  function favoriSatiri({ item }) {
    return (
      <TouchableOpacity
        style={styles.satir}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('AnaSayfa', {
            screen: 'UrunDetay',
            params: { urunId: item.productId },
          })
        }
      >
        <View style={styles.harfKutu}>
          <Text style={styles.harfYazi}>{item.productName.charAt(0)}</Text>
        </View>

        <View style={styles.orta}>
          <Text style={styles.urunAd} numberOfLines={2}>{item.productName}</Text>
          <Text style={styles.fiyat}>{item.productPrice} ₺</Text>
        </View>

        <TouchableOpacity onPress={() => cikar(item)} style={styles.kalpButon}>
          <Ionicons name="heart" size={24} color={renkler.favoriRenk} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
            <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
          </TouchableOpacity>
        )}
        <Text style={styles.ustBaslik}>Favorilerim</Text>
      </View>

      {favoriler.length > 0 && (
        <AramaCubugu
          value={aramaMetni}
          onChangeText={setAramaMetni}
          onSubmit={() => {}}
          placeholder="Favorilerimde ara..."
        />
      )}

      <FlatList
        data={filtreliFavoriler}
        keyExtractor={(item) => item.id.toString()}
        renderItem={favoriSatiri}
        contentContainerStyle={styles.liste}
        extraData={favoriIdler}
        ListEmptyComponent={
          <View style={styles.bosKutu}>
            <Ionicons name="heart-outline" size={64} color={renkler.yaziGri} />
            <Text style={styles.bosYazi}>
              {favoriler.length === 0 ? 'Henüz favorin yok.' : 'Eşleşen ürün bulunamadı.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },
  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  liste: {
    padding: 12,
    flexGrow: 1,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renkler.kartArka,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },
  harfKutu: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  harfYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 24,
    fontWeight: 'bold',
  },
  orta: {
    flex: 1,
  },
  urunAd: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 4,
  },
  fiyat: {
    fontSize: 16,
    color: renkler.anaRenk,
    fontWeight: 'bold',
  },
  kalpButon: {
    padding: 8,
  },
  bosKutu: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri,
    marginTop: 12,
  },
});