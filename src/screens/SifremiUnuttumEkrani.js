import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';

export default function SifremiUnuttumEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [email, setEmail] = useState('');
  const [basari, setBasari] = useState('');   // backend'in dönen mesajı
  const [yukleniyor, setYukleniyor] = useState(false);

  // MODALI KAPAT (GirisEkrani ile aynı mantık)
  function kapat() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Ana');
    }
  }

  async function gonderButonu() {
    if (!email) {
      Alert.alert('Eksik bilgi', 'Email adresini yaz.');
      return;
    }

    try {
      setYukleniyor(true);

      const veri = await apiPost('/auth/forgot-password', { email: email });

      // ⚠️ Backend email kayıtlı OLSA DA OLMASA DA aynı 200'ü döner
      // (user enumeration koruması). Bu yüzden "bulunamadı" dalı YOK.
      setBasari(veri.mesaj);
    } catch (hata) {
      // Buraya sadece gerçek hatalar düşer: ağ kopukluğu, 500, rate limit...
      Alert.alert('Gönderilemedi', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>

      {/* ÜST BAR — kapatma butonu */}
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={kapat} style={styles.kapatButon}>
          <Ionicons name="close" size={26} color={renkler.yaziKoyu} />
        </TouchableOpacity>
      </View>

      <View style={styles.icerik}>
        <Text style={styles.baslik}>Şifremi Unuttum</Text>
        <Text style={styles.aciklama}>
          Hesabının email adresini gir, şifre sıfırlama linkini gönderelim.
        </Text>

        {/* Link gönderildiyse formu gizle — kullanıcı üst üste basmasın.
            Her istek yeni token üretip öncekini geçersiz kılıyor; kullanıcı
            eski maildeki linke tıklarsa "geçersiz link" hatası alır. */}
        {basari === '' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={renkler.yaziGri}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity style={styles.buton} onPress={gonderButonu} disabled={yukleniyor}>
              {yukleniyor
                ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
                : <Text style={styles.butonYazi}>Sıfırlama Linki Gönder</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.basariKutu}>
            <Ionicons name="mail-outline" size={32} color={renkler.basari} />
            <Text style={styles.basariYazi}>{basari}</Text>
            <Text style={styles.basariAlt}>
              Linke tıklayıp yeni şifreni belirledikten sonra buradan giriş yapabilirsin.
            </Text>
          </View>
        )}

        {/* replace: bu ekranı yığından çıkarır, Giriş'i yerine koyar */}
        <TouchableOpacity onPress={() => navigation.replace('Giris')}>
          <Text style={styles.altYazi}>← Giriş ekranına dön</Text>
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
  ustBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  kapatButon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icerik: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 80,
  },
  baslik: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: renkler.yaziKoyu,
  },
  aciklama: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
    color: renkler.yaziOrta,
  },
  input: {
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    color: renkler.yaziKoyu,
  },
  buton: {
    backgroundColor: renkler.anaRenk,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  butonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
  basariKutu: {
    borderWidth: 1,
    borderColor: renkler.basari,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  basariYazi: {
    color: renkler.basari,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
  },
  basariAlt: {
    color: renkler.yaziOrta,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
  },
  altYazi: {
    textAlign: 'center',
    marginTop: 20,
    color: renkler.anaRenk,
  },
});