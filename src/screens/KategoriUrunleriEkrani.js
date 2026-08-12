import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { bosluk, yazi, agirlik, satir, font } from '../theme/olculer';
import {
  bosFiltre, varsayilanSiralama, filtreSorgusuKur, aktifFiltreSayisi,
} from '../services/urunFiltresi';
import AramaCubugu from '../components/AramaCubugu';
import UrunKarti from '../components/UrunKarti';
import SiralamaSeridi from '../components/SiralamaSeridi';
import FiltrePaneli from '../components/FiltrePaneli';
import BosDurum from '../components/BosDurum';
import { UrunIzgarasiIskeleti } from '../components/Iskelet';

export default function KategoriUrunleriEkrani({ route, navigation }) {
  // Kategoriler ekranından gelen bilgiler
  const { kategoriId, kategoriAdi, baslangicArama } = route.params;
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // ⭐ YENİ (GV/Faz 9.4) — bkz. AnaSayfaEkrani'ndaki gerekçe:
  // "boş kategori" ile "bağlanamadık" ayrı durumlar.
  const [agHatasi, setAgHatasi] = useState(false);
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
      setAgHatasi(false);
    } catch (hata) {
      console.log('Ürünler alınamadı:', hata.message);
      setUrunler([]);
      setAgHatasi(true);
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    urunleriGetir(uygulananArama, filtre, siralama);
  }, [kategoriId, uygulananArama, filtre, siralama]);

  // ⭐ YENİ (GV/Faz 2.1) — satır çizici sabitlendi.
  // Gerekçe AnaSayfaEkrani'nda yazılı: satır içi ok fonksiyonu her
  // render'da yeni prop üretir ve UrunKarti'daki React.memo'yu
  // işlevsiz bırakırdı.
  const kartCiz = useCallback(
    ({ item }) => (
      <UrunKarti
        urun={item}
        onPress={() => navigation.navigate('UrunDetay', { urunId: item.id })}
      />
    ),
    [navigation]
  );

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
        /* ⭐ DEĞİŞTİ (GV/Faz 9.1) — çark yerine ızgara iskeleti. */
        <UrunIzgarasiIskeleti />
      ) : (
        <FlatList
          data={urunler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={kartCiz}
          numColumns={2}
          columnWrapperStyle={styles.satir}
          contentContainerStyle={styles.liste}
          /* ⭐ DEĞİŞTİ (GV/Faz 9.3/9.4) — üç durum, üç cevap.
             Ana sayfadaki ayrımın aynısı; ikisi aynı soruyu
             cevapladığı için aynı dili konuşmaları gerekiyor. */
          ListEmptyComponent={
            agHatasi ? (
              <BosDurum
                ikon="cloud-offline-outline"
                baslik="Bağlanamadık"
                aciklama="Ürünler yüklenemedi. İnternet bağlantını kontrol edip tekrar dene."
                eylemYazisi="Tekrar Dene"
                onEylem={() => urunleriGetir(uygulananArama, filtre, siralama)}
              />
            ) : aktifFiltreSayisi(filtre) > 0 ? (
              <BosDurum
                ikon="funnel-outline"
                baslik="Sonuç bulunamadı"
                aciklama="Seçtiğin filtrelere uyan ürün yok. Filtreleri gevşetmeyi dene."
                eylemYazisi="Filtreleri Temizle"
                onEylem={() => setFiltre(bosFiltre)}
              />
            ) : (
              <BosDurum
                ikon="search-outline"
                baslik="Bu kategoride ürün yok"
                aciklama={
                  uygulananArama
                    ? 'Aramana uyan bir ürün bulunamadı. Farklı kelimelerle dene.'
                    : 'Bu kategoriye henüz ürün eklenmemiş.'
                }
              />
            )
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
  liste: {
    padding: bosluk.kucuk,
  },
  satir: {
    justifyContent: 'space-between',
  },
});
