import React, { useState, useCallback } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { apiGet, apiPost, apiDelete } from '../services/api';
import OnayPenceresi from '../components/OnayPenceresi';

export default function AdresSecEkrani({ route, navigation }) {
  // siparisAkisi parametresi varsa SEÇİM modu, yoksa YÖNETİM modu
  const secimModu = route.params?.siparisAkisi === true;
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [adresler, setAdresler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliId, setSeciliId] = useState(null);

  // Yeni adres formu
  const [formAcik, setFormAcik] = useState(false);
  const [baslik, setBaslik] = useState('');
  const [acikAdres, setAcikAdres] = useState('');
  const [sehir, setSehir] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // ⭐ YENİ (4.9) — telefon artık serbest metin DEĞİL, defterden seçim.
  //
  // ⚠️ Eskiden burada `telefon` diye bir metin state'i vardı ve her
  // adres kendi numara KOPYASINI taşıyordu. Müşteri numarasını
  // değiştirince bütün adresleri tek tek düzeltmesi gerekiyordu.
  const [numaralar, setNumaralar] = useState([]);
  const [seciliTelefonId, setSeciliTelefonId] = useState(null);

  // ⭐ YENİ (GV/Faz 6.8) — silinecek adres. null = pencere kapalı.
  //
  // ⚠️ Alert.alert yerine OnayPenceresi. Sistem penceresi koyu temada
  // bile beyaz açılıyor, markanın turuncusu yerine sistemin mavisini
  // kullanıyor ve Android'de butonları büyük harfe çeviriyordu.
  // Aynı değişiklik sepette de yapılmıştı; iki ekranda iki farklı
  // onay penceresi olmasın.
  const [silinecek, setSilinecek] = useState(null);

  async function adresleriGetir() {
    try {
      const veri = await apiGet('/addresses');
      setAdresler(veri);
      // Tek adres varsa otomatik seç
      if (secimModu && veri.length === 1) setSeciliId(veri[0].id);
    } catch (hata) {
      console.log('Adresler alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // ⭐ YENİ (4.9) — telefon defteri.
  //
  // ⚠️ Ekran her odaklandığında yeniden çekiliyor: müşteri
  // "Numaralarımı yönet" bağlantısıyla defterine gidip yeni bir
  // numara ekleyip dönebilir. Sadece ilk açılışta çekseydik yeni
  // numara listede görünmez ve müşteri onu neden seçemediğini
  // anlamazdı.
  async function numaralariGetir() {
    try {
      const veri = await apiGet('/phones');
      setNumaralar(veri);

      // Varsayılan numara ön seçili gelsin: müşterinin çoğu
      // adresinde aranacak numara zaten asıl numarasıdır.
      //
      // ⚠️ Sadece HİÇ seçim yokken; müşteri başka bir numara
      // seçtiyse her odaklanmada onu ezmek olurdu.
      setSeciliTelefonId((onceki) => {
        if (onceki !== null) return onceki;
        const varsayilan = veri.find((n) => n.varsayilanMi) || veri[0];
        return varsayilan ? varsayilan.id : null;
      });
    } catch (hata) {
      console.log('Numaralar alınamadı:', hata.message);
    }
  }

  useFocusEffect(
    useCallback(() => {
      adresleriGetir();
      numaralariGetir();
    }, [])
  );

  async function adresEkle() {
    if (!baslik || !acikAdres || !sehir) {
      Alert.alert('Eksik bilgi', 'Tüm alanları doldur.');
      return;
    }
    // ⚠️ Ayrı mesaj: "tüm alanları doldur" demek, seçilecek bir
    // numarası olmayan müşteriye ne yapacağını söylemiyor.
    if (!seciliTelefonId) {
      Alert.alert(
        'Telefon gerekli',
        'Kargo için bir numara seçmelisin. Numaran yoksa "Numaralarımı yönet" ile ekleyebilirsin.'
      );
      return;
    }
    try {
      setKaydediliyor(true);
      await apiPost('/addresses', {
        title: baslik,
        fullAddress: acikAdres,
        city: sehir,
        phoneId: seciliTelefonId,   // ⭐ DEĞİŞTİ (4.9)
      });
      setBaslik('');
      setAcikAdres('');
      setSehir('');
      setFormAcik(false);
      await adresleriGetir();
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  function devamEt() {
    if (!seciliId) {
      Alert.alert('Adres seç', 'Devam etmek için bir teslimat adresi seçmelisin.');
      return;
    }
    navigation.navigate('KartSec', { adresId: seciliId });
  }

  async function adresiSil(item) {
    try {
      await apiDelete('/addresses/' + item.id);
      await adresleriGetir();
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    }
  }

  /* ⭐ DEĞİŞTİ (GV/Faz 6.8) — ADRES KARTI TASARIMA ÇEVRİLDİ.

     Yerleşim: başlık solda, seçim işareti SAĞDA; altında adres ve
     telefon.

     ⚠️ Radyo düğmesi sola değil sağa alındı. Tasarımın tercihi ve
     sebebi var: göz önce "Ev / İş" etiketini okuyup hangi adres
     olduğunu anlıyor, seçim işareti ondan sonra geliyor. Solda
     dururken ilk okunan şey boş bir daireydi.

     ⚠️ Seçili kart KALIN kenarlık almıyor, RENK ve YUMUŞAK ZEMİN
     değiştiriyor. Eskiden seçilince borderWidth 1'den 2'ye çıkıyordu
     ve kart 1px büyüyüp altındakileri aşağı itiyordu — seçim
     değiştikçe liste zıplıyordu. */
  function adresKarti(item) {
    const secili = seciliId === item.id;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.kart, secimModu && secili && styles.kartSecili]}
        onPress={() => secimModu && setSeciliId(item.id)}
        activeOpacity={secimModu ? 0.85 : 1}
        accessibilityRole={secimModu ? 'radio' : undefined}
        accessibilityState={secimModu ? { selected: secili } : undefined}
      >
        <View style={styles.kartUst}>
          <Text style={styles.adresBaslik} numberOfLines={1}>{item.title}</Text>

          {secimModu ? (
            <Ionicons
              name={secili ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={secili ? renkler.anaRenk : renkler.yaziGri}
            />
          ) : (
            /* Yönetim modunda seçim yok, silme var. İki mod aynı
               köşeyi kullanıyor: kartın sağ üstü "bu karta dair
               eylem" yeri. */
            <TouchableOpacity
              onPress={() => setSilinecek(item)}
              hitSlop={8}
              accessibilityLabel="Adresi sil"
            >
              <Ionicons name="trash-outline" size={20} color={renkler.hata} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.adresMetin}>{item.fullAddress}</Text>
        <Text style={styles.adresSehir}>{item.city}</Text>

        {item.phone ? <Text style={styles.adresTelefon}>{item.phone}</Text> : null}
      </TouchableOpacity>
    );
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
      {/* ⚠️ G3'ün tersi burada geçerli: bu bir ALT EKRAN, sekme kökü
          değil — geri oku DURUYOR. Sepetim'de kaldırılmıştı çünkü
          orası sekme kökü. */}
      <View style={styles.ustBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.geriButon}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <View style={styles.ustOrta}>
          <Text style={styles.ustBaslik}>
            {secimModu ? 'Teslimat Adresi' : 'Adreslerim'}
          </Text>

          {/* Adım göstergesi başlığın ALTINA, küçük punto ile taşındı.
              Ayrı bir satırdayken içerikle başlık arasında sahipsiz
              duruyordu; artık başlığın alt satırı. */}
          {secimModu && <Text style={styles.adimYazi}>1 / 3 — Adres seç</Text>}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.kapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ⭐ DEĞİŞTİ (GV/Faz 6.8) — FlatList KALDIRILDI.

            Liste zaten scrollEnabled={false} ile bir ScrollView'un
            içindeydi: sanallaştırma çalışmıyordu, üstelik React Native
            bu iç içe geçmeyi konsolda uyarı olarak basıyor. Adres
            sayısı bir avuç; düz map doğru araç. */}
        <ScrollView
          contentContainerStyle={styles.icerik}
          keyboardShouldPersistTaps="handled"
        >
          {adresler.length === 0 && !formAcik && (
            <Text style={styles.bosYazi}>
              Henüz adresin yok. Aşağıdan ekleyebilirsin.
            </Text>
          )}

          {adresler.map(adresKarti)}

          {formAcik ? (
            <View style={styles.form}>
              <Text style={styles.formBaslik}>Yeni Adres</Text>

              <TextInput
                style={styles.input}
                placeholder="Başlık (Ev, İş...)"
                placeholderTextColor={renkler.yaziGri}
                value={baslik}
                onChangeText={setBaslik}
              />
              <TextInput
                style={[styles.input, styles.inputCok]}
                placeholder="Açık adres"
                placeholderTextColor={renkler.yaziGri}
                value={acikAdres}
                onChangeText={setAcikAdres}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Şehir"
                placeholderTextColor={renkler.yaziGri}
                value={sehir}
                onChangeText={setSehir}
              />
              {/* ⭐ DEĞİŞTİ (4.9) — TELEFON ARTIK YAZILMIYOR, SEÇİLİYOR.

                  ⚠️ Serbest metin alanı kaldırıldı çünkü her adres
                  numaranın kendi kopyasını taşıyordu: müşteri
                  numarasını değiştirdiğinde N adresi tek tek
                  düzeltmek zorundaydı. Artık adres numarayı
                  REFERANS ediyor.

                  ⚠️ Numara EKLEME buraya konmadı, ayrı ekranda.
                  Buraya da bir "numara ekle" formu koysaydık aynı
                  form iki yerde yaşardı ve yarın doğrulama kuralı
                  değişince biri unutulurdu. Bağlantı, formu açık
                  bırakarak deftere gidiyor — yazdıkların kaybolmuyor,
                  çünkü bu ekran yığında duruyor. */}
              <Text style={styles.alanBaslik}>Kargo için aranacak numara</Text>

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

              <TouchableOpacity
                style={styles.numaraYonet}
                onPress={() => navigation.navigate('Numaralarim')}
                hitSlop={6}
              >
                <Ionicons name="call-outline" size={16} color={renkler.anaRenk} />
                <Text style={styles.numaraYonetYazi}>Numaralarımı yönet</Text>
              </TouchableOpacity>

              <View style={styles.formButonlar}>
                <TouchableOpacity
                  style={styles.iptalButon}
                  onPress={() => setFormAcik(false)}
                >
                  <Text style={styles.iptalYazi}>Vazgeç</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.kaydetButon}
                  onPress={adresEkle}
                  disabled={kaydediliyor}
                >
                  {kaydediliyor ? (
                    <ActivityIndicator color={renkler.anaRenkUstuYazi} />
                  ) : (
                    <Text style={styles.kaydetYazi}>Kaydet</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* ⭐ DEĞİŞTİ (GV/Faz 6.8) — "Yeni adres ekle" SATIRI.

               Tasarım burayı KESİKLİ çerçeveyle çiziyor. Biz düz
               çerçeve + yumuşak zemin kullanıyoruz.

               ⚠️ Sebep tasarım sistemi skill'inde yazılı:
               `borderStyle: 'dashed'` Android'de yuvarlatılmış
               köşelerle birlikte ÇİZİLMİYOR. Kesikli yazsaydık iOS'ta
               kesikli, Android'de düz görünürdü — yani iki platformda
               iki farklı tasarım. Ayrımı zemin ve artı ikonu
               veriyor. */
            <TouchableOpacity
              style={styles.ekleSatir}
              onPress={() => setFormAcik(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.ekleYazi}>Yeni adres ekle</Text>
              <Ionicons name="add" size={22} color={renkler.anaRenk} />
            </TouchableOpacity>
          )}
        </ScrollView>

        {secimModu && (
          <View style={styles.altBar}>
            <TouchableOpacity
              style={[styles.devamButon, !seciliId && styles.devamButonPasif]}
              onPress={devamEt}
              disabled={!seciliId}
              activeOpacity={0.85}
            >
              <Text style={styles.devamYazi}>Devam Et</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <OnayPenceresi
        acik={silinecek !== null}
        ikon="trash-outline"
        yikici
        baslik="Adres silinsin mi?"
        mesaj={silinecek ? `"${silinecek.title}" adresi kalıcı olarak silinecek.` : ''}
        onayYazisi="Sil"
        onVazgec={() => setSilinecek(null)}
        onOnayla={() => {
          const adres = silinecek;
          setSilinecek(null);
          if (adres) adresiSil(adres);
        }}
      />
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
    gap: bosluk.orta,
    paddingHorizontal: sayfaKenari,
    paddingVertical: bosluk.orta,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  geriButon: {
    width: 32,
  },

  ustOrta: {
    flex: 1,
  },

  ustBaslik: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  adimYazi: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },

  icerik: {
    padding: sayfaKenari,
    gap: bosluk.orta,
  },

  bosYazi: {
    fontSize: yazi.normal,
    color: renkler.yaziGri,
    textAlign: 'center',
    marginVertical: bosluk.genis,
  },


  /* ---------- ADRES KARTI ---------- */

  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
  },

  /* ⚠️ Kenarlık KALINLAŞMIYOR, sadece rengi ve zemin değişiyor.
     Kalınlık değişseydi kart 1px büyür ve seçim her değiştiğinde
     liste aşağı yukarı zıplardı. */
  kartSecili: {
    borderColor: renkler.anaRenk,
    backgroundColor: renkler.yumusakVurgu,
  },

  kartUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.kucuk,
    marginBottom: bosluk.kucuk,
  },

  adresBaslik: {
    flex: 1,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  adresMetin: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.yaziOrta,
  },

  adresSehir: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },

  adresTelefon: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: bosluk.kucuk,
  },


  /* ---------- YENİ ADRES SATIRI ---------- */

  ekleSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: renkler.acikKart,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
  },

  ekleYazi: {
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.anaRenk,
  },


  /* ---------- FORM ---------- */

  form: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
  },

  formBaslik: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.orta,
  },

  input: {
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    padding: bosluk.orta,
    marginBottom: bosluk.kucuk,
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
    backgroundColor: renkler.arkaPlan,
  },

  inputCok: {
    height: 80,
    textAlignVertical: 'top',
  },


  /* ---------- TELEFON SEÇİMİ (4.9) ---------- */

  /* ⚠️ Formdaki tek ETİKETLİ alan bu — diğerleri yer tutucuyla
     kendini anlatıyor. Sebep: bir input'un ne istediği yer
     tutucudan okunur ama bir radyo listesinin ne sorduğu
     okunmaz. Etiket olmadan liste "bu numaralar da ne?" diye
     bakılan bir yığın olurdu. */
  alanBaslik: {
    fontSize: yazi.kucuk,
    color: renkler.yaziOrta,
    marginTop: bosluk.kucuk,
    marginBottom: bosluk.kucuk,
  },

  numaraYok: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziGri,
    marginBottom: bosluk.kucuk,
  },

  numaraListe: {
    gap: bosluk.kucuk,
    marginBottom: bosluk.kucuk,
  },

  numaraSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    paddingHorizontal: bosluk.orta,
    paddingVertical: bosluk.kucuk,
    backgroundColor: renkler.arkaPlan,
  },

  /* Adres ve kart kartlarındaki kararın aynısı: seçilince kalınlık
     değil RENK ve ZEMİN değişiyor. Kalınlık değişseydi satır 1px
     büyüyüp altındakileri iterdi. */
  numaraSatirSecili: {
    borderColor: renkler.anaRenk,
    backgroundColor: renkler.yumusakVurgu,
  },

  numaraYazi: {
    fontSize: yazi.normal,
    color: renkler.yaziKoyu,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },

  numaraEtiket: {
    flex: 1,
    textAlign: 'right',
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
  },

  numaraYonet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.mikro,
    alignSelf: 'flex-start',
    marginBottom: bosluk.orta,
  },

  numaraYonetYazi: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.anaRenk,
  },

  formButonlar: {
    flexDirection: 'row',
    gap: bosluk.kucuk,
    marginTop: bosluk.mikro,
  },

  iptalButon: {
    flex: 1,
    paddingVertical: bosluk.orta,
    borderRadius: kose.orta,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    alignItems: 'center',
  },

  iptalYazi: {
    color: renkler.yaziOrta,
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },

  kaydetButon: {
    flex: 1,
    paddingVertical: bosluk.orta,
    borderRadius: kose.orta,
    backgroundColor: renkler.anaRenk,
    alignItems: 'center',
  },

  kaydetYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },


  /* ---------- ALT ÇUBUK ---------- */

  altBar: {
    paddingHorizontal: sayfaKenari,
    paddingVertical: bosluk.orta,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  devamButon: {
    backgroundColor: renkler.anaRenk,
    paddingVertical: bosluk.normal,
    borderRadius: kose.orta,
    alignItems: 'center',
  },

  devamButonPasif: {
    backgroundColor: renkler.pasif,
  },

  devamYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },
});
