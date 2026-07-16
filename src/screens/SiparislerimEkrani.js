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
import { durumYazisi, durumRengi, odemeYazisi, odemeRengi } from '../utils/durum';   // ⭐
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';                     // ⭐

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

  const filtreliSiparisler = aramaMetni
    ? siparisler.filter((s) => {
        const kelime = aramaMetni.toLowerCase();
        const noEslesme = String(s.id).includes(kelime.replace('#', ''));
        const urunEslesme = s.items.some((u) => u.productName.toLowerCase().includes(kelime));
        return noEslesme || urunEslesme;
      })
    : siparisler;

  function siparisKarti({ item }) {
    const rozetR = durumRengi(item.status, renkler);
    const odemeR = odemeRengi(item.paymentStatus, renkler);

    const urunOzet = item.items.map((u) => u.productName + ' × ' + u.quantity).join(', ');

    const odemeIkon =
      item.paymentStatus === 'odendi' ? 'checkmark-circle'
      : item.paymentStatus === 'iade_edildi' ? 'arrow-undo-outline'
      : 'time-outline';

    return (
      <TouchableOpacity
        style={styles.kart}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SiparisDetay', { siparisId: item.id })}
      >
        <View style={styles.kartUst}>
          <Text style={styles.siparisNo}>Sipariş #{item.id}</Text>
          <Text style={styles.tutar}>{paraBicimle(item.total)}</Text>
        </View>

        <Text style={styles.tarih}>{tarihBicimle(item.createdAt)}</Text>

        <Text style={styles.urunOzet} numberOfLines={2}>{urunOzet}</Text>

        <View style={styles.rozetler}>
          <View style={[styles.rozet, { backgroundColor: rozetR }]}>
            <Text style={styles.rozetYazi}>{durumYazisi(item.status)}</Text>
          </View>

          <View style={[styles.rozetOdeme, { borderColor: odemeR }]}>
            <Ionicons name={odemeIkon} size={13} color={odemeR} />
            <Text style={[styles.rozetOdemeYazi, { color: odemeR }]}>  {odemeYazisi(item.paymentStatus)}</Text>
          </View>

          <Text style={styles.kartBilgi}>**** {item.cardLast4}</Text>
        </View>
      </TouchableOpacity>
    );
  }

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
    return <View style={styles.ortala}><ActivityIndicator size="large" color={renkler.anaRenk} /></View>;
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
          ListEmptyComponent={<Text style={styles.bosYazi}>Eşleşen sipariş bulunamadı.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan
  },
  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: renkler.arkaPlan
  },
  baslik: {
    fontSize: 24,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  liste: {
    padding: 12
  },
  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: renkler.kenarlik
  },
  kartUst: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  siparisNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: renkler.yaziKoyu
  },
  tutar: {
    fontSize: 17,
    fontWeight: 'bold',
    color: renkler.anaRenk
  },
  tarih: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginBottom: 8  // ⭐ yeni
  },
  urunOzet: {
    fontSize: 13,
    color: renkler.yaziOrta,
    marginBottom: 10
  },
  rozetler: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rozet: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8
  },
  rozetYazi: {
    fontSize: 12,
    fontWeight: '600',
    color: renkler.anaRenkUstuYazi
  },
  rozetOdeme: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1
  },
  rozetOdemeYazi: {
    fontSize: 12,
    fontWeight: '600'
  },
  kartBilgi: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginLeft: 'auto'
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri,
    marginTop: 12,
    textAlign: 'center'
  }
});