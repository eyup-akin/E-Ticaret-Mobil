import React from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
      {/* ⭐ DEĞİŞTİ (GV/Faz 6.13) — içerik kaydırılabilir.
          Eskiden flex:1 ile dikeyde ortalanmış sabit bir bloktu:
          indirim ve tasarruf rozeti birlikte çıktığında küçük
          ekranlarda alttaki satırlar butonların altına giriyordu. */}
      <ScrollView contentContainerStyle={styles.icerik}>
        <View style={styles.tikKutu}>
          <Ionicons name="checkmark" size={56} color={renkler.anaRenkUstuYazi} />
        </View>

        <Text style={styles.baslik}>Siparişin alındı!</Text>
        <Text style={styles.altYazi}>Ödemen başarıyla gerçekleşti.</Text>

        <View style={styles.kutu}>
          {/* ⚠️ G5 — SİPARİŞ NUMARASI BİZİM FORMATIMIZDA.
              Tasarım "#TR-2023-84920" yazıyor; bizimki
              SP-YYMMDD-NNNN ve veritabanında öyle duruyor. Numara
              sunucudan geldiği gibi basılıyor, burada biçimlenmiyor —
              biçimlenseydi ekrandaki numara ile kayıttaki numara
              ayrışabilirdi. */}
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
            {/* ⭐ DEĞİŞTİ (4.7) — baştaki 🎉 yerine ikon.

                Kutlama hissi korunuyor ama ikonun rengi temadan
                geliyor ve her platformda aynı çiziliyor. */}
            <Ionicons name="sparkles" size={16} color={renkler.basari} />

            {/* ⭐ DEĞİŞTİ — biçimlendirme ortak fonksiyona geçti */}
            <Text style={styles.tasarrufYazi}>
              Bu siparişte {paraBicimle(indirimSayi)} tasarruf ettin!
            </Text>
          </View>
        )}
      </ScrollView>

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
  /* flexGrow + justifyContent: içerik kısaysa dikeyde ortalı kalıyor,
     uzunsa kaydırılıyor. Sadece flex:1 verseydik uzun içerik
     kırpılırdı; sadece flexGrow verseydik kısa içerik tepeye
     yapışırdı. */
  icerik: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: bosluk.genis,
  },
  tikKutu: {
    width: 96,
    height: 96,
    borderRadius: kose.tam,
    backgroundColor: renkler.basari,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: bosluk.genis,
  },
  /* 26 → yazi.dev (30): ölçekte 26 yok. Bu ekranın tek işi iyi haberi
     vermek; başlığın büyük olması doğru. */
  baslik: {
    fontSize: yazi.dev,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    textAlign: 'center',
  },
  altYazi: {
    fontSize: yazi.orta,
    color: renkler.yaziOrta,
    marginTop: bosluk.kucuk,
    marginBottom: bosluk.dev,
  },
  kutu: {
    width: '100%',
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
  },
  kutuSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: bosluk.orta,
    paddingVertical: bosluk.kucuk,
  },
  etiket: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
  },
  deger: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 6.13) — ÖDENEN TUTAR TURUNCU DEĞİL.
     Altında turuncu "Siparişlerime Git" butonu var; ikisi aynı
     renkte olunca hangisinin basılabilir olduğu renkten okunamıyordu.
     Aynı düzeltmenin sepet ve onay ekranındaki eşi. */
  degerVurgu: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },
  degerIndirim: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.basari,
  },
  tasarrufRozet: {
    width: '100%',
    backgroundColor: renkler.yumusakBasari,
    borderRadius: kose.orta,
    paddingVertical: bosluk.orta,
    paddingHorizontal: bosluk.normal,
    marginTop: bosluk.orta,

    /* ⭐ DEĞİŞTİ (4.7) — satır düzeni.
       Emoji metnin İÇİNDEYKEN tek bir Text yeterliydi. İkon ayrı bir
       öğe olduğu için varsayılan column düzeninde metnin ÜSTÜNE
       yığılırdı. */
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.kucuk,
  },
  tasarrufYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.basari,
    textAlign: 'center',
  },
  altBar: {
    padding: sayfaKenari,
    gap: bosluk.kucuk,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },
  siparisButon: {
    backgroundColor: renkler.anaRenk,
    paddingVertical: bosluk.normal,
    borderRadius: kose.orta,
    alignItems: 'center',
  },
  siparisYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },
  anaButon: {
    paddingVertical: bosluk.normal,
    borderRadius: kose.orta,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: renkler.inputKenar,
  },
  anaYazi: {
    color: renkler.yaziKoyu,
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },
});