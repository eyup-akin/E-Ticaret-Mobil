import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useFavorite } from '../context/FavoriteContext';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';

import { useAuth } from '../context/AuthContext';


export default function UrunDetayEkrani({ route, navigation }) {
  const { urunId } = route.params;
  const { favoriMi, favoriDegistir } = useFavorite();
  
  const { token } = useAuth();

  const { renkler } = useTema();
  const { sepeteEkle } = useSepet();
  const styles = stilOlustur(renkler);

  const [urun, setUrun] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemde, setIslemde] = useState(false);
  const [eklendi, setEklendi] = useState(false);

  useEffect(() => {
    async function urunuGetir() {
      try {
        const veri = await apiGet('/products/' + urunId);
        setUrun(veri);
      } catch (hata) {
        Alert.alert('Hata', 'Ürün yüklenemedi: ' + hata.message);
      } finally {
        setYukleniyor(false);
      }
    }
    urunuGetir();
  }, [urunId]);

  async function sepeteEkleButonu() {

    // 🚪 İŞLEM KAPISI — misafirse sepete ekleme, giriş modalını aç
    if (!token) {
      navigation.navigate('Giris');
      return;
    }

    try {
      setIslemde(true);
      await sepeteEkle(urun.id, 1);

      // Butonu 2 saniyeliğine "Eklendi" yap, sonra normale döndür
      setEklendi(true);
      setTimeout(() => setEklendi(false), 2000);
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setIslemde(false);
    }
  }

  // 🚪 İŞLEM KAPISI — favori kalbi
  function favoriBasildi() {
    if (!token) {
      navigation.navigate('Giris');
      return;
    }
    favoriDegistir(urun.id);
  }

  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  if (!urun) {
    return (
      <View style={styles.ortala}>
        <Text style={styles.bosYazi}>Ürün bulunamadı.</Text>
      </View>
    );
  }

  const favori = favoriMi(urun.id);

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik} numberOfLines={1}>Ürün Detayı</Text>
      </View>

      <ScrollView contentContainerStyle={styles.icerik}>
        <View style={styles.resimKutu}>
          <Text style={styles.resimYazi}>{urun.name.charAt(0)}</Text>
        </View>

        <Text style={styles.urunAd}>{urun.name}</Text>
        <Text style={styles.fiyat}>{urun.price} ₺</Text>

        <Text style={urun.stock > 0 ? styles.stokVar : styles.stokYok}>
          {urun.stock > 0 ? 'Stokta ' + urun.stock + ' adet var' : 'Tükendi'}
        </Text>
      </ScrollView>

      <View style={styles.altButonlar}>
        <TouchableOpacity
          style={styles.favoriButon}
          onPress={ favoriBasildi }
        >
          <Ionicons
            name={favori ? 'heart' : 'heart-outline'}
            size={26}
            color={favori ? renkler.favoriRenk : renkler.yaziGri}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sepetButon,
            urun.stock === 0 && styles.sepetButonPasif,
            eklendi && styles.sepetButonEklendi,
          ]}
          onPress={sepeteEkleButonu}
          disabled={islemde || urun.stock === 0 || eklendi}
        >
          {islemde ? (
            <ActivityIndicator color={renkler.anaRenkUstuYazi} />
          ) : eklendi ? (
            <View style={styles.eklendiKutu}>
              <Ionicons name="checkmark" size={20} color={renkler.anaRenkUstuYazi} />
              <Text style={styles.sepetYazi}>  Sepete Eklendi</Text>
            </View>
          ) : (
            <Text style={styles.sepetYazi}>
              {urun.stock === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  icerik: {
    padding: 16,
  },
  resimKutu: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resimYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 100,
    fontWeight: 'bold',
  },
  urunAd: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: renkler.yaziKoyu,
  },
  fiyat: {
    fontSize: 26,
    color: renkler.anaRenk,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stokVar: {
    fontSize: 15,
    color: renkler.basari,
  },
  stokYok: {
    fontSize: 15,
    color: renkler.yaziGri,
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri,
  },
  altButonlar: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
  },
  favoriButon: {
    width: 54,
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriButonDolu: {
    backgroundColor: renkler.anaRenk,
  },
  sepetButon: {
    flex: 1,
    height: 54,
    borderRadius: 8,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sepetButonPasif: {
    backgroundColor: renkler.pasif,
  },
  sepetButonEklendi: {
    backgroundColor: renkler.basari,
  },
  eklendiKutu: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sepetYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
});