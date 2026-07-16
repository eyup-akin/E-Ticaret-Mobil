import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { durumYazisi } from '../utils/durum';
import { tarihBicimle } from '../utils/bicimlendir';

// Sipariş iptalse kırmızı iptal kutusu, değilse kargo adım çubuğu gösterir.
export default function KargoDurumu({ siparis }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const iptalMi = siparis.status === 'iptal';
  const asamalar = ['hazirlaniyor', 'kargoda', 'teslim_edildi'];
  const suankiIndex = asamalar.indexOf(siparis.status);

  if (iptalMi) {
    return (
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
    );
  }

  return (
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
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kutu: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14
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
  }
});