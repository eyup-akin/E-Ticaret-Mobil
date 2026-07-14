import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';

export default function KayitEkrani({ navigation }) {
  const { kayitOl } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [adSoyad, setAdSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  // MODALI KAPAT (GirisEkrani ile aynı mantık)
  function kapat() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Ana');
    }
  }

  async function kayitButonu() {
    if (!adSoyad || !email || !sifre) {
      Alert.alert('Eksik bilgi', 'Tüm alanları doldur.');
      return;
    }
    try {
      setYukleniyor(true);
      await kayitOl(adSoyad, email, sifre);   // kayıt + otomatik giriş
      kapat();                                 // ← modalı kapat
    } catch (hata) {
      Alert.alert('Kayıt başarısız', hata.message);
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
        <Text style={styles.baslik}>Kayıt Ol</Text>

        <TextInput
          style={styles.input}
          placeholder="Ad Soyad"
          placeholderTextColor={renkler.yaziGri}
          value={adSoyad}
          onChangeText={setAdSoyad}
        />
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

        <TouchableOpacity style={styles.buton} onPress={kayitButonu} disabled={yukleniyor}>
          {yukleniyor
            ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
            : <Text style={styles.butonYazi}>Kayıt Ol</Text>}
        </TouchableOpacity>

        {/* replace: Kayıt'ı yığından çıkarır, Giriş'i yerine koyar */}
        <TouchableOpacity onPress={() => navigation.replace('Giris')}>
          <Text style={styles.altYazi}>Zaten hesabın var mı? Giriş yap</Text>
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