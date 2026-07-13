import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';

// Sepetteki TEK bir satırın görünümü. Veri işi yok, sadece çizim + tıklama.
export default function SepetSatiri({ item, onAdetDegistir, onSil }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  return (
    <View style={styles.satir}>
      <View style={styles.harfKutu}>
        <Text style={styles.harfYazi}>{item.productName.charAt(0)}</Text>
      </View>

      <View style={styles.orta}>
        <Text style={styles.urunAd} numberOfLines={2}>{item.productName}</Text>
        <Text style={styles.fiyat}>{item.productPrice} ₺</Text>

        <View style={styles.adetKutu}>
          <TouchableOpacity
            style={styles.adetButon}
            onPress={() => onAdetDegistir(item, item.quantity - 1)}
          >
            <Ionicons name="remove" size={18} color={renkler.yaziKoyu} />
          </TouchableOpacity>

          <Text style={styles.adetYazi}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.adetButon}
            onPress={() => onAdetDegistir(item, item.quantity + 1)}
          >
            <Ionicons name="add" size={18} color={renkler.yaziKoyu} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sag}>
        <TouchableOpacity onPress={() => onSil(item)} style={styles.silButon}>
          <Ionicons name="trash-outline" size={22} color={renkler.yaziGri} />
        </TouchableOpacity>

        <Text style={styles.satirToplam}>
          {(item.productPrice * item.quantity).toFixed(2)} ₺
        </Text>
      </View>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  satir: {
    flexDirection: 'row',
    backgroundColor: renkler.kartArka,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },
  harfKutu: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  harfYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 24,
    fontWeight: 'bold',
  },
  orta: {
    flex: 1,
  },
  urunAd: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 2,
  },
  fiyat: {
    fontSize: 14,
    color: renkler.yaziOrta,
    marginBottom: 8,
  },
  adetKutu: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adetButon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adetYazi: {
    fontSize: 16,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginHorizontal: 14,
    minWidth: 20,
    textAlign: 'center',
  },
  sag: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  silButon: {
    padding: 4,
  },
  satirToplam: {
    fontSize: 15,
    fontWeight: 'bold',
    color: renkler.anaRenk,
  },
});