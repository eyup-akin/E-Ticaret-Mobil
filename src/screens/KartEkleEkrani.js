import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';
import FormAlani from '../components/FormAlani';
import { tarihFormatla, tarihiParcala, numaraFormatla, numarayiTemizle } from '../services/kartYardimci';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

/* ============================================================
 *  YENİ KART EKLE
 *
 *  ⚠️ NEDEN AYRI EKRAN? Gerekçe AdresEkleEkrani'nda: form
 *  Kartlarım listesinin içinde açılıyordu ve liste uzunsa ekranın
 *  altında kalıyordu.
 *
 *  ⚠️ "KARTI KAYDET" AÇMA/KAPAMA DÜĞMESİ YOK — bilerek.
 *
 *  Tasarım referansında "Bu kartı kaydet ve gelecekte hızlıca kullan"
 *  diye bir anahtar var. Bizde bu ekranın TEK işi kart kaydetmek;
 *  kapalı konumda hiçbir şey yapmayan bir düğme koymak, müşteriye
 *  olmayan bir seçim sunmak olurdu. Tek seferlik ödeme akışı
 *  eklendiği gün anlamlı hale gelir.
 *
 *  ⚠️ KART NUMARASI VE CVV SUNUCUYA GİDİYOR AMA SAKLANMIYOR.
 *  Backend yalnızca son 4 haneyi tutuyor. Bu ekrandaki güvenlik
 *  notu o gerçeği anlatıyor — süs değil.
 * ============================================================ */
