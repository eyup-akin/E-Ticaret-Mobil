import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiGet, apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';
import FormAlani from '../components/FormAlani';
import { sehirAra } from '../data/sehirler';   // ⭐ YENİ
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
 *  ⚠️ İL SEÇİLİYOR, İLÇE VE MAHALLE YOK.
 *
 *  Referansta üç kademeli seçim var. İl listesi (81 kayıt) pakete
 *  gömüldü — değişmeyen, küçük bir veri. İlçe (~970) ve mahalle (on
 *  binlerce) ise o ölçekte gerçekten sunucuya ait ve sunucudaki
 *  `city` alanı da tek bir metin; ilçe eklemek veri modelini
 *  değiştirmeyi gerektirir.
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

  /* ⭐ YENİ — ŞEHİR ARTIK SERBEST METİN DEĞİL, LİSTEDEN SEÇİM.
   *
   * ⚠️ Serbest metinken "Denizli", "denizli", "DENİZLİ" ve "Dnizli"
   * hepsi kaydedilebiliyordu. Bu alan sipariş adresine DONUYOR ve
   * kargo etiketine basılıyor; yazım hatası oraya kadar gidiyordu.
   * Ayrıca "hangi ilde kaç sipariş" raporu, aynı ilin dört farklı
   * yazımını dört ayrı il sayardı.
   *
   * ⚠️ Sunucudaki alan HÂLÂ serbest metin — doğrulama eklenmedi.
   * Eski kayıtlar farklı yazımlarla dolu ve sunucuda kilit açmak
   * onları geçersiz kılardı. Kilit ön yüzde: yeni adresler artık
   * temiz giriyor, eskiler olduğu gibi duruyor. */
  const [sehirSeciciAcik, setSehirSeciciAcik] = useState(false);
  const [sehirArama, setSehirArama] = useState('');
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

    if (sehir === '') {
      yeni.sehir = 'Listeden şehir seç.';
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
        city: sehir,   // ⚠️ listeden geldi, trim'e gerek yok
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
        {/* ⭐ DEĞİŞTİ — GÖRSEL ARTIK KAYDIRMA ALANININ DIŞINDA.
            ⚠️ İçerideyken hem devasa duruyordu (tam genişlikte 2:1,
            yani ekranın dörtte biri) hem de forma inerken yukarı
            kayıp gidiyordu. Şimdi üst barın hemen altında SABİT: bir
            afiş gibi duruyor, kaydırılan yalnızca form.
            ⚠️ Yükseklik SABİT ve `cover` ile kırpılıyor — afişin
            yazısı dikeyde ortalı olduğu için üst/alt kırpma metni
            götürmüyor.
            ⚠️ Görsel PAKETE GÖMÜLÜ (require): sabit bir tanıtım
            afişi, kampanya değil. Ağ olmadan da görünmeli. */}
        <View style={styles.gorselKap}>
          <Image
            source={require('../../assets/gorseller/adres-ekle.png')}
            style={styles.gorsel}
            resizeMode="cover"
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.icerik}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            {/* ⭐ DEĞİŞTİ — YAZILAN DEĞİL, SEÇİLEN ŞEHİR.
                ⚠️ `FormAlani` KULLANILMADI: o bileşen bir TextInput
                sarıyor ve buradaki kutu yazı almıyor, dokununca liste
                açıyor. Görünümü aynı tutmak için ölçüler elle
                eşleştirildi — bileşene "aslında input değil" diye bir
                mod eklemek, dört ekranda kullanılan sözleşmeyi
                bulandırırdı. */}
            <View style={styles.alan}>
              <Text style={styles.etiket}>Şehir</Text>

              <TouchableOpacity
                style={[styles.secKutu, hatalar.sehir && styles.secKutuHatali]}
                onPress={() => { setSehirArama(''); setSehirSeciciAcik(true); }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={sehir ? `Şehir: ${sehir}. Değiştir` : 'Şehir seç'}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={hatalar.sehir ? renkler.hata : renkler.yaziGri}
                />

                {/* ⚠️ Seçilmemişken yazı GRİ (yer tutucu gibi), seçilince
                    normal metin rengi. Aynı renkte bırakmak "Şehir seç"
                    ifadesini girilmiş bir değer gibi gösterirdi. */}
                <Text style={[styles.secYazi, !sehir && styles.secYaziBos]}>
                  {sehir || 'Şehir seç'}
                </Text>

                <Ionicons name="chevron-down" size={18} color={renkler.yaziGri} />
              </TouchableOpacity>

              {hatalar.sehir ? (
                <Text style={styles.hataYazi}>{hatalar.sehir}</Text>
              ) : null}
            </View>

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

      {/* ---------- ŞEHİR SEÇİCİ ----------
          ⚠️ `Modal` kullanıldı, yeni bir EKRAN değil: seçim bir ara
          adım, geçmişte kendi yeri olmamalı. Ayrı ekran olsaydı geri
          tuşuna basan müşteri formdan da çıkabilirdi.
          ⚠️ `animationType="slide"` ve alttan gelen yaprak: telefonda
          liste seçimi bu şekilde bekleniyor. */}
      <Modal
        visible={sehirSeciciAcik}
        animationType="slide"
        transparent
        onRequestClose={() => setSehirSeciciAcik(false)}
      >
        {/* ⚠️ Perdeye basınca kapanıyor — modalda beklenen davranış.
            Yaprağın kendisi `onStartShouldSetResponder` ile dokunmayı
            yutuyor; olmasaydı listeye basmak da pencereyi kapatırdı. */}
        <TouchableOpacity
          style={styles.perde}
          activeOpacity={1}
          onPress={() => setSehirSeciciAcik(false)}
        >
          <View
            style={styles.yaprak}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.yaprakTutamac} />

            <Text style={styles.yaprakBaslik}>Şehir seç</Text>

            <View style={styles.aramaKutu}>
              <Ionicons name="search" size={18} color={renkler.yaziGri} />

              {/* ⚠️ `autoFocus`: pencere açılır açılmaz klavye gelsin.
                  81 il arasından fare gibi kaydırarak aramak yerine
                  müşteri doğrudan yazmaya başlayabilsin.
                  ⚠️ `autoCorrect` KAPALI: telefon "Muş"u "Mus" diye
                  düzeltmeye çalışıyordu. */}
              <TextInput
                style={styles.aramaGirdi}
                placeholder="İl ara..."
                placeholderTextColor={renkler.yaziGri}
                value={sehirArama}
                onChangeText={setSehirArama}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
              />

              {sehirArama !== '' && (
                <TouchableOpacity onPress={() => setSehirArama('')} hitSlop={10}>
                  <Ionicons name="close-circle" size={18} color={renkler.yaziGri} />
                </TouchableOpacity>
              )}
            </View>

            {/* ⚠️ FlatList, ScrollView DEĞİL: 81 satırın tamamını bir
                anda çizmek gereksiz. Arama daralttıkça liste kısalıyor
                ama boşken hepsi geliyor. */}
            <FlatList
              data={sehirAra(sehirArama)}
              keyExtractor={(x) => x}
              keyboardShouldPersistTaps="handled"
              style={styles.sehirListe}
              ListEmptyComponent={
                <Text style={styles.sonucYok}>Bu aramaya uyan il yok.</Text>
              }
              renderItem={({ item }) => {
                const secili = item === sehir;

                return (
                  <TouchableOpacity
                    style={styles.sehirSatir}
                    onPress={() => {
                      setSehir(item);
                      setSehirSeciciAcik(false);

                      // ⚠️ Hata varsa hemen temizleniyor: müşteri
                      // düzeltti, kırmızı yazının kaydet'e basana
                      // kadar durması cezalandırıcı olurdu.
                      setHatalar((o) => ({ ...o, sehir: undefined }));
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: secili }}
                  >
                    <Text style={[styles.sehirYazi, secili && styles.sehirYaziSecili]}>
                      {item}
                    </Text>

                    {secili && (
                      <Ionicons name="checkmark" size={20} color={renkler.anaRenk} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginHorizontal: sayfaKenari,
    marginBottom: bosluk.kucuk,
    borderRadius: kose.dev,
    overflow: 'hidden',
    backgroundColor: renkler.acikKart,
  },

  /* ⭐ DEĞİŞTİ — `aspectRatio: 2` yerine SABİT YÜKSEKLİK.
     ⚠️ Oranla çizilince tam genişlikte ~200dp oluyordu; ekranın
     dörtte biri bir tanıtım afişine gidiyordu. 132 hem afişi
     tanınır bırakıyor hem forma yer açıyor.
     ⚠️ Bu tek sayı ayarlanabilir: afiş küçük/büyük gelirse
     değiştirilecek yer burası. */
  gorsel: {
    width: '100%',
    height: 132,
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

  /* ---------- ŞEHİR SEÇİCİ ---------- */

  /* ⚠️ Ölçüler `FormAlani`'nınkiyle ELLE eşleştirildi (yükseklik 48,
     kenarlık 1, köşe orta). İki kutu yan yana duruyor ve biri bir
     piksel farklı olsaydı form eğri görünürdü. Bileşeni
     kullanamıyoruz çünkü bu kutu yazı almıyor. */
  alan: {
    marginBottom: bosluk.genis,
  },

  secKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    height: 48,
    paddingHorizontal: bosluk.normal,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    backgroundColor: renkler.kartArka,
  },

  // ⚠️ Kalınlık DEĞİL renk değişiyor: 1→2px kutuyu büyütür ve hata
  // çıktığında form bir piksel zıplardı (FormAlani'ndaki kararın
  // aynısı).
  secKutuHatali: {
    borderColor: renkler.hata,
  },

  secYazi: {
    flex: 1,
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
  },

  secYaziBos: {
    color: renkler.yaziGri,
  },

  /* ---------- SEÇİCİ PENCERESİ ---------- */

  /* ⚠️ Perde rengi ELLE yazılmış rgba ve bilerek: iki temada da
     SİYAH olmalı. Koyu temada açık bir perde, altındaki ekranı
     karartmak yerine aydınlatırdı. (Banner nokta hapıyla aynı
     gerekçe.) */
  perde: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },

  /* ⚠️ Yükseklik ORANLI (%75): sabit bir sayı küçük telefonda
     ekranı taşırır, büyük telefonda listeyi gereksiz kısaltırdı. */
  yaprak: {
    maxHeight: '75%',
    backgroundColor: renkler.kartArka,
    borderTopLeftRadius: kose.dev,
    borderTopRightRadius: kose.dev,
    paddingHorizontal: bosluk.normal,
    paddingTop: bosluk.orta,
    paddingBottom: bosluk.normal,
  },

  // Aşağı çekilebileceğini ima eden küçük çubuk.
  yaprakTutamac: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: kose.tam,
    backgroundColor: renkler.kenarlik,
    marginBottom: bosluk.orta,
  },

  yaprakBaslik: {
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.orta,
  },

  aramaKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    height: 44,
    paddingHorizontal: bosluk.normal,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    backgroundColor: renkler.acikKart,
    marginBottom: bosluk.kucuk,
  },

  aramaGirdi: {
    flex: 1,
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
  },

  sehirListe: {
    // ⚠️ flexGrow: 0 — yaprak maxHeight ile sınırlı ve liste kalan
    // alanı yutmaya çalışmasın.
    flexGrow: 0,
  },

  sehirSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: bosluk.orta,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },

  sehirYazi: {
    fontSize: yazi.orta,
    color: renkler.yaziOrta,
  },

  sehirYaziSecili: {
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  sonucYok: {
    fontSize: yazi.normal,
    color: renkler.yaziGri,
    textAlign: 'center',
    paddingVertical: bosluk.genis,
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
