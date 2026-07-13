import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSepet } from '../context/SepetContext';
import { useTema } from '../context/TemaContext';

export default function SepetIkonu({ color, size }) {
  const { urunSayisi } = useSepet();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  return (
    <View>
      <Ionicons name="cart" size={size} color={color} />
      {urunSayisi > 0 && (
        <View style={styles.rozet}>
          <Text style={styles.rozetYazi}>{urunSayisi}</Text>
        </View>
      )}
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  rozet: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  rozetYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 10,
    fontWeight: 'bold',
  },
});