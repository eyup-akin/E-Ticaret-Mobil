import React, { useState } from 'react';
import { font } from '../theme/olculer';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { resimUrl } from '../utils/resim';

// Ürün detayının resim galerisi + sağ üstteki favori kalbi.
export default function UrunGaleri({ resimler = [], urunAdi = '', favori, onKalp, favoriRenk }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);
  const genislik = Dimensions.get('window').width - 24; // iki yandan 12'şer boşluk
  const [aktif, setAktif] = useState(0);

  return (
    <View style={styles.galeri}>
      {resimler.length > 0 ? (
        <>
          <FlatList
            data={resimler}
            keyExtractor={(img) => img.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const i = Math.round(e.nativeEvent.contentOffset.x / genislik);
              setAktif(i);
            }}
            renderItem={({ item: img }) => (
              <Image
                source={{ uri: resimUrl(img.url) }}
                style={{ width: genislik, height: 360 }}
                resizeMode="cover"
              />
            )}
          />
          {resimler.length > 1 && (
            <View style={styles.noktalar}>
              {resimler.map((img, i) => (
                <View key={img.id} style={[styles.nokta, i === aktif && styles.noktaAktif]} />
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.resimYok}>
          <Text style={styles.resimHarf}>{urunAdi.charAt(0)}</Text>
        </View>
      )}

      {/* Favori kalbi — sağ üstte yüzen daire (ürün kartındaki gibi) */}
      <TouchableOpacity style={styles.kalp} onPress={onKalp} hitSlop={8}>
        <Ionicons name={favori ? 'heart' : 'heart-outline'} size={22} color={favori ? favoriRenk : '#555'} />
      </TouchableOpacity>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  galeri: {
    height: 360,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 20,          // ⭐ yuvarlak köşeler
    overflow: 'hidden',
    backgroundColor: renkler.acikGri,
    position: 'relative',
  },
  // ⭐ DEĞİŞTİ (GV/Faz 1) — ana renk zemin olmaktan çıkarıldı.
  // Gerekçe UrunKarti.resimYok'ta yazılı: dekoratif ana renk,
  // turuncuya geçince ekranı ele geçiriyor.
  resimYok: {
    width: '100%',
    height: '100%',
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resimHarf: { color: renkler.yaziGri, fontSize: 100, fontWeight: 'bold', fontFamily: font.kalin },
  noktalar: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  nokta: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
    marginHorizontal: 3,
  },
  noktaAktif: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#ffffff' },
  kalp: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});