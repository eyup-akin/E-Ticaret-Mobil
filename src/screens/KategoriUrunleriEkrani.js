import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useFavorite } from '../context/FavoriteContext';
import { useTema } from '../context/TemaContext';
import { bosluk, yazi, agirlik, satir, font } from '../theme/olculer';
import {
  bosFiltre, varsayilanSiralama, filtreSorgusuKur, aktifFiltreSayisi,
} from '../services/urunFiltresi';
import AramaCubugu from '../components/AramaCubugu';
import UrunKarti from '../components/UrunKarti';
import SiralamaSeridi from '../components/SiralamaSeridi';
import FiltrePaneli from '../components/FiltrePaneli';

export default function KategoriUrunleriEkrani({ route, navigation }) {
  // Kategoriler ekranından gelen bilgiler
  const { kategoriId, kategoriAdi, baslangicArama } = route.params;

  const { favoriIdler } = useFavorite();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState(baslangicArama || '');
  const [uygulananArama, setUygulananArama] = useState(baslangicArama || '');

  // ⭐ YENİ (6.3)
  const [filtre, setFiltre] = useState(bosFiltre);
  const [siralama, setSiralama] = useState(varsayilanSiralama);
  const [panelAcik, setPanelAcik] = useState(false);

  // Kategori, arama, filtre ve sıralama birlikte çalışır.
  async function urunleriGetir(arama, aktifFiltre, aktifSiralama) {
    try {
      setYukleniyor(true);

      const yol = '/products' + filtreSorgusuKur(aktifFiltre, {
        kategoriId,
        arama,
        siralama: aktifSiralama,
      });

      const veri = await apiGet(yol);
      setUrunler(veri);
    } catch (hata) {
      console.log('Ürünler alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    urunleriGetir(uygulananArama, filtre, siralama);
  }, [kategoriId, uygulananArama, filtre, siralama]);

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
        onSubmit={(metin) => setUygulananArama(metin)}
        onFiltreBas={() => setPanelAcik(true)}
        aktifFiltre={aktifFiltreSayisi(filtre)}
      />

      <SiralamaSeridi secili={siralama} onSec={setSiralama} />

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
          ListEmptyComponent={
            <Text style={styles.bosYazi}>
              {aktifFiltreSayisi(filtre) > 0
                ? 'Seçtiğin filtrelere uyan ürün yok. Filtreleri gevşetmeyi dene.'
                : 'Bu kategoride ürün bulunamadı.'}
            </Text>
          }
        />
      )}

      {/*
        ⚠️ kategoriId veriliyor: panel bunu görünce kategori
        bölümünü hiç çizmiyor. Müşteri zaten bir kategorinin
        içinde; ikinci bir kategori seçimi sunmak "Kitap"
        başlığının altında ayakkabı listelemek olurdu.
      */}
      <FiltrePaneli
        acik={panelAcik}
        filtre={filtre}
        kategoriId={kategoriId}
        arama={uygulananArama}
        onKapat={() => setPanelAcik(false)}
        onUygula={(yeni) => { setFiltre(yeni); setPanelAcik(false); }}
      />
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
    padding: bosluk.orta,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },
  geriButon: {
    marginRight: bosluk.orta,
  },
  ustBaslik: {
    flex: 1,
    fontSize: yazi.buyuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.buyuk,
    color: renkler.yaziKoyu,
  },
  cark: {
    marginTop: bosluk.dev,
  },
  liste: {
    padding: bosluk.kucuk,
  },
  satir: {
    justifyContent: 'space-between',
  },
  bosYazi: {
    textAlign: 'center',
    marginTop: bosluk.dev,
    marginHorizontal: bosluk.genis,
    color: renkler.yaziGri,
    fontSize: yazi.orta,
    lineHeight: satir.orta,
  },
});