export default function KartEkleEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [sahip, setSahip] = useState('');
  const [numara, setNumara] = useState('');
  const [tarih, setTarih] = useState('');     // "05/31" biçiminde
  const [cvv, setCvv] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  /* ⭐ DEĞİŞTİ — hatalar `Alert.alert` yerine alanların ALTINDA.
   *
   * ⚠️ Eski hâli pencere açıyordu: ekranı kaplıyor, kapatmak için
   * bir dokunuş istiyor ve kapandığında HANGİ alanın yanlış olduğunu
   * söylemiyordu. Dört alanlı bir kart formunda "Geçersiz kart"
   * demek, müşteriyi dördünü de gözden geçirmeye mahkûm ediyordu. */
  const [hatalar, setHatalar] = useState({});

  function dogrula() {
    const temizNumara = numarayiTemizle(numara);
    const tarihBilgi = tarihiParcala(tarih);
    const yeni = {};

    if (sahip.trim().length < 3) {
      yeni.sahip = 'Kart üzerindeki ismi gir.';
    }

    if (temizNumara.length !== 16) {
      yeni.numara = 'Kart numarası 16 haneli olmalı.';
    }

    if (!tarihBilgi) {
      yeni.tarih = 'AA/YY şeklinde gir (örnek: 05/31).';
    }

    // ⚠️ 3 VEYA 4 hane: American Express 4 haneli CVV kullanıyor.
    // Sadece 3 dayatmak o kartları tamamen dışarıda bırakırdı.
    if (cvv.length < 3 || cvv.length > 4) {
      yeni.cvv = 'CVV 3 veya 4 haneli olmalı.';
    }

    setHatalar(yeni);

    return Object.keys(yeni).length === 0;
  }

  async function kaydet() {
    if (!dogrula()) return;

    const temizNumara = numarayiTemizle(numara);
    const tarihBilgi = tarihiParcala(tarih);

    try {
      setKaydediliyor(true);

      await apiPost('/cards', {
        cardHolderName: sahip.trim(),
        cardNumber: temizNumara,   // backend SADECE son 4 haneyi saklar
        expiryMonth: tarihBilgi.ay,
        expiryYear: tarihBilgi.yil,
        cvv: cvv,                  // backend ASLA saklamaz
      });

      /* ⚠️ HASSAS VERİ HEMEN TEMİZLENİYOR.
         Ekran geri dönerken yığından kalkıyor ama React state'i o an
         serbest bırakılmıyor; numara ve CVV bir süre daha bellekte
         kalırdı. Elle sıfırlamak o pencereyi kapatıyor. */
      setNumara('');
      setCvv('');
      setTarih('');
      setSahip('');

      navigation.goBack();
    } catch (hata) {
      setHatalar({ genel: hata.message });
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.geriButon}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <Text style={styles.ustBaslik}>Yeni Kart Ekle</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.govde}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.icerik}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ⚠️ Görsel pakete gömülü (require): sabit bir tanıtım
              afişi, kampanya değil. Ağ olmadan da görünmeli. */}
          <View style={styles.gorselKap}>
            <Image
              source={require('../../assets/gorseller/kart-ekle.png')}
              style={styles.gorsel}
              resizeMode="cover"
            />
          </View>

          <View style={styles.kart}>
            {/* ⚠️ `numaraFormatla` dörderli gruplama yapıyor
                ("1234 5678 ..."). Ham hâlde 16 hane tek blok olarak
                okunmuyor ve müşteri yazdığını kartıyla
                karşılaştıramıyor. */}
            <FormAlani
              etiket="Kart Numarası"
              ikon="card-outline"
              placeholder="1234 5678 9012 3456"
              value={numara}
              onChangeText={(m) => setNumara(numaraFormatla(m))}
              keyboardType="number-pad"

              // 16 hane + 3 boşluk
              maxLength={19}
              hata={hatalar.numara}
            />

            <FormAlani
              etiket="Kart Üzerindeki İsim"
              ikon="person-outline"
              placeholder="Ad Soyad"
              value={sahip}
              onChangeText={setSahip}
              autoCapitalize="characters"
              maxLength={100}
              hata={hatalar.sahip}
            />

            {/* ⚠️ İkisi yan yana: tarih ve CVV kartın AYNI yüzünde
                değil ama birlikte girilen kısa alanlar. Alt alta
                koymak formu gereksiz uzatırdı. */}
            <View style={styles.ikili}>
              <View style={styles.ikiliYarim}>
                <FormAlani
                  etiket="Son Kullanma"
                  ikon="calendar-outline"
                  placeholder="AA/YY"
                  value={tarih}
                  onChangeText={(m) => setTarih(tarihFormatla(m))}
                  keyboardType="number-pad"
                  maxLength={5}
                  hata={hatalar.tarih}
                />
              </View>

              <View style={styles.ikiliYarim}>
                <FormAlani
                  etiket="CVV"
                  ikon="lock-closed-outline"
                  placeholder="123"
                  value={cvv}
                  onChangeText={(m) => setCvv(m.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={4}

                  /* ⚠️ CVV gizli yazılıyor: omuz üstünden bakan biri
                     kartın en kritik üç hanesini okuyamasın. Kart
                     numarası açık çünkü müşteri 16 haneyi gizli
                     yazarken hata yaptığını fark edemez. */
                  secureTextEntry
                  hata={hatalar.cvv}
                />
              </View>
            </View>

            {/* ---------- GÜVENLİK NOTU ---------- */}
            {/* ⚠️ Bu metin bir PAZARLAMA CÜMLESİ DEĞİL, gerçeğin
                kendisi: backend kart numarasını ve CVV'yi
                saklamıyor, yalnızca son 4 haneyi tutuyor. Tasarım
                referansındaki "256-bit SSL" ifadesi kullanılmadı —
                doğrulayamadığımız bir teknik iddia. */}
            <View style={styles.guvenlikKutu}>
              <View style={styles.guvenlikIkon}>
                <Ionicons name="shield-checkmark" size={18} color={renkler.basari} />
              </View>

              <View style={styles.guvenlikMetin}>
                <Text style={styles.guvenlikBaslik}>Kart bilgilerin saklanmıyor</Text>
                <Text style={styles.guvenlikYazi}>
                  Kart numaran ve CVV'n kaydedilmez; yalnızca son 4 hane
                  ve son kullanma tarihi tutulur.
                </Text>
              </View>
            </View>
          </View>

          {hatalar.genel ? (
            <Text style={styles.genelHata}>{hatalar.genel}</Text>
          ) : null}
        </ScrollView>

        <View style={styles.altBar}>
          <TouchableOpacity
            style={[styles.kaydetButon, kaydediliyor && styles.kaydetButonPasif]}
            onPress={kaydet}
            disabled={kaydediliyor}
            activeOpacity={0.85}
          >
            {kaydediliyor ? (
              <ActivityIndicator color={renkler.anaRenkUstuYazi} />
            ) : (
              <>
                <Ionicons name="lock-closed" size={17} color={renkler.anaRenkUstuYazi} />
                <Text style={styles.kaydetYazi}>Kartı Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: renkler.arkaPlan },

  govde: { flex: 1 },

  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sayfaKenari,
    paddingTop: bosluk.kucuk,
    paddingBottom: bosluk.kucuk,
  },

  geriButon: {
    position: 'absolute',
    left: sayfaKenari,
    zIndex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  ustBaslik: {
    flex: 1,
    textAlign: 'center',
    fontSize: yazi.orta,
    lineHeight: satir.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  icerik: {
    padding: sayfaKenari,
    paddingBottom: bosluk.dev,
  },

  /* ⚠️ `overflow: 'hidden'` şart: borderRadius tek başına Android'de
     içerideki Image'ı kırpmıyor. */
  gorselKap: {
    borderRadius: kose.dev,
    overflow: 'hidden',
    backgroundColor: renkler.acikKart,
  },

  gorsel: {
    width: '100%',
    aspectRatio: 2,
  },

  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.dev,
    padding: bosluk.normal,
    marginTop: bosluk.normal,
    ...renkler.golgeSm,
  },

  ikili: {
    flexDirection: 'row',
    gap: bosluk.orta,
  },

  ikiliYarim: {
    flex: 1,
  },

  /* ---------- GÜVENLİK NOTU ---------- */

  guvenlikKutu: {
    flexDirection: 'row',
    gap: bosluk.orta,
    padding: bosluk.normal,
    borderRadius: kose.orta,
    backgroundColor: renkler.yumusakBasari,
  },

  guvenlikIkon: {
    // ⚠️ Üstten hizalı: iki satırlık metinde ortada asılı kalmasın.
    marginTop: 1,
  },

  guvenlikMetin: {
    flex: 1,
    minWidth: 0,
  },

  guvenlikBaslik: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: 2,
  },

  guvenlikYazi: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
  },

  genelHata: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.hata,
    textAlign: 'center',
    marginTop: bosluk.normal,
  },

  /* ---------- ALT BAR ---------- */

  altBar: {
    paddingHorizontal: sayfaKenari,
    paddingTop: bosluk.orta,
    paddingBottom: bosluk.orta,
    backgroundColor: renkler.kartArka,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
  },

  kaydetButon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.kucuk,
    height: 52,
    borderRadius: kose.orta,
    backgroundColor: renkler.anaRenk,
  },

  kaydetButonPasif: {
    opacity: 0.6,
  },

  kaydetYazi: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.anaRenkUstuYazi,
  },
});
