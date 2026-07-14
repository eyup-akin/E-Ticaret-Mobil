import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';

import { useAuth } from '../context/AuthContext';
import GirisGerekliEkrani from '../components/GirisGerekliEkrani';

import AramaCubugu from '../components/AramaCubugu';

// Backend'deki kod adlarını okunabilir yazıya çevirir
function durumYazisi(kod) {
  if (kod === 'hazirlaniyor') return 'Hazırlanıyor';
  if (kod === 'kargoda') return 'Kargoda';
  if (kod === 'teslim') return 'Teslim Edildi';
  return kod;
}

function odemeYazisi(kod) {
  if (kod === 'odendi') return 'Ödendi';
  if (kod === 'beklemede') return 'Beklemede';
  return kod;
}

export default function SiparislerimEkrani({ navigation }) {
  
  const { token } = useAuth();
  
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [siparisler, setSiparisler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  async function siparisleriGetir() {
    try {
      const veri = await apiGet('/orders');
      setSiparisler(veri);
    } catch (hata) {
      console.log('Siparişler alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      siparisleriGetir();
    }, [token])
  );

  // Arama: hem sipariş NUMARASINA hem içindeki ÜRÜN ADINA bakar
  const filtreliSiparisler = aramaMetni
    ? siparisler.filter((s) => {
        const kelime = aramaMetni.toLowerCase();

        // Sipariş no eşleşmesi ("12" veya "#12" yazabilir)
        const noEslesme = String(s.id).includes(kelime.replace('#', ''));

        // İçindeki ürünlerden biri eşleşiyor mu?
        const urunEslesme = s.items.some((u) =>
          u.productName.toLowerCase().includes(kelime)
        );

        return noEslesme || urunEslesme;
      })
    : siparisler;

  function siparisKarti({ item }) {
    // Kargo durumuna göre rozet rengi
    const durumRengi =
      item.status === 'teslim' ? renkler.basari
      : item.status === 'kargoda' ? renkler.anaRenk
      : renkler.yaziOrta;

    // Ürün adlarını kısa özet halinde göster
    const urunOzet = item.items
      .map((u) => u.productName + ' × ' + u.quantity)
      .join(', ');

    return (
      <TouchableOpacity
        style={styles.kart}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SiparisDetay', { siparisId: item.id })}
      >
        <View style={styles.kartUst}>
          <Text style={styles.siparisNo}>Sipariş #{item.id}</Text>
          <Text style={styles.tutar}>{item.total.toFixed(2)} ₺</Text>
        </View>

        <Text style={styles.urunOzet} numberOfLines={2}>{urunOzet}</Text>

        <View style={styles.rozetler}>
          <View style={[styles.rozet, { backgroundColor: durumRengi }]}>
            <Text style={styles.rozetYazi}>{durumYazisi(item.status)}</Text>
          </View>

          <View style={[styles.rozet, styles.rozetOdeme]}>
            <Ionicons
              name={item.paymentStatus === 'odendi' ? 'checkmark-circle' : 'time-outline'}
              size={13}
              color={renkler.basari}
            />
            <Text style={styles.rozetOdemeYazi}>  {odemeYazisi(item.paymentStatus)}</Text>
          </View>

          <Text style={styles.kartBilgi}>**** {item.cardLast4}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // 🔒 MİSAFİR KAPISI
  if (!token) {
    return (
      <GirisGerekliEkrani
        ikon="receipt-outline"
        baslik="Siparişlerini görmek için giriş yap"
        aciklama="Verdiğin siparişleri ve kargo durumlarını buradan takip edebilirsin."
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
      <Text style={styles.baslik}>Siparişlerim</Text>

      {siparisler.length > 0 && (
        <AramaCubugu
          value={aramaMetni}
          onChangeText={setAramaMetni}
          onSubmit={() => {}}
          placeholder="Sipariş no veya ürün ara..."
        />
      )}

      {siparisler.length === 0 ? (
        <View style={styles.ortala}>
          <Ionicons name="receipt-outline" size={64} color={renkler.yaziGri} />
          <Text style={styles.bosYazi}>Henüz siparişin yok.</Text>
        </View>
      ) : (
        <FlatList
          data={filtreliSiparisler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={siparisKarti}
          contentContainerStyle={styles.liste}
          ListEmptyComponent={
            <Text style={styles.bosYazi}>Eşleşen sipariş bulunamadı.</Text>
          }
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
    padding: 12,
  },
  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },
  kartUst: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  siparisNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
  },
  tutar: {
    fontSize: 17,
    fontWeight: 'bold',
    color: renkler.anaRenk,
  },
  urunOzet: {
    fontSize: 13,
    color: renkler.yaziOrta,
    marginBottom: 10,
  },
  rozetler: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rozet: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  rozetYazi: {
    fontSize: 12,
    fontWeight: '600',
    color: renkler.anaRenkUstuYazi,
  },
  rozetOdeme: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: renkler.basari,
  },
  rozetOdemeYazi: {
    fontSize: 12,
    fontWeight: '600',
    color: renkler.basari,
  },
  kartBilgi: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginLeft: 'auto',
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri,
    marginTop: 12,
    textAlign: 'center',
  },
});