import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';

export default function SiparisBasariliEkrani({ route, navigation }) {
  const { siparisId, siparisNo, toplam } = route.params;

  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.icerik}>
        <View style={styles.tikKutu}>
          <Ionicons name="checkmark" size={64} color={renkler.anaRenkUstuYazi} />
        </View>

        <Text style={styles.baslik}>Siparişin alındı!</Text>
        <Text style={styles.altYazi}>Ödemen başarıyla gerçekleşti.</Text>

        <View style={styles.kutu}>
          <View style={styles.kutuSatir}>
            <Text style={styles.etiket}>Sipariş No</Text>
            <Text style={styles.deger}>{siparisNo}</Text>
          </View>
          <View style={styles.kutuSatir}>
            <Text style={styles.etiket}>Tutar</Text>
            <Text style={styles.degerVurgu}>{Number(toplam).toFixed(2)} ₺</Text>
          </View>
          <View style={styles.kutuSatir}>
            <Text style={styles.etiket}>Durum</Text>
            <Text style={styles.deger}>Hazırlanıyor</Text>
          </View>
        </View>
      </View>

      <View style={styles.altBar}>
        <TouchableOpacity
          style={styles.siparisButon}
          onPress={() => navigation.navigate('Hesabim', { screen: 'Siparislerim' })}
        >
          <Text style={styles.siparisYazi}>Siparişlerime Git</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.anaButon}
          onPress={() => navigation.navigate('AnaSayfa')}
        >
          <Text style={styles.anaYazi}>Alışverişe Devam Et</Text>
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
  icerik: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tikKutu: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: renkler.basari,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  baslik: {
    fontSize: 26,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    marginBottom: 8,
  },
  altYazi: {
    fontSize: 15,
    color: renkler.yaziOrta,
    marginBottom: 32,
  },
  kutu: {
    width: '100%',
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 16,
  },
  kutuSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  degerVurgu: {
    fontSize: 17,
    fontWeight: 'bold',
    color: renkler.anaRenk,
  },
  altBar: {
    padding: 16,
  },
  siparisButon: {
    backgroundColor: renkler.anaRenk,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  siparisYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
  anaButon: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: renkler.inputKenar,
  },
  anaYazi: {
    color: renkler.yaziKoyu,
    fontSize: 16,
    fontWeight: '600',
  },
});