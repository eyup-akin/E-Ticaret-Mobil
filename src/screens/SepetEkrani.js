import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';

import { useAuth } from '../context/AuthContext';
import GirisGerekliEkrani from '../components/GirisGerekliEkrani';

import AramaCubugu from '../components/AramaCubugu';
import SepetSatiri from '../components/SepetSatiri';

export default function SepetEkrani({ navigation }) {
  
  const { token } = useAuth();
  
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const { sepet, yukleniyor, toplamTutar, sepetiYukle, adetGuncelle, sepettenCikar } = useSepet();
  const [aramaMetni, setAramaMetni] = useState('');

  // Ekran her odağa geldiğinde sepeti yenile
  useFocusEffect(
    useCallback(() => {
      // Misafirse veri çekme — 401 hatası basmasın
      if (!token) return;
      sepetiYukle();
    }, [token])
  );

  // Silmeden önce onay sor
  function silmeyiOnayla(item) {
    Alert.alert(
      'Sepetten çıkar',
      `"${item.productName}" sepetten çıkarılsın mı?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Çıkar', style: 'destructive', onPress: () => sepettenCikar(item) },
      ]
    );
  }

  // Arama sadece GÖRÜNÜMÜ süzer, toplamı etkilemez
  const filtreliSepet = aramaMetni
    ? sepet.filter((s) => s.productName.toLowerCase().includes(aramaMetni.toLowerCase()))
    : sepet;


  // 🔒 MİSAFİR KAPISI — tüm hook'lardan SONRA, ilk return'den ÖNCE
  if (!token) {
    return (
      <GirisGerekliEkrani
        ikon="cart-outline"
        baslik="Sepetini görmek için giriş yap"
        aciklama="Sepetine ürün ekleyip kolayca sipariş verebilirsin."
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
      <Text style={styles.baslik}>Sepetim</Text>

      {sepet.length > 0 && (
        <AramaCubugu
          value={aramaMetni}
          onChangeText={setAramaMetni}
          onSubmit={() => {}}
          placeholder="Sepette ara..."
        />
      )}

      {sepet.length === 0 ? (
        <View style={styles.ortala}>
          <Ionicons name="cart-outline" size={64} color={renkler.yaziGri} />
          <Text style={styles.bosYazi}>Sepetin boş.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filtreliSepet}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <SepetSatiri
                item={item}
                onAdetDegistir={adetGuncelle}
                onSil={silmeyiOnayla}
              />
            )}
            contentContainerStyle={styles.liste}
            ListEmptyComponent={
              <Text style={styles.bosYazi}>Sepetinde eşleşen ürün yok.</Text>
            }
          />

          <View style={styles.altBar}>
            <View>
              <Text style={styles.toplamEtiket}>Toplam</Text>
              <Text style={styles.toplamTutar}>{toplamTutar.toFixed(2)} ₺</Text>
            </View>

            <TouchableOpacity
              style={styles.siparisButon}
              onPress={() => navigation.navigate('AdresSec', { siparisAkisi: true })}
            >
              <Text style={styles.siparisYazi}>Sipariş Ver</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  baslik: {
    fontSize: 24,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  liste: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri,
    marginTop: 12,
    textAlign: 'center',
  },
  altBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },
  toplamEtiket: {
    fontSize: 13,
    color: renkler.yaziOrta,
  },
  toplamTutar: {
    fontSize: 22,
    fontWeight: 'bold',
    color: renkler.anaRenk,
  },
  siparisButon: {
    backgroundColor: renkler.anaRenk,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  siparisYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
});