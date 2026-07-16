import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';

export default function OdemelerimEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [odemeler, setOdemeler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    async function getir() {
      try {
        const veri = await apiGet('/payments');
        setOdemeler(veri);
      } catch (hata) {
        console.log('Ödemeler alınamadı:', hata.message);
      } finally {
        setYukleniyor(false);
      }
    }
    getir();
  }, []);

  // Basit özet: başarılı ödemeler toplamı ve iade toplamı
  const toplamOdenen = odemeler
    .filter((o) => o.status === 'basarili')
    .reduce((t, o) => t + o.amount, 0);

  const toplamIade = odemeler
    .filter((o) => o.status === 'iade')
    .reduce((t, o) => t + o.amount, 0);

  function odemeSatiri({ item }) {
    const iade = item.status === 'iade';
    const renk = iade ? '#8e44ad' : renkler.basari;   // iade mor, başarılı yeşil

    return (
      <TouchableOpacity
        style={styles.kart}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SiparisDetay', { siparisId: item.orderId })}
      >
        <View style={styles.kartUst}>
          <Text style={styles.siparisNo}>Sipariş #{item.orderId}</Text>
          <Text style={[styles.tutar, { color: renk }]}>
            {iade ? '- ' : ''}{paraBicimle(item.amount)}
          </Text>
        </View>

        <Text style={styles.tarih}>{tarihBicimle(item.paidAt)}</Text>

        <View style={styles.altSatir}>
          <View style={[styles.rozet, { borderColor: renk }]}>
            <Text style={[styles.rozetYazi, { color: renk }]}>
              {iade ? 'İade Edildi' : 'Başarılı'}
            </Text>
          </View>
          <Text style={styles.kartBilgi}>**** {item.cardLast4}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>Ödemelerim</Text>
      </View>

      {yukleniyor ? (
        <View style={styles.ortala}>
          <ActivityIndicator size="large" color={renkler.anaRenk} />
        </View>
      ) : odemeler.length === 0 ? (
        <View style={styles.ortala}>
          <Ionicons name="card-outline" size={64} color={renkler.yaziGri} />
          <Text style={styles.bosYazi}>Henüz ödeme geçmişin yok.</Text>
        </View>
      ) : (
        <FlatList
          data={odemeler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={odemeSatiri}
          contentContainerStyle={styles.liste}
          ListHeaderComponent={
            <View style={styles.ozet}>
              <View style={styles.ozetKutu}>
                <Text style={styles.ozetEtiket}>Toplam Ödenen</Text>
                <Text style={styles.ozetDeger}>{paraBicimle(toplamOdenen)}</Text>
              </View>

              {toplamIade > 0 && (
                <View style={styles.ozetKutu}>
                  <Text style={styles.ozetEtiket}>İade Edilen</Text>
                  <Text style={[styles.ozetDeger, { color: '#8e44ad' }]}>
                    {paraBicimle(toplamIade)}
                  </Text>
                </View>
              )}
            </View>
          }
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
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik
  },
  geriButon: {
    marginRight: 12
  },
  ustBaslik: {
    fontSize: 18,
    fontWeight: '600',
    color: renkler.yaziKoyu
  },
  liste: {
    padding: 12
  },
  ozet: {
    flexDirection: 'row',
    marginBottom: 6
  },
  ozetKutu: {
    flex: 1,
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14,
    marginRight: 10
  },
  ozetEtiket: {
    fontSize: 13,
    color: renkler.yaziOrta,
    marginBottom: 4
  },
  ozetDeger: {
    fontSize: 18,
    fontWeight: 'bold',
    color: renkler.anaRenk
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
    fontWeight: 'bold'
  },
  tarih: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginBottom: 10
  },
  altSatir: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rozet: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1
  },
  rozetYazi: {
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