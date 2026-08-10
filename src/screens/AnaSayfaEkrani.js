import React, { useState, useEffect } from 'react';
import { Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiGet } from '../services/api';
import { useFavorite } from '../context/FavoriteContext';
import { useTema } from '../context/TemaContext';
import { bosluk, yazi, satir } from '../theme/olculer';
import {
  bosFiltre, varsayilanSiralama, filtreSorgusuKur, aktifFiltreSayisi,
} from '../services/urunFiltresi';
import AramaCubugu from '../components/AramaCubugu';
import UrunKarti from '../components/UrunKarti';
import SiralamaSeridi from '../components/SiralamaSeridi';
import FiltrePaneli from '../components/FiltrePaneli';

export default function AnaSayfaEkrani({ navigation }) {
  const { favoriIdler } = useFavorite();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  // ⭐ YENİ (6.3)
  const [filtre, setFiltre] = useState(bosFiltre);
  const [siralama, setSiralama] = useState(varsayilanSiralama);
  const [panelAcik, setPanelAcik] = useState(false);

  // ⚠️ Arama metni state'te AYRICA tutuluyor çünkü AramaCubugu
  // canlı arama yapıyor (400 ms gecikmeli) ve filtre/sıralama
  // değişince aynı aramanın korunması gerekiyor. Bu olmadan
  // sıralamayı değiştiren müşterinin araması silinirdi.
  const [uygulananArama, setUygulananArama] = useState('');

  async function urunleriGetir(arama, aktifFiltre, aktifSiralama) {
    try {
      setYukleniyor(true);

      const yol = '/products' + filtreSorgusuKur(aktifFiltre, {
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

  // ⚠️ TEK EFEKT, ÜÇ TETİKLEYİCİ. Arama, filtre ve sıralama için
  // ayrı efektler yazsaydık ikisi aynı anda değiştiğinde iki
  // istek birden giderdi ve hangisinin cevabı sonra dönerse ekran
  // ona göre kalırdı. Tek efekt, her değişiklikte tek istek.
  useEffect(() => {
    urunleriGetir(uygulananArama, filtre, siralama);
  }, [uygulananArama, filtre, siralama]);

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <AramaCubugu
        value={aramaMetni}
        onChangeText={setAramaMetni}
        onSubmit={(metin) => setUygulananArama(metin)}
        onMenuBas={() => navigation.navigate('Kategoriler')}
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
                : 'Ürün bulunamadı.'}
            </Text>
          }
        />
      )}

      <FiltrePaneli
        acik={panelAcik}
        filtre={filtre}
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
