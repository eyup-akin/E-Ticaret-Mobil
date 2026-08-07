import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { useFavorite } from '../context/FavoriteContext';
import { useAuth } from '../context/AuthContext';
import GirisGerekliEkrani from '../components/GirisGerekliEkrani';
import AramaCubugu from '../components/AramaCubugu';
import UrunKarti from '../components/UrunKarti';   // ⭐ ana sayfadaki kartın aynısı

export default function FavorilerimEkrani({ navigation }) {
  const { token } = useAuth();
  const { renkler } = useTema();
  const { favoriMi, favoriIdler } = useFavorite();
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
      if (!token) return;
      favorileriGetir();
    }, [token])
  );

  // Arama süzgeci + karttan kalbe basıp çıkarılanları anında gizle
  const filtreliFavoriler = favoriler
    .filter((f) => favoriMi(f.productId))
    .filter((f) =>
      aramaMetni ? f.productName.toLowerCase().includes(aramaMetni.toLowerCase()) : true
    );

  function kartCiz({ item }) {
    // FavoriteDto → UrunKarti'nın beklediği "urun" şekline çevir
    const urun = {
      id: item.productId,
      name: item.productName,
      price: item.productPrice,

      // ⭐ DEĞİŞTİ — ham stok yerine türetilmiş alanlar.
      // Sunucu FavoriteDto'da da ProductDto ile AYNI iki alanı
      // gönderiyor; böylece favori listesindeki kart ile ana
      // sayfadaki kart aynı bilgiyi aynı biçimde alıyor.
      stokDurumu: item.stokDurumu,
      kalanAdet: item.kalanAdet,

      mainImageUrl: item.productImageUrl,
    };

    return (
      <UrunKarti
        urun={urun}
        onPress={() =>
          navigation.navigate('AnaSayfa', {
            screen: 'UrunDetay',
            params: { urunId: item.productId },
          })
        }
      />
    );
  }

  if (!token) {
    return (
      <GirisGerekliEkrani
        ikon="heart-outline"
        baslik="Favorilerini görmek için giriş yap"
        aciklama="Beğendiğin ürünleri kaydedip istediğin zaman kolayca bulabilirsin."
      />
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
        renderItem={kartCiz}
        numColumns={2}
        columnWrapperStyle={styles.satir}
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
    backgroundColor: renkler.arkaPlan
  },
  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: renkler.arkaPlan
  },
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik
  },
  geriButon: {
    marginRight: 12
  },
  ustBaslik: {
    fontSize: 18,
    fontWeight: '600',
    color: renkler.yaziKoyu
  },
  liste: {
    padding: 8,
    flexGrow: 1
  },
  satir: {
    justifyContent: 'space-between'
  },
  bosKutu: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri,
    marginTop: 12
  }
});