import React, { useState, useEffect } from 'react';
import { font } from '../theme/olculer';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { kategoriIkonu } from '../services/kategoriIkon';
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
        {/* ⭐ DEĞİŞTİ (4.7) — emoji yerine ikon.

            İkon bir daire içinde duruyor: emoji kendi "gövdesini"
            taşıyordu (renkli, dolu bir şekil), çizgi ikon ise sadece
            bir kontur. Zeminsiz bıraksaydık kart boşalmış görünürdü.

            Renk anaRenk: kategori ikonu dekorasyon değil, kartın ne
            hakkında olduğunu söyleyen bilgi. */}
        <View style={styles.ikonDaire}>
          <Ionicons
            name={kategoriIkonu(item.name)}
            size={24}
            color={renkler.anaRenk}
          />
        </View>

        <View>
          <Text style={styles.kategoriAd} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.urunSayisi}>{item.productCount} ürün</Text>
        </View>
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
    fontFamily: font.kalin,
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
  /* ⭐ DEĞİŞTİ (4.7) — "emoji" stili yerine ikon dairesi.

     ⚠️ Eski hali sadece fontSize: 36 idi; emoji kendi rengini ve
     şeklini taşıdığı için başka bir şeye ihtiyacı yoktu. Çizgi ikon
     ise şeffaf bir kontur — arkasına yumuşak bir daire koymazsak
     kartta yüzer gibi durur ve görsel ağırlığı kaybolur.

     ⚠️ 42px, 48 değil: kart yüksekliği SABİT (110) ve içerik
     space-between ile dağılıyor. Eski emoji 36px puntoyla ~43px
     yer kaplıyordu; daireyi 48 yapsaydık kart taşardı. */
  ikonDaire: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: renkler.yumusakVurgu,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kategoriAd: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },
  urunSayisi: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginTop: 2
  },
  bosYazi: {
    textAlign: 'center',
    marginTop: 40,
    color: renkler.yaziGri,
    fontSize: 16,
  },
});