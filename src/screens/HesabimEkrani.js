import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';

export default function HesabimEkrani({ navigation }) {
  const { token, kullanici, cikisYap } = useAuth();
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

        {token ? (
          /* ============ ÜYE GÖRÜNÜMÜ ============ */
          <>
            <View style={styles.kart}>
              <Text style={styles.ad}>{kullanici?.fullName}</Text>
              <Text style={styles.rol}>Rol: {kullanici?.role}</Text>
            </View>

            <View style={styles.menu}>
              {menuSatiri('receipt-outline', 'Siparişlerim', 'Siparislerim')}
              {menuSatiri('location-outline', 'Adreslerim', 'Adreslerim')}
              {menuSatiri('card-outline', 'Kartlarım', 'Kartlarim')}
            </View>
          </>
        ) : (
          /* ============ MİSAFİR GÖRÜNÜMÜ ============ */
          <>
            <View style={styles.misafirKart}>
              <View style={styles.misafirIkonDaire}>
                <Ionicons
                  name="person-outline"
                  size={38}
                  color={renkler.anaRenk}
                />
              </View>

              <Text style={styles.misafirBaslik}>Hoş geldin!</Text>

              <Text style={styles.misafirAciklama}>
                Sepetine ürün eklemek, favori kaydetmek ve sipariş verebilmek
                için giriş yapman gerekiyor.
              </Text>

              <TouchableOpacity
                style={styles.anaButon}
                onPress={() => navigation.navigate('Giris')}
                activeOpacity={0.8}
              >
                <Text style={styles.anaButonYazi}>Giriş Yap</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ikincilButon}
                onPress={() => navigation.navigate('Kayit')}
                activeOpacity={0.8}
              >
                <Text style={styles.ikincilButonYazi}>Kayıt Ol</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.misafirDipnot}>
              Giriş yapmadan ürünleri gezmeye devam edebilirsin.
            </Text>
          </>
        )}

        {/* ============ ORTAK: GÖRÜNÜM (TEMA) ============ */}
        {/* Tema cihazda saklanıyor, token gerektirmiyor — misafire de açık. */}
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

        {/* ============ SADECE ÜYE: ÇIKIŞ ============ */}
        {token ? (
          <TouchableOpacity style={styles.cikisButon} onPress={cikisYap}>
            <Text style={styles.cikisYazi}>Çıkış Yap</Text>
          </TouchableOpacity>
        ) : null}
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

  /* --- ÜYE GÖRÜNÜMÜ --- */
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

  /* --- MİSAFİR GÖRÜNÜMÜ --- */
  misafirKart: {
    backgroundColor: renkler.acikKart,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  misafirIkonDaire: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: renkler.kartArka,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  misafirBaslik: {
    fontSize: 20,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    marginBottom: 8,
  },
  misafirAciklama: {
    fontSize: 14,
    color: renkler.yaziOrta,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  anaButon: {
    backgroundColor: renkler.anaRenk,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  anaButonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ikincilButon: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: renkler.anaRenk,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  ikincilButonYazi: {
    color: renkler.anaRenk,
    fontSize: 16,
    fontWeight: 'bold',
  },
  misafirDipnot: {
    fontSize: 12,
    color: renkler.yaziGri,
    textAlign: 'center',
    marginBottom: 24,
  },

  /* --- ORTAK: TEMA --- */
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

  /* --- ÇIKIŞ --- */
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