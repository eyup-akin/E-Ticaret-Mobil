import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';

function durumYazisi(kod) {
  if (kod === 'hazirlaniyor') return 'Hazırlanıyor';
  if (kod === 'kargoda') return 'Kargoda';
  if (kod === 'teslim') return 'Teslim Edildi';
  return kod;
}

export default function SiparisDetayEkrani({ route, navigation }) {
  const { siparisId } = route.params;

  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [siparis, setSiparis] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    async function siparisiGetir() {
      try {
        const veri = await apiGet('/orders/' + siparisId);
        setSiparis(veri);
      } catch (hata) {
        console.log('Sipariş alınamadı:', hata.message);
      } finally {
        setYukleniyor(false);
      }
    }
    siparisiGetir();
  }, [siparisId]);

  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  if (!siparis) {
    return (
      <View style={styles.ortala}>
        <Text style={styles.bosYazi}>Sipariş bulunamadı.</Text>
      </View>
    );
  }

  const asamalar = ['hazirlaniyor', 'kargoda', 'teslim'];
  const suankiIndex = asamalar.indexOf(siparis.status);

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>Sipariş #{siparis.id}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.icerik}>
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Kargo Durumu</Text>
          <View style={styles.kutu}>
            {asamalar.map((asama, i) => {
              const gecti = i <= suankiIndex;
              return (
                <View key={asama} style={styles.asamaSatir}>
                  <Ionicons
                    name={gecti ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={gecti ? renkler.basari : renkler.yaziGri}
                  />
                  <Text style={[styles.asamaYazi, gecti && styles.asamaYaziAktif]}>
                    {durumYazisi(asama)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ödeme</Text>
          <View style={styles.kutu}>
            <View style={styles.satir}>
              <Text style={styles.etiket}>Durum</Text>
              <Text style={styles.degerBasari}>
                {siparis.paymentStatus === 'odendi' ? 'Ödendi' : 'Beklemede'}
              </Text>
            </View>
            <View style={styles.satir}>
              <Text style={styles.etiket}>Kart</Text>
              <Text style={styles.deger}>**** **** **** {siparis.cardLast4}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ürünler ({siparis.items.length})</Text>
          <View style={styles.kutu}>
            {siparis.items.map((u, i) => (
              <View key={i} style={styles.urunSatir}>
                <View style={styles.harfKutu}>
                  <Text style={styles.harfYazi}>{u.productName.charAt(0)}</Text>
                </View>

                <View style={styles.urunOrta}>
                  <Text style={styles.urunAd} numberOfLines={2}>{u.productName}</Text>
                  <Text style={styles.urunBirim}>
                    {u.unitPrice.toFixed(2)} ₺ × {u.quantity}
                  </Text>
                </View>

                <Text style={styles.urunToplam}>
                  {(u.unitPrice * u.quantity).toFixed(2)} ₺
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.altBar}>
        <Text style={styles.toplamEtiket}>Toplam</Text>
        <Text style={styles.toplamTutar}>{siparis.total.toFixed(2)} ₺</Text>
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
  bolum: {
    marginBottom: 20,
  },
  bolumBaslik: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 8,
  },
  kutu: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14,
  },
  asamaSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  asamaYazi: {
    fontSize: 15,
    color: renkler.yaziGri,
    marginLeft: 12,
  },
  asamaYaziAktif: {
    color: renkler.yaziKoyu,
    fontWeight: '600',
  },
  satir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  etiket: {
    fontSize: 15,
    color: renkler.yaziOrta,
  },
  deger: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  degerBasari: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.basari,
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri,
  },
  urunSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  harfKutu: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  harfYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 18,
    fontWeight: 'bold',
  },
  urunOrta: {
    flex: 1,
  },
  urunAd: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  urunBirim: {
    fontSize: 13,
    color: renkler.yaziOrta,
    marginTop: 2,
  },
  urunToplam: {
    fontSize: 15,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
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
    fontSize: 15,
    color: renkler.yaziOrta,
  },
  toplamTutar: {
    fontSize: 24,
    fontWeight: 'bold',
    color: renkler.anaRenk,
  },
});