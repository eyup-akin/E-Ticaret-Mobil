import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { durumYazisi, odemeYazisi, odemeRengi } from '../utils/durum';        // ⭐
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';             // ⭐

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
    return <View style={styles.ortala}><ActivityIndicator size="large" color={renkler.anaRenk} /></View>;
  }
  if (!siparis) {
    return <View style={styles.ortala}><Text style={styles.bosYazi}>Sipariş bulunamadı.</Text></View>;
  }

  const iptalMi = siparis.status === 'iptal';
  const asamalar = ['hazirlaniyor', 'kargoda', 'teslim_edildi'];   // ⭐ teslim → teslim_edildi
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
        <Text style={styles.tarih}>Sipariş tarihi: {tarihBicimle(siparis.createdAt)}</Text>

        {/* İPTAL KUTUSU veya KARGO DURUMU */}
        {iptalMi ? (
          <View style={styles.bolum}>
            <View style={styles.iptalKutu}>
              <View style={styles.iptalUst}>
                <Ionicons name="close-circle" size={22} color="#e74c3c" />
                <Text style={styles.iptalBaslik}>  Sipariş İptal Edildi</Text>
              </View>
              {siparis.cancelledAt ? (
                <Text style={styles.iptalTarih}>{tarihBicimle(siparis.cancelledAt)}</Text>
              ) : null}
              {siparis.cancelReason ? (
                <Text style={styles.iptalSebep}>Sebep: {siparis.cancelReason}</Text>
              ) : null}
              <Text style={styles.iptalIade}>Ödemeniz iade edildi.</Text>
            </View>
          </View>
        ) : (
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
        )}

        {/* ÖDEME */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ödeme</Text>
          <View style={styles.kutu}>
            <View style={styles.satir}>
              <Text style={styles.etiket}>Durum</Text>
              <Text style={[styles.deger, { color: odemeRengi(siparis.paymentStatus, renkler) }]}>
                {odemeYazisi(siparis.paymentStatus)}
              </Text>
            </View>
            <View style={styles.satir}>
              <Text style={styles.etiket}>Kart</Text>
              <Text style={styles.deger}>**** **** **** {siparis.cardLast4}</Text>
            </View>
          </View>
        </View>

        {/* ÜRÜNLER */}
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
                  <Text style={styles.urunBirim}>{paraBicimle(u.unitPrice)} × {u.quantity}</Text>
                </View>
                <Text style={styles.urunToplam}>{paraBicimle(u.unitPrice * u.quantity)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.altBar}>
        <Text style={styles.toplamEtiket}>Toplam</Text>
        <Text style={styles.toplamTutar}>{paraBicimle(siparis.total)}</Text>
      </View>
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
  icerik: {
    padding: 16
  },
  tarih: {
    fontSize: 13,
    color: renkler.yaziGri,
    marginBottom: 16  // ⭐ yeni
  },
  bolum: {
    marginBottom: 20
  },
  bolumBaslik: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 8
  },
  kutu: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14
  },

  // ⭐ iptal kutusu
  iptalKutu: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e74c3c'
  },
  iptalUst: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  iptalBaslik: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c'
  },
  iptalTarih: {
    fontSize: 13,
    color: renkler.yaziGri,
    marginBottom: 6
  },
  iptalSebep: {
    fontSize: 14,
    color: renkler.yaziKoyu,
    marginBottom: 6
  },
  iptalIade: {
    fontSize: 14,
    color: renkler.yaziOrta
  },

  asamaSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  asamaYazi: {
    fontSize: 15,
    color: renkler.yaziGri,
    marginLeft: 12
  },
  asamaYaziAktif: {
    color: renkler.yaziKoyu,
    fontWeight: '600'
  },
  satir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  etiket: {
    fontSize: 15,
    color: renkler.yaziOrta
  },
  deger: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri
  },
  urunSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  harfKutu: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  harfYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 18,
    fontWeight: 'bold'
  },
  urunOrta: {
    flex: 1
  },
  urunAd: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu
  },
  urunBirim: {
    fontSize: 13,
    color: renkler.yaziOrta,
    marginTop: 2
  },
  urunToplam: {
    fontSize: 15,
    fontWeight: 'bold',
    color: renkler.yaziKoyu
  },
  altBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka
  },
  toplamEtiket: {
    fontSize: 15,
    color: renkler.yaziOrta
  },
  toplamTutar: {
    fontSize: 24,
    fontWeight: 'bold',
    color: renkler.anaRenk
  }
});