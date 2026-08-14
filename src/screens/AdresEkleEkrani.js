import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiGet, apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';
import FormAlani from '../components/FormAlani';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

/* ============================================================
 *  YENİ ADRES EKLE
 *
 *  ⚠️ NEDEN AYRI EKRAN?
 *
 *  Form, Adreslerim listesinin İÇİNDE açılıyordu. İki sorun vardı:
 *  liste uzunsa form ekranın altında kalıyordu ve "vazgeç" ile
 *  "sil" aynı ekranda yan yana duruyordu. Ayrı ekran, formu tek
 *  başına ve tam boyda gösteriyor.
 *
 *  ⚠️ ADRES TÜRÜ ile BAŞLIK AYNI ALAN.
 *
 *  Tasarım referansında hem "Adres Başlığı" kutusu hem de altta
 *  "Ev / İş / Diğer" seçimi var. Bizde `title` TEK bir alan ve
 *  ikisini birden koymak aynı gerçeği iki yerden sormak olurdu:
 *  başlığa "Yazlık" yazıp türü "Ev" seçen müşterinin adresi hangisi?
 *  Çipler doğrudan başlığı yazıyor; "Diğer" seçilince serbest metin
 *  kutusu açılıyor.
 *
 *  ⚠️ İL / İLÇE / MAHALLE AÇILIR LİSTELERİ YOK.
 *
 *  Referansta üç kademeli seçim var ama arkasında bir idari birim
 *  tablosu gerekiyor (81 il, ~970 ilçe, on binlerce mahalle) ve
 *  bizde öyle bir veri yok. Uydurma bir liste koymak, seçilemeyen
 *  ilçeler yüzünden adres girilemez hale getirirdi. Şehir serbest
 *  metin kalıyor — sunucudaki alan da öyle.
 * ============================================================ */
