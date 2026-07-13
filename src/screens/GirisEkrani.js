import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';

export default function GirisEkrani({ navigation }) {
  const { girisYap } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  async function girisButonu() {
    if (!email || !sifre) {
      Alert.alert('Eksik bilgi', 'Email ve şifre boş olamaz.');
      return;
    }
    try {
      setYukleniyor(true);
      await girisYap(email, sifre);
    } catch (hata) {
      Alert.alert('Giriş başarısız', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <View style={styles.kapsayici}>
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

      <TouchableOpacity onPress={() => navigation.navigate('Kayit')}>
        <Text style={styles.altYazi}>Hesabın yok mu? Kayıt ol</Text>
      </TouchableOpacity>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: renkler.arkaPlan,
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
});