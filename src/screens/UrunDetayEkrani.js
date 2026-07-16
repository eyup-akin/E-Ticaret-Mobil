import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useFavorite } from '../context/FavoriteContext';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';
import { useAuth } from '../context/AuthContext';
import { paraBicimle } from '../utils/bicimlendir';
import UrunGaleri from '../components/UrunGaleri';
import YorumBolumu from '../components/YorumBolumu';
import Yildizlar from '../components/Yildizlar';

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

  async function urunuGetir(sessiz = false) {
    try {
      if (!sessiz) setYukleniyor(true);
      const veri = await apiGet('/products/' + urunId);
      setUrun(veri);
    } catch (hata) {
      Alert.alert('Hata', 'Ürün yüklenemedi: ' + hata.message);
    } finally {
      if (!sessiz) setYukleniyor(false);
    }
  }

  useEffect(() => { urunuGetir(); }, [urunId]);

  async function sepeteEkleButonu() {
    if (!token) { navigation.navigate('Giris'); return; }
    try {
      setIslemde(true);
      await sepeteEkle(urun.id, 1);
      setEklendi(true);
      setTimeout(() => setEklendi(false), 2000);
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setIslemde(false);
    }
  }

  function favoriBasildi() {
    if (!token) { navigation.navigate('Giris'); return; }
    favoriDegistir(urun.id);
  }

  if (yukleniyor) {
    return <View style={styles.ortala}><ActivityIndicator size="large" color={renkler.anaRenk} /></View>;
  }
  if (!urun) {
    return <View style={styles.ortala}><Text style={styles.bosYazi}>Ürün bulunamadı.</Text></View>;
  }

  const favori = favoriMi(urun.id);

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      {/* ÜST BAR */}
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik} numberOfLines={1}>Ürün Detayı</Text>
      </View>

      <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
        {/* GALERİ + FAVORİ KALBİ */}
        <UrunGaleri
          resimler={urun.images || []}
          urunAdi={urun.name}
          favori={favori}
          onKalp={favoriBasildi}
          favoriRenk={renkler.favoriRenk}
        />

        {/* BİLGİ KARTI */}
        <View style={styles.bilgiKart}>
          <Text style={styles.urunAd}>{urun.name}</Text>

          {urun.reviewCount > 0 && (
            <View style={styles.ortalamaSatir}>
              <Yildizlar deger={urun.averageRating} boyut={16} />
              <Text style={styles.ortalamaYazi}>{Number(urun.averageRating).toFixed(1)}</Text>
            </View>
          )}

          {/* META: kaç değerlendirme · kaç favoride */}
          <View style={styles.metaSatir}>
            <View style={styles.metaOge}>
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={renkler.yaziGri} />
              <Text style={styles.metaYazi}>{urun.reviewCount} değerlendirme</Text>
            </View>
            <View style={styles.metaNokta} />
            <View style={styles.metaOge}>
              <Ionicons name="heart-outline" size={15} color={renkler.yaziGri} />
              <Text style={styles.metaYazi}>{urun.favoriteCount || 0} favoride</Text>
            </View>
          </View>

          <Text style={urun.stock > 0 ? styles.stokVar : styles.stokYok}>
            {urun.stock > 0 ? 'Stokta ' + urun.stock + ' adet var' : 'Tükendi'}
          </Text>
        </View>

        {/* YORUMLAR */}
        <View style={styles.yorumKart}>
          <YorumBolumu urunId={urunId} onDegisti={() => urunuGetir(true)} />
        </View>
      </ScrollView>

      {/* ALT BAR: FİYAT + SEPETE EKLE */}
      <View style={styles.altBar}>
        <View style={styles.fiyatKutu}>
          <Text style={styles.fiyatEtiket}>Fiyat</Text>
          <Text style={styles.fiyat}>{paraBicimle(urun.price)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.sepetButon, urun.stock === 0 && styles.sepetButonPasif, eklendi && styles.sepetButonEklendi]}
          onPress={sepeteEkleButonu}
          disabled={islemde || urun.stock === 0 || eklendi}
        >
          {islemde ? (
            <ActivityIndicator color={renkler.anaRenkUstuYazi} />
          ) : eklendi ? (
            <View style={styles.eklendiKutu}>
              <Ionicons name="checkmark" size={20} color={renkler.anaRenkUstuYazi} />
              <Text style={styles.sepetYazi}>  Eklendi</Text>
            </View>
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color={renkler.anaRenkUstuYazi} />
              <Text style={styles.sepetYazi}>  {urun.stock === 0 ? 'Stokta Yok' : 'Sepete Ekle'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: renkler.arkaPlan },
  ortala: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: renkler.arkaPlan },
  bosYazi: { fontSize: 16, color: renkler.yaziGri },
  ustBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: renkler.kenarlik },
  geriButon: { marginRight: 12 },
  ustBaslik: { fontSize: 18, fontWeight: '600', color: renkler.yaziKoyu },
  icerik: { paddingBottom: 24 },

  bilgiKart: {
    backgroundColor: renkler.kartArka,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },
  urunAd: { fontSize: 22, fontWeight: 'bold', color: renkler.yaziKoyu, marginBottom: 8 },
  ortalamaSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ortalamaYazi: { fontSize: 15, fontWeight: '700', color: renkler.yaziKoyu, marginLeft: 6 },

  metaSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaOge: { flexDirection: 'row', alignItems: 'center' },
  metaYazi: { fontSize: 13, color: renkler.yaziGri, marginLeft: 5 },
  metaNokta: { width: 3, height: 3, borderRadius: 2, backgroundColor: renkler.yaziGri, marginHorizontal: 10 },

  stokVar: { fontSize: 15, color: renkler.basari, fontWeight: '600' },
  stokYok: { fontSize: 15, color: renkler.yaziGri, fontWeight: '600' },

  yorumKart: {
    backgroundColor: renkler.kartArka,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },

  altBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },
  fiyatKutu: { marginRight: 14 },
  fiyatEtiket: { fontSize: 12, color: renkler.yaziGri },
  fiyat: { fontSize: 20, fontWeight: 'bold', color: renkler.anaRenk },
  sepetButon: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: renkler.anaRenk,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sepetButonPasif: { backgroundColor: renkler.pasif },
  sepetButonEklendi: { backgroundColor: renkler.basari },
  eklendiKutu: { flexDirection: 'row', alignItems: 'center' },
  sepetYazi: { color: renkler.anaRenkUstuYazi, fontSize: 16, fontWeight: 'bold' },
});