export default function AdresEkleEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  // Seçili adres türü — aynı zamanda kaydedilecek başlık.
  // "Diğer" seçilince başlık elle yazılıyor (aşağıda).
  const [tur, setTur] = useState('Ev');
  const [ozelBaslik, setOzelBaslik] = useState('');
  const [acikAdres, setAcikAdres] = useState('');
  const [sehir, setSehir] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // Alan başına hata: hangi kutunun yanlış olduğu kutunun altında
  // yazsın diye (FormAlani'nın `hata` prop'u).
  const [hatalar, setHatalar] = useState({});

  // ⭐ Telefon defteri — adres numarayı REFERANS ediyor, kopyalamıyor.
  const [numaralar, setNumaralar] = useState([]);
  const [seciliTelefonId, setSeciliTelefonId] = useState(null);

  /* ⚠️ Ekran her odaklandığında yeniden çekiliyor: müşteri
     "Numaralarımı yönet" ile deftere gidip yeni numara ekleyip
     dönebilir. Sadece ilk açılışta çekseydik yeni numara listede
     görünmez ve neden seçemediğini anlamazdı. */
  useFocusEffect(
    useCallback(() => {
      let iptal = false;

      (async () => {
        try {
          const veri = await apiGet('/phones');
          if (iptal) return;

          setNumaralar(veri);

          // Varsayılan numara ön seçili gelsin.
          // ⚠️ Yalnızca HİÇ seçim yokken; müşteri başka bir numara
          // seçtiyse her odaklanmada onu ezmek olurdu.
          setSeciliTelefonId((onceki) => {
            if (onceki !== null) return onceki;
            const varsayilan = veri.find((n) => n.varsayilanMi) || veri[0];
            return varsayilan ? varsayilan.id : null;
          });
        } catch (hata) {
          console.log('Numaralar alınamadı:', hata.message);
        }
      })();

      return () => { iptal = true; };
    }, [])
  );

  // Kaydedilecek başlık: hazır tür ya da serbest metin.
  const baslik = tur === 'Diğer' ? ozelBaslik.trim() : tur;

  function dogrula() {
    const yeni = {};

    if (baslik.length < 2) {
      yeni.baslik = 'Adres başlığı en az 2 karakter olmalı.';
    }

    if (sehir.trim().length < 2) {
      yeni.sehir = 'Şehir gir.';
    }

    if (acikAdres.trim().length < 10) {
      yeni.acikAdres = 'Açık adres en az 10 karakter olmalı.';
    }

    // ⚠️ Ayrı mesaj: "tüm alanları doldur" demek, kayıtlı numarası
    // olmayan müşteriye ne yapacağını söylemiyor.
    if (!seciliTelefonId) {
      yeni.telefon = 'Kargo için bir numara seç. Numaran yoksa aşağıdan ekleyebilirsin.';
    }

    setHatalar(yeni);

    return Object.keys(yeni).length === 0;
  }

  async function kaydet() {
    if (!dogrula()) return;

    try {
      setKaydediliyor(true);

      await apiPost('/addresses', {
        title: baslik,
        fullAddress: acikAdres.trim(),
        city: sehir.trim(),
        phoneId: seciliTelefonId,
      });

      /* ⚠️ Başarı mesajı GÖSTERİLMİYOR, doğrudan geri dönülüyor.
         Liste ekranı odaklanınca kendini tazeliyor ve müşteri yeni
         adresini orada görüyor — "kaydedildi" diyen bir pencere,
         zaten görülecek bir şeyi ikinci kez söylemek olurdu. */
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

        <Text style={styles.ustBaslik}>Yeni Adres Ekle</Text>
      </View>

      {/* ⚠️ KeyboardAvoidingView: alttaki sabit kaydet butonu klavye
          açılınca gizlenmesin. behavior platforma göre — iOS'ta
          'padding', Android'de yerleşim zaten kendisi küçülüyor. */}
      <KeyboardAvoidingView
        style={styles.govde}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.icerik}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ⚠️ Görsel PAKETE GÖMÜLÜ (require), sunucudan gelmiyor:
              sabit bir tanıtım afişi, kampanya değil. Ağ olmadan da
              görünmeli. */}
          <View style={styles.gorselKap}>
            <Image
              source={require('../../assets/gorseller/adres-ekle.png')}
              style={styles.gorsel}
              resizeMode="cover"
            />
          </View>

          <View style={styles.kart}>
            {/* ---------- ADRES TÜRÜ ---------- */}
            <Text style={styles.etiket}>Adres Türü</Text>

            <View style={styles.turSatiri}>
              {[
                { ad: 'Ev', ikon: 'home' },
                { ad: 'İş', ikon: 'briefcase' },
                { ad: 'Diğer', ikon: 'heart' },
              ].map((t) => {
                const secili = tur === t.ad;

                return (
                  <TouchableOpacity
                    key={t.ad}
                    style={[styles.turKutu, secili && styles.turKutuSecili]}
                    onPress={() => setTur(t.ad)}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: secili }}
                  >
                    <View style={[styles.turIkon, secili && styles.turIkonSecili]}>
                      <Ionicons
                        name={t.ikon}
                        size={15}
                        color={secili ? renkler.anaRenkUstuYazi : renkler.yaziGri}
                      />
                    </View>

                    <Text style={[styles.turYazi, secili && styles.turYaziSecili]}>
                      {t.ad}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ⚠️ Serbest başlık YALNIZCA "Diğer" seçiliyken. Hep
                görünseydi Ev/İş seçen müşteri onu da doldurması
                gerektiğini sanırdı. */}
            {tur === 'Diğer' && (
              <View style={styles.ozelAlan}>
                <FormAlani
                  etiket="Adres Başlığı"
                  ikon="pricetag-outline"
                  placeholder="Yazlık, Annem..."
                  value={ozelBaslik}
                  onChangeText={setOzelBaslik}
                  maxLength={50}
                  hata={hatalar.baslik}
                />
              </View>
            )}

            <View style={styles.ayrac} />

            {/* ---------- ADRES ---------- */}
            <FormAlani
              etiket="Şehir"
              ikon="location-outline"
              placeholder="Denizli"
              value={sehir}
              onChangeText={setSehir}
              maxLength={60}
              hata={hatalar.sehir}
            />

            <FormAlani
              etiket="Açık Adres"
              ikon="map-outline"
              placeholder="Mahalle, sokak, bina ve daire no..."
              value={acikAdres}
              onChangeText={setAcikAdres}
              maxLength={300}
              cokSatirli
              hata={hatalar.acikAdres}
            />

            <View style={styles.ayrac} />

            {/* ---------- TELEFON ---------- */}
            {/* ⚠️ NUMARA EKLEME BURADA YOK, ayrı ekranda.
                Buraya da bir "numara ekle" formu koysaydık aynı form
                iki yerde yaşardı ve yarın doğrulama kuralı değişince
                biri unutulurdu. Bağlantı deftere gidiyor; bu ekran
                yığında durduğu için yazdıkların kaybolmuyor. */}
            <Text style={styles.etiket}>Kargo için aranacak numara</Text>

            {numaralar.length === 0 ? (
              <Text style={styles.numaraYok}>
                Kayıtlı numaran yok. Aşağıdan ekleyip geri dönebilirsin.
              </Text>
            ) : (
              <View style={styles.numaraListe}>
                {numaralar.map((n) => {
                  const secili = seciliTelefonId === n.id;

                  return (
                    <TouchableOpacity
                      key={n.id}
                      style={[styles.numaraSatir, secili && styles.numaraSatirSecili]}
                      onPress={() => setSeciliTelefonId(n.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: secili }}
                    >
                      <Ionicons
                        name={secili ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={secili ? renkler.anaRenk : renkler.yaziGri}
                      />
                      <Text style={styles.numaraYazi}>{n.gorunum}</Text>
                      <Text style={styles.numaraEtiket} numberOfLines={1}>{n.etiket}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {hatalar.telefon ? (
              <Text style={styles.hataYazi}>{hatalar.telefon}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.numaraYonet}
              onPress={() => navigation.navigate('Numaralarim')}
              hitSlop={6}
            >
              <Ionicons name="call-outline" size={16} color={renkler.anaRenk} />
              <Text style={styles.numaraYonetYazi}>Numaralarımı yönet</Text>
            </TouchableOpacity>
          </View>

          {/* Sunucudan gelen hata — alanlara bağlanamayanlar. */}
          {hatalar.genel ? (
            <Text style={styles.genelHata}>{hatalar.genel}</Text>
          ) : null}
        </ScrollView>

        {/* ⚠️ KAYDET BUTONU KAYDIRMA ALANININ DIŞINDA, ekranın dibinde
            sabit. İçeride olsaydı uzun formda müşterinin butonu
            görmek için sonuna kadar kaydırması gerekirdi. */}
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
              <Text style={styles.kaydetYazi}>Adresi Kaydet</Text>
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

  /* ⚠️ Ok mutlak konumda: akışta olsaydı başlığı sağa iter ve
     ortalama okun genişliğine bağlı kalırdı. */
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
     içerideki Image'ı kırpmıyor, köşeler kare kalıyor. */
  gorselKap: {
    borderRadius: kose.dev,
    overflow: 'hidden',
    backgroundColor: renkler.acikKart,
  },

  // Görsel 2:1 üretildi; oran burada sabit çünkü paketle birlikte
  // geliyor ve değişmiyor (kampanya afişlerinden farkı bu).
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

  /* ⚠️ FormAlani'nın kendi etiketiyle AYNI ölçüler: bu ekranda hem
     bileşenin etiketleri hem de elle yazılan iki başlık var
     ("Adres Türü", "Kargo için..."). Farklı görünselerdi form iki
     ayrı dilde konuşurdu. */
  etiket: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.kucuk,
  },

  /* ---------- ADRES TÜRÜ ---------- */

  turSatiri: {
    flexDirection: 'row',
    gap: bosluk.kucuk,
  },

  /* ⚠️ Seçili kutu KALIN kenarlık almıyor, RENK ve YUMUŞAK ZEMİN
     değiştiriyor — adres kartlarında verilen kararın aynısı.
     1px kalınlaşma kutuyu büyütür ve seçim değiştikçe satır zıplar. */
  turKutu: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    paddingVertical: bosluk.orta,
    paddingHorizontal: bosluk.kucuk,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    backgroundColor: renkler.kartArka,
  },

  turKutuSecili: {
    borderColor: renkler.anaRenk,
    backgroundColor: renkler.yumusakVurgu,
  },

  turIkon: {
    width: 26,
    height: 26,
    borderRadius: kose.tam,
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
  },

  turIkonSecili: {
    backgroundColor: renkler.anaRenk,
  },

  turYazi: {
    fontSize: yazi.normal,
    fontFamily: font.orta,
    color: renkler.yaziOrta,
    flexShrink: 1,
  },

  turYaziSecili: {
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  ozelAlan: {
    marginTop: bosluk.normal,
  },

  /* ⚠️ FormAlani alt boşluğunu (24) kendisi taşıyor; ayraç bu yüzden
     yalnızca ÜSTTEN boşluk alıyor. İkisine de verseydik bölümler
     arası 48dp'lik bir çukur oluşurdu. */
  ayrac: {
    height: 1,
    backgroundColor: renkler.kenarlik,
    marginTop: bosluk.normal,
    marginBottom: bosluk.normal,
  },

  /* ---------- TELEFON ---------- */

  numaraYok: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.yaziGri,
  },

  numaraListe: {
    gap: bosluk.kucuk,
  },

  numaraSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    paddingVertical: bosluk.orta,
    paddingHorizontal: bosluk.normal,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    backgroundColor: renkler.kartArka,
  },

  numaraSatirSecili: {
    borderColor: renkler.anaRenk,
    backgroundColor: renkler.yumusakVurgu,
  },

  numaraYazi: {
    flex: 1,
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
    letterSpacing: 0.5,
  },

  numaraEtiket: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    maxWidth: 90,
  },

  hataYazi: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.hata,
    marginTop: bosluk.kucuk,
  },

  numaraYonet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.mikro,
    marginTop: bosluk.normal,
  },

  numaraYonetYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.anaRenk,
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
    height: 52,
    borderRadius: kose.orta,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
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
