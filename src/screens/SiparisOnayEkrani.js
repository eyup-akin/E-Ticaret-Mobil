import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';
import { paraBicimle } from '../utils/bicimlendir';

export default function SiparisOnayEkrani({ route, navigation }) {
  const { adresId, kartId } = route.params;

  const { renkler } = useTema();

  const {
    sepet,
    toplamTutar,
    sepetiSifirla,

    // ⭐ YENİ — kupon bilgileri
    kupon,
    indirimTutari,
    odenecekTutar,
    kuponuKaldir,
  } = useSepet();

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
  //
  // kuponsuzDene parametresi neden var?
  //   Kupon reddedilirse kullanıcıya "kuponsuz devam edelim mi?" diye
  //   soruyoruz. Evet derse aynı fonksiyonu true ile tekrar çağırıyoruz.
  //
  //   Neden kuponuKaldir() çağırıp state'e güvenmiyoruz?
  //   React'te setState ANINDA etki etmez — bir sonraki render'da geçerli
  //   olur. kuponuKaldir() çağırıp hemen siparisiTamamla() dersek, fonksiyon
  //   hâlâ ESKİ kupon değerini görür ve aynı hatayı tekrar alırız.
  //   Parametre ile açıkça söylemek bu zamanlama tuzağını tamamen atlatır.
  async function siparisiTamamla(kuponsuzDene = false) {
    try {
      setGonderiliyor(true);

      // ⭐ SADECE KOD gönderiyoruz, indirim tutarını DEĞİL.
      //    Sunucu indirimi kendi hesaplıyor. Ön yüzden gelen para
      //    bilgisine güvenilmez — kullanıcı uygulamayı değiştirip
      //    "indirim: 999999" gönderebilir.
      //
      //    ?? null → kupon yoksa alan null gider, backend'deki
      //    string? CouponCode bunu "kupon kullanılmıyor" olarak anlar.
      const sonuc = await apiPost('/orders', {
        addressId: adresId,
        cardId: kartId,
        couponCode: kuponsuzDene ? null : (kupon?.kod ?? null),
      });

      sepetiSifirla(); // backend sepeti temizledi, ekranı da senkronla (kuponu da bırakır)

      // Başarı ekranına git (geri tuşuyla buraya dönemesin)
      navigation.replace('SiparisBasarili', {
        siparisId: sonuc.siparisId,   // detaya gitmek için gerekli (URL anahtarı)
        siparisNo: sonuc.siparisNo,   // ⭐ ekranda gösterilecek numara
        toplam: sonuc.toplam,

        // ⭐ YENİ — indirim dökümü.
        //    Sunucunun döndürdüğü değerleri taşıyoruz, kendi
        //    hesabımızı değil. Ekranda gösterilen sayı ile
        //    veritabanına yazılan sayı birebir aynı olsun.
        araToplam: sonuc.araToplam,
        indirim: sonuc.indirim,
        kuponKodu: sonuc.kuponKodu,
      });
    } catch (hata) {
      setGonderiliyor(false);

      // ⭐ HATA KODUNA GÖRE DAVRAN
      //
      // hata.kod'u api.js dolduruyor: backend cevabındaki "kod" alanını
      // Error nesnesine iliştiriyor. Metne bakarak karar vermiyoruz —
      // mesaj metni değişebilir, kod değişmez.
      if (hata.kod === 'KUPON_GECERSIZ') {
        Alert.alert(
          'Kupon uygulanamadı',
          hata.message + '\n\nSiparişi kuponsuz tamamlamak ister misin?',
          [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Kuponsuz devam et',
              onPress: () => {
                kuponuKaldir();           // ekrandaki kuponu temizle
                siparisiTamamla(true);    // state'i beklemeden tekrar dene
              },
            },
          ]
        );
        return;
      }

      // Stok yetersizliği gibi diğer hatalar burada yakalanır
      Alert.alert('Sipariş verilemedi', hata.message);
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
                  {paraBicimle(s.productPrice * s.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ⭐ YENİ — KUPON BÖLÜMÜ
            Sadece kupon uygulanmışsa görünür. Türetilmiş koşul:
            kupon nesnesinin varlığı zaten bilginin kendisi,
            ayrı bir "kuponVarMi" state'ine gerek yok. */}
        {kupon !== null && (
          <View style={styles.bolum}>
            <Text style={styles.bolumBaslik}>Kupon</Text>
            <View style={[styles.kutu, styles.kuponKutu]}>
              <Ionicons name="pricetag" size={20} color={renkler.basari} />
              <View style={styles.kuponOrta}>
                <Text style={styles.kuponKod}>{kupon.kod}</Text>
                <Text style={styles.kuponAciklama} numberOfLines={1}>
                  {kupon.aciklama}
                </Text>
              </View>
              <Text style={styles.kuponIndirim}>−{paraBicimle(indirimTutari)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.altBar}>
        {/* ⭐ YENİ — İndirim varsa döküm göster, yoksa tek satır.
            "İndirim: 0,00 ₺" yazmak gereksiz gürültü olurdu. */}
        {indirimTutari > 0 && (
          <>
            <View style={styles.ozetSatir}>
              <Text style={styles.ozetEtiket}>Ara toplam</Text>
              <Text style={styles.ozetDeger}>{paraBicimle(toplamTutar)}</Text>
            </View>

            <View style={styles.ozetSatir}>
              <Text style={styles.ozetEtiket}>İndirim</Text>
              <Text style={[styles.ozetDeger, { color: renkler.basari }]}>
                −{paraBicimle(indirimTutari)}
              </Text>
            </View>

            <View style={styles.ayirac} />
          </>
        )}

        <View style={styles.toplamSatir}>
          <Text style={styles.toplamEtiket}>
            {indirimTutari > 0 ? 'Ödenecek' : 'Toplam'}
          </Text>
          <Text style={styles.toplamTutar}>{paraBicimle(odenecekTutar)}</Text>
        </View>

        <TouchableOpacity
          style={styles.tamamlaButon}
          onPress={() => siparisiTamamla(false)}
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


  /* ---------- KUPON KUTUSU ---------- */

  kuponKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: renkler.basari,
  },
  kuponOrta: {
    flex: 1,
  },
  kuponKod: {
    fontSize: 15,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    letterSpacing: 0.5,
  },
  kuponAciklama: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginTop: 2,
  },
  kuponIndirim: {
    fontSize: 15,
    fontWeight: 'bold',
    color: renkler.basari,
  },


  /* ---------- ALT BAR ---------- */

  altBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },
  ozetSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ozetEtiket: {
    fontSize: 14,
    color: renkler.yaziOrta,
  },
  ozetDeger: {
    fontSize: 14,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  ayirac: {
    height: 1,
    backgroundColor: renkler.kenarlik,
    marginVertical: 8,
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