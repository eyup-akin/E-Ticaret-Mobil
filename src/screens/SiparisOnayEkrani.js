import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';

export default function SiparisOnayEkrani({ route, navigation }) {
  const { adresId, kartId } = route.params;

  const { renkler } = useTema();
  const { sepet, toplamTutar, sepetiSifirla } = useSepet();
  const styles = stilOlustur(renkler);

  const [adres, setAdres] = useState(null);
  const [kart, setKart] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // Seçilen adres ve kartın detaylarını getir (özet göstermek için)
  useEffect(() => {
    async function ozetiGetir() {
      try {
        const [adresler, kartlar] = await Promise.all([
          apiGet('/addresses'),
          apiGet('/cards'),
        ]);
        setAdres(adresler.find((a) => a.id === adresId));
        setKart(kartlar.find((k) => k.id === kartId));
      } catch (hata) {
        console.log('Özet alınamadı:', hata.message);
      } finally {
        setYukleniyor(false);
      }
    }
    ozetiGetir();
  }, []);

  // SİPARİŞİ TAMAMLA — backend transaction'ı burada tetikleniyor
  async function siparisiTamamla() {
    try {
      setGonderiliyor(true);

      const sonuc = await apiPost('/orders', {
        addressId: adresId,
        cardId: kartId,
      });

      sepetiSifirla(); // backend sepeti temizledi, ekranı da senkronla

      // Başarı ekranına git (geri tuşuyla buraya dönemesin)
      navigation.replace('SiparisBasarili', {
        siparisId: sonuc.siparisId,   // detaya gitmek için gerekli (URL anahtarı)
        siparisNo: sonuc.siparisNo,   // ⭐ ekranda gösterilecek numara
        toplam: sonuc.toplam,
      });
    } catch (hata) {
      // Stok yetersizliği gibi hatalar burada yakalanır
      Alert.alert('Sipariş verilemedi', hata.message);
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>Sipariş Özeti</Text>
      </View>

      <Text style={styles.adimYazi}>3 / 3 — Onayla</Text>

      <ScrollView contentContainerStyle={styles.icerik}>
        {/* Teslimat adresi */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Teslimat Adresi</Text>
          <View style={styles.kutu}>
            <Text style={styles.kutuBaslik}>{adres?.title}</Text>
            <Text style={styles.kutuMetin}>{adres?.fullAddress}</Text>
            <Text style={styles.kutuAlt}>{adres?.city}</Text>
          </View>
        </View>

        {/* Ödeme */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ödeme</Text>
          <View style={styles.kutu}>
            <Text style={styles.kutuBaslik}>**** **** **** {kart?.last4Digits}</Text>
            <Text style={styles.kutuMetin}>{kart?.cardHolderName}</Text>
            <Text style={styles.kutuAlt}>{kart?.cardType}</Text>
          </View>
        </View>

        {/* Ürünler */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ürünler ({sepet.length})</Text>
          <View style={styles.kutu}>
            {sepet.map((s) => (
              <View key={s.id} style={styles.urunSatir}>
                <Text style={styles.urunAd} numberOfLines={1}>
                  {s.productName} × {s.quantity}
                </Text>
                <Text style={styles.urunFiyat}>
                  {(s.productPrice * s.quantity).toFixed(2)} ₺
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.altBar}>
        <View style={styles.toplamSatir}>
          <Text style={styles.toplamEtiket}>Toplam</Text>
          <Text style={styles.toplamTutar}>{toplamTutar.toFixed(2)} ₺</Text>
        </View>

        <TouchableOpacity
          style={styles.tamamlaButon}
          onPress={siparisiTamamla}
          disabled={gonderiliyor}
        >
          {gonderiliyor
            ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
            : <Text style={styles.tamamlaYazi}>Siparişi Tamamla</Text>}
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
  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: renkler.arkaPlan,
  },
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },
  geriButon: {
    marginRight: 12,
  },
  ustBaslik: {
    fontSize: 18,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  adimYazi: {
    fontSize: 13,
    color: renkler.yaziOrta,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  icerik: {
    padding: 16,
  },
  bolum: {
    marginBottom: 20,
  },
  bolumBaslik: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 8,
  },
  kutu: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14,
  },
  kutuBaslik: {
    fontSize: 16,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 4,
  },
  kutuMetin: {
    fontSize: 14,
    color: renkler.yaziOrta,
    marginBottom: 2,
  },
  kutuAlt: {
    fontSize: 13,
    color: renkler.yaziGri,
  },
  urunSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  urunAd: {
    flex: 1,
    fontSize: 14,
    color: renkler.yaziKoyu,
    marginRight: 10,
  },
  urunFiyat: {
    fontSize: 14,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  altBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },
  toplamSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toplamEtiket: {
    fontSize: 15,
    color: renkler.yaziOrta,
  },
  toplamTutar: {
    fontSize: 24,
    fontWeight: 'bold',
    color: renkler.anaRenk,
  },
  tamamlaButon: {
    backgroundColor: renkler.anaRenk,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tamamlaYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
});