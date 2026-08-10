import React, { useState } from 'react';
import { font } from '../theme/olculer';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiPut } from '../services/api';
import { useTema } from '../context/TemaContext';
import { iptalEdilebilirMi } from '../utils/durum';

// Sipariş iptal edilebilir durumdaysa iptal akışını çizer, değilse hiçbir şey.
// onIptalEdildi: iptal başarılı olunca parent ekranı tazelesin.
export default function SiparisIptalForm({ siparisId, durum, onIptalEdildi }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [iptalModu, setIptalModu] = useState(false);
  const [sebep, setSebep] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // İptal edilemeyen durumlarda hiçbir şey gösterme
  if (!iptalEdilebilirMi(durum)) {
    return null;
  }

  async function iptalEt() {
    if (sebep.trim().length < 5) {
      Alert.alert('Uyarı', 'İptal sebebi en az 5 karakter olmalı.');
      return;
    }
    try {
      setGonderiliyor(true);
      await apiPut('/orders/' + siparisId + '/cancel', { reason: sebep.trim() });
      setIptalModu(false);
      setSebep('');
      if (onIptalEdildi) onIptalEdildi();
      Alert.alert('İptal edildi', 'Siparişin iptal edildi ve ödemen iade edildi.');
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  if (!iptalModu) {
    return (
      <TouchableOpacity style={styles.acButon} onPress={() => setIptalModu(true)}>
        <Ionicons name="close-circle-outline" size={20} color="#e74c3c" />
        <Text style={styles.acYazi}>  Siparişi İptal Et</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formBaslik}>İptal sebebi</Text>

      <TextInput
        style={styles.input}
        placeholder="Neden iptal ediyorsun? (en az 5 karakter)"
        placeholderTextColor={renkler.yaziGri}
        value={sebep}
        onChangeText={setSebep}
        multiline
      />

      <View style={styles.butonSatir}>
        <TouchableOpacity
          style={styles.vazgecButon}
          onPress={() => { setIptalModu(false); setSebep(''); }}
          disabled={gonderiliyor}
        >
          <Text style={styles.vazgecYazi}>Vazgeç</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.onaylaButon} onPress={iptalEt} disabled={gonderiliyor}>
          {gonderiliyor ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.onaylaYazi}>İptali Onayla</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  acButon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e74c3c'
  },
  acYazi: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: font.yari,
    color: '#e74c3c'
  },
  form: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14
  },
  formBaslik: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    color: renkler.yaziKoyu,
    backgroundColor: renkler.kartArka,
    marginBottom: 12
  },
  butonSatir: {
    flexDirection: 'row'
  },
  vazgecButon: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  vazgecYazi: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziOrta
  },
  onaylaButon: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center'
  },
  onaylaYazi: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: font.kalin,
    color: '#ffffff'
  }
});