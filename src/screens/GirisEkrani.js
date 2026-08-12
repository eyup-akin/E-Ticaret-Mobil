import React, { useState } from 'react';
import { font } from '../theme/olculer';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { apiPost } from '../services/api';

import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';

export default function GirisEkrani({ navigation }) {
  const { girisYap } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  // MODALI KAPAT → HER ZAMAN ANA SAYFAYA DÖN
  //
  // Neden goBack() değil: modal her zaman "Ana"nın üstüne açılıyor, yani deneme
  // canGoBack() hep true dönüyordu ve kullanıcı geldiği sekmeye geri
  // düşüyordu. Hesabım'dan gelen, giriş yapsa da vazgeçse de yine
  // Hesabım'da uyanıyordu.
  //
  // Üç katı da belirtiyoruz çünkü her navigator kendi geçmişini tutar:
  //   'Ana'          → RootStack'teki sekme kabuğu
  //   'AnaSayfa'     → o kabuğun Ana Sayfa sekmesi
  //   'AnaSayfaMain' → o sekmenin ürün listesi ekranı
  // Sonuncusu olmazsa sekme UrunDetay'da kalmışsa orada uyanırdı.
  function kapat() {
    navigation.navigate('Ana', {
      screen: 'AnaSayfa',
      params: { screen: 'AnaSayfaMain' },
    });
  }



  // Doğrulama linkini yeniden gönderir.
  // AuthContext üzerinden değil doğrudan apiPost ile çağırıyoruz:
  // bu işlem oturumla ilgili değil, tek seferlik basit bir istek.
  async function dogrulamaLinkiGonder() {
    try {
      const veri = await apiPost('/auth/resend-verification', { email: email });
      Alert.alert('Gönderildi', veri.mesaj);
    } catch (hata) {
      // Rate limit'e takılırsa ("15 dakikada 3 istek") mesajı burada görünür
      Alert.alert('Gönderilemedi', hata.message);
    }
  }



  async function girisButonu() {
    if (!email || !sifre) {
      Alert.alert('Eksik bilgi', 'Email ve şifre boş olamaz.');
      return;
    }
    try {
      setYukleniyor(true);
      await girisYap(email, sifre);
      kapat();   // ← giriş başarılı, modalı kapat ve geldiği yere dön
    } catch (hata) {
      // ⭐ Email doğrulanmamışsa bu bir "hata" değil, eksik bir adım.
      // Backend'in gönderdiği KOD'a bakıyoruz, mesaj metnine değil —
      // metin ileride değişirse kontrol kırılmasın.
      if (hata.kod === 'EMAIL_DOGRULANMADI') {
        Alert.alert(
          'Hesabın henüz doğrulanmadı',
          hata.message + '\n\nMaili bulamıyorsan yeni bir link isteyebilirsin.',
          [
            { text: 'Linki tekrar gönder', onPress: dogrulamaLinkiGonder },
            { text: 'Tamam', style: 'cancel' },
          ]
        );
        return;
      }

      Alert.alert('Giriş başarısız', hata.message);
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
        <Text style={styles.baslik}>Giriş Yap</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={renkler.yaziGri}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor={renkler.yaziGri}
          value={sifre}
          onChangeText={setSifre}
          secureTextEntry={true}
        />

        <TouchableOpacity style={styles.buton} onPress={girisButonu} disabled={yukleniyor}>
          {yukleniyor
            ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
            : <Text style={styles.butonYazi}>Giriş Yap</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SifremiUnuttum')}>
          <Text style={styles.sifremiUnuttumYazi}>Şifremi unuttum</Text>
        </TouchableOpacity>

        {/* replace: Giriş'i yığından çıkarır, Kayıt'ı yerine koyar */}
        <TouchableOpacity onPress={() => navigation.replace('Kayit')}>
          <Text style={styles.altYazi}>Hesabın yok mu? Kayıt ol</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={kapat}>
          <Text style={styles.misafirYazi}>Misafir olarak devam et</Text>
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
    fontFamily: font.kalin,
    marginBottom: 24,
    textAlign: 'center',
    color: renkler.yaziKoyu,
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
    fontFamily: font.kalin,
  },
  sifremiUnuttumYazi: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 13,
    color: renkler.yaziOrta,
  },
  altYazi: {
    textAlign: 'center',
    marginTop: 16,
    color: renkler.anaRenk,
  },
  misafirYazi: {
    textAlign: 'center',
    marginTop: 20,
    color: renkler.yaziGri,
    fontSize: 13,
  },
});