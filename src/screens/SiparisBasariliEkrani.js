import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
// ⭐ YENİ — ortak para biçimlendirici.
//
// ⭐ DEĞİŞTİ — bu ekran tutarları "toFixed(2) + ' ₺'" ile yazıyordu
// ve sonuç "1234.50 ₺" oluyordu: ondalık ayracı NOKTA, binlik ayracı
// hiç yok. Uygulamanın geri kalanı paraBicimle kullanıyor ve
// "1.234,50 ₺" gösteriyor.
//
// Aynı siparişin tutarı sepette bir türlü, başarı ekranında başka
// türlü görünüyordu. Para biçimi bir DETAY değil: müşteri iki sayının
// aynı olup olmadığını gözle karşılaştırıyor ve farklı yazım
// "acaba başka bir tutar mı?" sorusunu doğuruyor.
import { paraBicimle } from '../utils/bicimlendir';

export default function SiparisBasariliEkrani({ route, navigation }) {
  // ⭐ araToplam, indirim, kuponKodu → SiparisOnayEkrani'ndan geliyor.
  //    Bunlar SUNUCUNUN döndürdüğü değerler; kendi hesabımız değil.
  //    Böylece ekranda gösterilen sayı ile veritabanına yazılan
  //    sayı birebir aynı oluyor.
  const { siparisId, siparisNo, toplam, araToplam, indirim, kuponKodu, kargoUcreti } = route.params;

  // Number(...) ile sarmalıyoruz çünkü JSON'dan gelen decimal
  // bazen sayı bazen metin olabilir; toplama/karşılaştırma yaparken
  // "0" > 0 gibi sürprizler yaşamayalım.
  //
  // ?? 0 → alan hiç gelmemişse (eski bir gezinme kaydı gibi) 0 say.
  // || yerine ?? kullanıyoruz: 0 geçerli bir değer, onu ezmemeli.
  const indirimSayi = Number(indirim ?? 0);

  // ⭐ YENİ — kargo ücreti (aynı Number/?? gerekçesiyle sarmalı).
  const kargoSayi = Number(kargoUcreti ?? 0);

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

          {/* ⭐ DEĞİŞTİ — döküm artık indirim yokken de çiziliyor.

              Eskiden blok tamamen "indirim varsa" koşuluna bağlıydı ve
              indirim yoksa tek satır "Tutar" kalıyordu. Kargo eklenince
              bu yetmez oldu: ara toplam eksi indirim artık ödenen
              tutarı VERMİYOR, aradaki fark kargo. Dökümü göstermezsek
              müşteri "sepette 450 yazıyordu, 499,90 ödedim" der.

              Satırlar sepet ve onay ekranındakiyle aynı sırada:
              ara toplam → indirim → kargo → ödenen. */}
          <View style={styles.kutuSatir}>
            <Text style={styles.etiket}>Ara toplam</Text>
            {/* ⭐ DEĞİŞTİ — toFixed yerine paraBicimle.
                Number(... ?? 0) sarmalına gerek kalmadı: paraBicimle
                içeride zaten Number(sayi) || 0 yapıyor. */}
            <Text style={styles.deger}>{paraBicimle(araToplam)}</Text>
          </View>

          {indirimSayi > 0 && (
            <View style={styles.kutuSatir}>
              <Text style={styles.etiket}>
                İndirim{kuponKodu ? ` (${kuponKodu})` : ''}
              </Text>
              {/* ⭐ DEĞİŞTİ — biçimlendirme ortak fonksiyona geçti */}
              <Text style={styles.degerIndirim}>
                −{paraBicimle(indirimSayi)}
              </Text>
            </View>
          )}

          {/* ⭐ YENİ — kargo satırı. 0 ise "Ücretsiz". */}
          <View style={styles.kutuSatir}>
            <Text style={styles.etiket}>Kargo</Text>

            {kargoSayi > 0 ? (
              <Text style={styles.deger}>{paraBicimle(kargoSayi)}</Text>
            ) : (
              <Text style={styles.degerIndirim}>Ücretsiz</Text>
            )}
          </View>

          <View style={styles.kutuSatir}>
            <Text style={styles.etiket}>{indirimSayi > 0 ? 'Ödenen' : 'Tutar'}</Text>
            {/* ⭐ DEĞİŞTİ — biçimlendirme ortak fonksiyona geçti */}
            <Text style={styles.degerVurgu}>{paraBicimle(toplam)}</Text>
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
            {/* ⭐ DEĞİŞTİ — biçimlendirme ortak fonksiyona geçti */}
            <Text style={styles.tasarrufYazi}>
              🎉 Bu siparişte {paraBicimle(indirimSayi)} tasarruf ettin!
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