import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { resimUrl } from '../utils/resim';
import { paraBicimle } from '../utils/bicimlendir';

// Sepetteki TEK bir satırın görünümü. Veri işi yok, sadece çizim + tıklama.
export default function SepetSatiri({ item, onAdetDegistir, onSil, onBas }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const resim = resimUrl(item.productImageUrl);

  // ⭐ YENİ — bu ürün satıştan kaldırılmış mı?
  //
  // "=== false" tercihinin sebebi SepetContext'te uzun uzun yazıldı:
  // alan hiç gelmediyse (undefined) ürünü satıştaymış gibi kabul ediyoruz.
  const pasif = item.isActive === false;

  return (
    <TouchableOpacity
      style={[styles.satir, pasif && styles.satirPasif]}
      activeOpacity={0.85}
      // ⭐ YENİ — pasif ürünün detayına GİDİLEMEZ.
      //
      // Backend'de GetProduct, pasif ürün için müşteriye 404 dönüyor.
      // Tıklamaya izin verseydik müşteri "Ürün bulunamadı" hata ekranıyla
      // karşılaşırdı — sepette duran bir şey için kafa karıştırıcı.
      // Tıklamayı baştan kapatmak dürüst davranış: gidecek yer yok.
      disabled={pasif}
      onPress={() => onBas && onBas(item)}
    >
      {resim ? (
        <Image
          source={{ uri: resim }}
          style={[styles.resim, pasif && styles.soluk]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.harfKutu, pasif && styles.soluk]}>
          <Text style={styles.harfYazi}>{item.productName.charAt(0)}</Text>
        </View>
      )}

      <View style={styles.orta}>
        <Text
          style={[styles.urunAd, pasif && styles.yaziPasif]}
          numberOfLines={2}
        >
          {item.productName}
        </Text>

        <Text style={[styles.birimFiyat, pasif && styles.soluk]}>
          {paraBicimle(item.productPrice)}
        </Text>

        {/* ⭐ YENİ — pasifse adet kontrolü yerine uyarı rozeti.
            
            Neden adet butonlarını gizliyoruz da sadece kilitlemiyoruz?
            Satın alınamayan bir ürünün adedini değiştirmenin hiçbir
            anlamı yok. Soluk ama duran butonlar "belki basarsam olur"
            hissi verir. Yerine yapılması GEREKEN şeyi söyleyen bir
            uyarı koyuyoruz — boşluk doldurmuyor, yön gösteriyor. */}
        {pasif ? (
          <View style={styles.pasifRozet}>
            <Ionicons name="close-circle" size={14} color={renkler.hata} />
            <Text style={styles.pasifRozetYazi}>Satıştan kaldırıldı</Text>
          </View>
        ) : (
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
        )}
      </View>

      {/* Çöp kutusu — pasif satırda BİLEREK açık bırakıldı.
          Müşterinin yapması gereken tek eylem bu; kapatmak onu
          çıkmaza sokardı. */}
      <TouchableOpacity
        style={styles.silButon}
        onPress={() => onSil(item)}
      >
        <Ionicons name="trash-outline" size={22} color="#e74c3c" />
      </TouchableOpacity>

    </TouchableOpacity>
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

  /* ⭐ YENİ — pasif satırın kenarlığı kırmızıya döner.
     
     Neden tüm satıra opacity vermiyoruz?
     Uyarı rozetinin ve çöp kutusunun TAM görünür kalması lazım —
     müşterinin görmesi ve basması gereken şeyler onlar. Soluklaştırmayı
     sadece "artık önemsiz" olan parçalara (resim, fiyat) uyguluyoruz. */
  satirPasif: {
    borderColor: renkler.hata,
    backgroundColor: renkler.acikKart
  },

  /* Tek bir öğeyi soluklaştırmak için ortak yardımcı stil */
  soluk: {
    opacity: 0.45
  },

  /* Ürün adı: soluk + üstü çizili.
     İki ayrı sinyal veriyoruz çünkü renk/opaklık tek başına bilgi
     taşımamalı — renk körü ya da güneş altında bakan kullanıcı
     çizgiyi yine de görür. */
  yaziPasif: {
    opacity: 0.45,
    textDecorationLine: 'line-through'
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

  /* ⭐ YENİ — "Satıştan kaldırıldı" rozeti.
     
     Adet kontrolünün kapladığı dikey alanla benzer yükseklikte
     tutuyoruz ki satır yükseklikleri listede zıplamasın. */
  pasifRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: renkler.arkaPlan,
    borderWidth: 1,
    borderColor: renkler.hata,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 9
  },
  pasifRozetYazi: {
    fontSize: 12,
    fontWeight: '600',
    color: renkler.hata
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