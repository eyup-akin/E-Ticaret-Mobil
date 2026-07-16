import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { resimUrl } from '../utils/resim';
import { paraBicimle } from '../utils/bicimlendir';

// Sepetteki TEK bir satırın görünümü. Veri işi yok, sadece çizim + tıklama.
export default function SepetSatiri({ item, onAdetDegistir, onSil }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const resim = resimUrl(item.productImageUrl);

  return (
    <View style={styles.satir}>
      {resim ? (
        <Image source={{ uri: resim }} style={styles.resim} resizeMode="cover" />
      ) : (
        <View style={styles.harfKutu}>
          <Text style={styles.harfYazi}>{item.productName.charAt(0)}</Text>
        </View>
      )}

      <View style={styles.orta}>
        <Text style={styles.urunAd} numberOfLines={2}>{item.productName}</Text>
        <Text style={styles.birimFiyat}>{paraBicimle(item.productPrice)}</Text>

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
          <Ionicons name="trash-outline" size={20} color={renkler.yaziGri} />
        </TouchableOpacity>

        <Text style={styles.satirToplam}>
          {paraBicimle(item.productPrice * item.quantity)}
        </Text>
      </View>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renkler.kartArka,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: renkler.kenarlik
  },
  resim: {
    width: 84,
    height: 84,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: renkler.acikGri
  },
  harfKutu: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  harfYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 30,
    fontWeight: 'bold'
  },
  orta: {
    flex: 1
  },
  urunAd: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 4
  },
  birimFiyat: {
    fontSize: 13,
    color: renkler.yaziGri,
    marginBottom: 10
  },
  adetKutu: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  adetButon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    justifyContent: 'center',
    alignItems: 'center'
  },
  adetYazi: {
    fontSize: 16,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginHorizontal: 14,
    minWidth: 20,
    textAlign: 'center'
  },
  sag: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 8
  },
  silButon: {
    padding: 4
  },
  satirToplam: {
    fontSize: 16,
    fontWeight: 'bold',
    color: renkler.anaRenk
  }
});