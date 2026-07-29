import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';

export default function SiparisBasariliEkrani({ route, navigation }) {
  // ⭐ araToplam, indirim, kuponKodu → SiparisOnayEkrani'ndan geliyor.
  //    Bunlar SUNUCUNUN döndürdüğü değerler; kendi hesabımız değil.
  //    Böylece ekranda gösterilen sayı ile veritabanına yazılan
  //    sayı birebir aynı oluyor.
  const { siparisId, siparisNo, toplam, araToplam, indirim, kuponKodu } = route.params;

  // Number(...) ile sarmalıyoruz çünkü JSON'dan gelen decimal
  // bazen sayı bazen metin olabilir; toplama/karşılaştırma yaparken
  // "0" > 0 gibi sürprizler yaşamayalım.
  //
  // ?? 0 → alan hiç gelmemişse (eski bir gezinme kaydı gibi) 0 say.
  // || yerine ?? kullanıyoruz: 0 geçerli bir değer, onu ezmemeli.
  const indirimSayi = Number(indirim ?? 0);

  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.icerik}>
        <View style={styles.tikKutu}>
          <Ionicons name="checkmark" size={64} color={renkler.anaRenkUstuYazi} />
        </View>

        <Text style={styles.baslik}>Siparişin alındı!</Text>
        <Text style={styles.altYazi}>Ödemen başarıyla gerçekleşti.</Text>

        <View style={styles.kutu}>
          <View style={styles.kutuSatir}>
            <Text style={styles.etiket}>Sipariş No</Text>
            <Text style={styles.deger}>{siparisNo}</Text>
          </View>

          {/* ⭐ İndirim varsa dökümü göster.
              Yoksa sadece "Tutar" satırı kalır — eskisi gibi. */}
          {indirimSayi > 0 && (
            <>
              <View style={styles.kutuSatir}>
                <Text style={styles.etiket}>Ara toplam</Text>
                <Text style={styles.deger}>{Number(araToplam).toFixed(2)} ₺</Text>
              </View>

              <View style={styles.kutuSatir}>
                <Text style={styles.etiket}>
                  İndirim{kuponKodu ? ` (${kuponKodu})` : ''}
                </Text>
                <Text style={styles.degerIndirim}>
                  −{indirimSayi.toFixed(2)} ₺
                </Text>
              </View>
            </>
          )}

          <View style={styles.kutuSatir}>
            <Text style={styles.etiket}>{indirimSayi > 0 ? 'Ödenen' : 'Tutar'}</Text>
            <Text style={styles.degerVurgu}>{Number(toplam).toFixed(2)} ₺</Text>
          </View>

          <View style={styles.kutuSatir}>
            <Text style={styles.etiket}>Durum</Text>
            <Text style={styles.deger}>Hazırlanıyor</Text>
          </View>
        </View>

        {/* ⭐ Tasarruf rozeti — küçük ama etkili bir dokunuş.
            Müşteriye "iyi iş çıkardın" hissi verir ve bir dahaki
            sefere kupon aramaya teşvik eder. */}
        {indirimSayi > 0 && (
          <View style={styles.tasarrufRozet}>
            <Text style={styles.tasarrufYazi}>
              🎉 Bu siparişte {indirimSayi.toFixed(2)} ₺ tasarruf ettin!
            </Text>
          </View>
        )}
      </View>

      <View style={styles.altBar}>
        <TouchableOpacity
          style={styles.siparisButon}
          onPress={() => navigation.navigate('Hesabim', { screen: 'Siparislerim' })}
        >
          <Text style={styles.siparisYazi}>Siparişlerime Git</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.anaButon}
          onPress={() => navigation.navigate('AnaSayfa')}
        >
          <Text style={styles.anaYazi}>Alışverişe Devam Et</Text>
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
  icerik: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tikKutu: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: renkler.basari,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  baslik: {
    fontSize: 26,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    marginBottom: 8,
  },
  altYazi: {
    fontSize: 15,
    color: renkler.yaziOrta,
    marginBottom: 32,
  },
  kutu: {
    width: '100%',
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 16,
  },
  kutuSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  etiket: {
    fontSize: 15,
    color: renkler.yaziOrta,
  },
  deger: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  degerVurgu: {
    fontSize: 17,
    fontWeight: 'bold',
    color: renkler.anaRenk,
  },
  degerIndirim: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.basari,
  },
  tasarrufRozet: {
    width: '100%',
    backgroundColor: renkler.acikKart,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: renkler.basari,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
    alignItems: 'center',
  },
  tasarrufYazi: {
    fontSize: 14,
    fontWeight: '600',
    color: renkler.basari,
    textAlign: 'center',
  },
  altBar: {
    padding: 16,
  },
  siparisButon: {
    backgroundColor: renkler.anaRenk,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  siparisYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
  anaButon: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: renkler.inputKenar,
  },
  anaYazi: {
    color: renkler.yaziKoyu,
    fontSize: 16,
    fontWeight: '600',
  },
});