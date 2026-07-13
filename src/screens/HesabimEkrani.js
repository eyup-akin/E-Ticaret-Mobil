import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';

export default function HesabimEkrani({ navigation }) {
  const { kullanici, cikisYap } = useAuth();
  const { renkler, temaAdi, temaDegistir } = useTema();
  const styles = stilOlustur(renkler);

  function menuSatiri(ikon, baslik, hedef) {
    return (
      <TouchableOpacity
        style={styles.menuSatir}
        onPress={() => navigation.navigate(hedef)}
        activeOpacity={0.7}
      >
        <Ionicons name={ikon} size={22} color={renkler.anaRenk} />
        <Text style={styles.menuYazi}>{baslik}</Text>
        <Ionicons name="chevron-forward" size={20} color={renkler.yaziGri} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <ScrollView contentContainerStyle={styles.icerik}>
        <Text style={styles.baslik}>Hesabım</Text>

        <View style={styles.kart}>
          <Text style={styles.ad}>{kullanici?.fullName}</Text>
          <Text style={styles.rol}>Rol: {kullanici?.role}</Text>
        </View>

        {/* MENÜ */}
        <View style={styles.menu}>
          {menuSatiri('receipt-outline', 'Siparişlerim', 'Siparislerim')}
          {menuSatiri('location-outline', 'Adreslerim', 'Adreslerim')}
          {menuSatiri('card-outline', 'Kartlarım', 'Kartlarim')}
        </View>

        {/* GÖRÜNÜM */}
        <Text style={styles.bolumBaslik}>Görünüm</Text>
        <View style={styles.temaSatir}>
          <TouchableOpacity
            style={[styles.temaButon, temaAdi === 'acik' && styles.temaButonSecili]}
            onPress={() => temaDegistir('acik')}
          >
            <Text style={[styles.temaYazi, temaAdi === 'acik' && styles.temaYaziSecili]}>
              Açık
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.temaButon, temaAdi === 'koyu' && styles.temaButonSecili]}
            onPress={() => temaDegistir('koyu')}
          >
            <Text style={[styles.temaYazi, temaAdi === 'koyu' && styles.temaYaziSecili]}>
              Koyu
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cikisButon} onPress={cikisYap}>
          <Text style={styles.cikisYazi}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },
  icerik: {
    padding: 16,
  },
  baslik: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: renkler.yaziKoyu,
  },
  kart: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  ad: {
    fontSize: 18,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  rol: {
    fontSize: 15,
    color: renkler.yaziOrta,
    marginTop: 4,
  },
  menu: {
    marginBottom: 24,
  },
  menuSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renkler.kartArka,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },
  menuYazi: {
    flex: 1,
    fontSize: 16,
    color: renkler.yaziKoyu,
    marginLeft: 12,
  },
  bolumBaslik: {
    fontSize: 16,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 10,
  },
  temaSatir: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  temaButon: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    alignItems: 'center',
    marginRight: 10,
  },
  temaButonSecili: {
    backgroundColor: renkler.anaRenk,
    borderColor: renkler.anaRenk,
  },
  temaYazi: {
    fontSize: 15,
    color: renkler.yaziOrta,
  },
  temaYaziSecili: {
    color: renkler.anaRenkUstuYazi,
    fontWeight: 'bold',
  },
  cikisButon: {
    backgroundColor: renkler.anaRenk,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cikisYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
});