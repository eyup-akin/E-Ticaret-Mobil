import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { kategoriEmoji } from '../services/kategoriIkon';
import AramaCubugu from '../components/AramaCubugu';

export default function KategorilerEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [kategoriler, setKategoriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  useEffect(() => {
    async function kategorileriGetir() {
      try {
        const veri = await apiGet('/categories');
        setKategoriler(veri);
      } catch (hata) {
        console.log('Kategoriler alınamadı:', hata.message);
      } finally {
        setYukleniyor(false);
      }
    }
    kategorileriGetir();
  }, []);

  // Arama çubuğu ÜRÜN arar — sonuçları Kategori Ürünleri ekranında gösteririz
  function aramaYap() {
    if (!aramaMetni.trim()) return;
    navigation.navigate('KategoriUrunleri', {
      kategoriId: null,
      kategoriAdi: 'Arama: ' + aramaMetni,
      baslangicArama: aramaMetni,
    });
  }

  function kategoriKarti({ item }) {
    return (
      <TouchableOpacity
        style={styles.kart}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('KategoriUrunleri', {
            kategoriId: item.id,
            kategoriAdi: item.name,
          })
        }
      >
        <Text style={styles.emoji}>{kategoriEmoji(item.name)}</Text>
        <Text style={styles.kategoriAd} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      {/* Üst bar: geri + arama */}
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <View style={styles.aramaKutu}>
          <AramaCubugu
            value={aramaMetni}
            onChangeText={setAramaMetni}
            onSubmit={aramaYap}
            canliArama={false}
            placeholder="Ürün veya kategori ara"
          />
        </View>
      </View>

      <Text style={styles.baslik}>Tüm Kategoriler</Text>

      {yukleniyor ? (
        <ActivityIndicator size="large" color={renkler.anaRenk} style={styles.cark} />
      ) : (
        <FlatList
          data={kategoriler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={kategoriKarti}
          numColumns={2}
          columnWrapperStyle={styles.satir}
          contentContainerStyle={styles.liste}
          ListEmptyComponent={<Text style={styles.bosYazi}>Kategori bulunamadı.</Text>}
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
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },
  geriButon: {
    paddingRight: 4,
  },
  aramaKutu: {
    flex: 1,
  },
  baslik: {
    fontSize: 22,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cark: {
    marginTop: 40,
  },
  liste: {
    padding: 12,
  },
  satir: {
    justifyContent: 'space-between',
  },
  kart: {
    width: '48%',
    height: 110,
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  emoji: {
    fontSize: 36,
  },
  kategoriAd: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  bosYazi: {
    textAlign: 'center',
    marginTop: 40,
    color: renkler.yaziGri,
    fontSize: 16,
  },
});