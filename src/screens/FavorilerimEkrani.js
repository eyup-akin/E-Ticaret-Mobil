import React, { useState, useCallback } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
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
import BosDurum from '../components/BosDurum';
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
        <View style={styles.aramaYeri}>
          <AramaCubugu
            value={aramaMetni}
            onChangeText={setAramaMetni}
            onSubmit={() => {}}
            placeholder="Favorilerimde ara..."
          />
        </View>
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
          /* ⭐ DEĞİŞTİ (GV/Faz 7.8) — boş durum ortak bileşene geçti.

             ⚠️ İKİ FARKLI BOŞLUK, İKİ FARKLI CEVAP. Hiç favori yoksa
             müşteriyi ürünlere yolluyoruz; arama sonuç vermediyse
             gidilecek bir yer yok, sadece aramayı değiştirmesi gerek —
             o yüzden orada eylem butonu çizilmiyor. Tek bir metin
             göstermek ikisini aynı şey sanmak olurdu. */
          favoriler.length === 0 ? (
            <BosDurum
              ikon="heart-outline"
              baslik="Henüz favorin yok"
              aciklama="Beğendiğin ürünlerin kalbine dokun, hepsi burada toplansın."
              eylemYazisi="Ürünlere Göz At"
              onEylem={() => navigation.navigate('AnaSayfa', { screen: 'AnaSayfaMain' })}
            />
          ) : (
            <BosDurum
              ikon="search-outline"
              baslik="Eşleşen ürün bulunamadı"
              aciklama="Farklı bir kelimeyle aramayı deneyebilirsin."
            />
          )
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

  /* ⚠️ Geri oku YALNIZCA stack içinden gelindiğinde çiziliyor
     (canGoBack). Favorilerim hem bir sekme kökü hem de Hesabım
     menüsünden açılan bir alt ekran — G2 sekme kökünde geri oku
     istemiyor, alt ekranda ise gerekiyor. Koşul ikisini de doğru
     yapıyor. */
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    paddingHorizontal: sayfaKenari,
    paddingVertical: bosluk.orta,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  geriButon: {
    width: 32,
  },

  ustBaslik: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  aramaYeri: {
    paddingHorizontal: sayfaKenari,
    paddingTop: bosluk.orta,
  },

  liste: {
    padding: sayfaKenari,
    flexGrow: 1,
  },

  satir: {
    justifyContent: 'space-between',
  },
});
