import React from 'react';
import { font } from '../theme/olculer';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTema } from '../context/TemaContext';

// MİSAFİR KAPISI
// Giriş yapmamış kullanıcı korumalı bir sekmeye girdiğinde bu ekranı görür.
// Sepet, Siparişlerim ve Favorilerim ekranlarında tekrar tekrar kullanılacak.
//
// Kullanımı:
//   <GirisGerekliEkrani
//     ikon="cart-outline"
//     baslik="Sepetini görmek için giriş yap"
//     aciklama="Sepetine ürün ekleyip sipariş verebilirsin."
//   />

export default function GirisGerekliEkrani({ ikon, baslik, aciklama }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  // Bu bir EKRAN değil, BİLEŞEN.
  // O yüzden navigation prop olarak gelmez, hook ile çekiyoruz.
  const navigation = useNavigation();

  return (
    <View style={styles.kap}>

      {/* İkon — daire içinde */}
      <View style={styles.ikonDaire}>
        <Ionicons
          name={ikon || 'lock-closed-outline'}
          size={44}
          color={renkler.anaRenk}
        />
      </View>

      {/* Başlık */}
      <Text style={styles.baslik}>
        {baslik || 'Bu sayfa için giriş yapmalısın'}
      </Text>

      {/* Açıklama */}
      {aciklama ? (
        <Text style={styles.aciklama}>{aciklama}</Text>
      ) : null}

      {/* Giriş Yap — dolu buton */}
      <TouchableOpacity
        style={styles.anaButon}
        onPress={() => navigation.navigate('Giris')}
        activeOpacity={0.8}
      >
        <Text style={styles.anaButonYazi}>Giriş Yap</Text>
      </TouchableOpacity>

      {/* Kayıt Ol — çerçeveli buton */}
      <TouchableOpacity
        style={styles.ikincilButon}
        onPress={() => navigation.navigate('Kayit')}
        activeOpacity={0.8}
      >
        <Text style={styles.ikincilButonYazi}>Kayıt Ol</Text>
      </TouchableOpacity>

      {/* Misafir bilgilendirmesi */}
      <Text style={styles.dipnot}>
        Giriş yapmadan ürünleri gezmeye devam edebilirsin.
      </Text>

    </View>
  );
}

function stilOlustur(renkler) {
  return StyleSheet.create({
    kap: {
      flex: 1,
      backgroundColor: renkler.arkaPlan,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    ikonDaire: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: renkler.acikKart,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    baslik: {
      fontSize: 19,
      fontWeight: 'bold',
      fontFamily: font.kalin,
      color: renkler.yaziKoyu,
      textAlign: 'center',
      marginBottom: 10,
    },
    aciklama: {
      fontSize: 14,
      color: renkler.yaziOrta,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 28,
    },
    anaButon: {
      backgroundColor: renkler.anaRenk,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      width: '100%',
      marginBottom: 12,
    },
    anaButonYazi: {
      color: renkler.anaRenkUstuYazi,
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: font.kalin,
    },
    ikincilButon: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: renkler.anaRenk,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      width: '100%',
      marginBottom: 24,
    },
    ikincilButonYazi: {
      color: renkler.anaRenk,
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: font.kalin,
    },
    dipnot: {
      fontSize: 12,
      color: renkler.yaziGri,
      textAlign: 'center',
    },
  });
}