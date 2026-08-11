import React, { useState } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTema } from '../context/TemaContext';
import { useAuth } from '../context/AuthContext';
import OnayPenceresi from '../components/OnayPenceresi';

// Kullanıcının birebir yazması gereken metin.
//
// Neden sabit olarak dışarıda? Karşılaştırmada ve ekranda gösterimde AYNI
// metni kullanmak zorundayız. İki yere elle yazsaydık birini değiştirip
// diğerini unutmak mümkün olurdu — ve kullanıcı ekranda yazanı yazdığı
// hâlde "eşleşmedi" hatası alırdı. Bulunması çok can sıkıcı bir hata.
const ONAY_METNI = 'HESABIMI KAPAT';

export default function HesapKapatEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const { hesabiKapat } = useAuth();

  const [sifre, setSifre] = useState('');
  const [onayGirdi, setOnayGirdi] = useState('');
  const [gizli, setGizli] = useState(true);

  const [islemde, setIslemde] = useState(false);
  const [hata, setHata] = useState('');

  // ⭐ YENİ (GV/Faz 7.12) — son onay ve kapanış pencereleri.
  //
  // ⚠️ Alert.alert yerine OnayPenceresi. Bu ekrandaki en kritik
  // pencere yıkıcı bir eylemi soruyor; sistem penceresi yıkıcı butonu
  // vurgulayamıyor ve iki buton aynı görünüyordu.
  const [sonOnayAcik, setSonOnayAcik] = useState(false);
  const [kapandiAcik, setKapandiAcik] = useState(false);

  // Onay metni doğru yazıldı mı?
  //
  // trim(): telefon klavyeleri kelime sonunda otomatik boşluk ekleyebiliyor.
  // toUpperCase(): kullanıcı küçük harfle yazdıysa da kabul edelim —
  //   amaç "bilerek yaptığını kanıtlamak", imla sınavı yapmak değil.
  //   Aşırı katı olmak kullanıcıyı sinirlendirir, güvenlik kazandırmaz.
  const onayDogruMu = onayGirdi.trim().toUpperCase() === ONAY_METNI;

  // İki koşul birden sağlanmalı. Türetilmiş değer — ayrı state yok.
  const devamEdilebilir = onayDogruMu && sifre.length > 0;

  async function kapat() {
    setHata('');
    setIslemde(true);

    try {
      await hesabiKapat(sifre);

      // ⚠️ SIRA ÖNEMLİ: Önce bilgilendir, SONRA kullanıcı Tamam'a basınca
      //    ekrandan ayrıl.
      //
      //    hesabiKapat çağrısı token'ı ve kullanıcıyı null yaptı, yani
      //    uygulama şu an misafir durumunda. Ama bu ekran hâlâ açık.
      //    Kullanıcı ne olduğunu okumadan ekran değişirse "kapandı mı,
      //    kapanmadı mı?" diye kalır.
      setKapandiAcik(true);
    } catch (e) {
      // Sunucudan gelebilecek mesajlar:
      //   "Şifren yanlış. Hesabın kapatılmadı."
      //   "Süperadmin hesabı bu ekrandan kapatılamaz..."
      //   rate limit hatası
      setHata(e.message);
    } finally {
      setIslemde(false);
    }
  }

  // Silinecek / kalacak veri listesi.
  //
  // Bileşen DIŞINDA tanımlamadık çünkü renkler temaya bağlı ve
  // stilOlustur gibi her render'da hesaplanıyor. Ama içerik sabit,
  // sadece ikon rengi değişken.
  const silinecekler = [
    'Kayıtlı adreslerin',
    'Kayıtlı kartların',
    'Sepetindeki ürünler',
    'Favori listen',
    'Tüm cihazlardaki oturumların',
  ];

  const kalacaklar = [
    'Geçmiş siparişlerin (muhasebe kaydı)',
    'Ödeme kayıtların (finansal kayıt)',
    'Ürün yorumların (adın gizlenir)',
  ];

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>Hesabı Kapat</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.kapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.icerik}>

          {/* ---- UYARI BAŞLIĞI ---- */}
          <View style={styles.uyariKutu}>
            <Ionicons name="warning" size={24} color={renkler.hata} />
            <Text style={styles.uyariYazi}>
              Bu işlem <Text style={styles.kalin}>geri alınamaz</Text>.
              Hesabını kapatınca tekrar açamayız.
            </Text>
          </View>

          {/* ---- NE SİLİNECEK ---- */}
          {/* Şeffaflık: kullanıcı ne kaybedeceğini bilmeli.
              "Hesabınız silinecek" demek yetmez. */}
          <Text style={styles.bolumBaslik}>Silinecekler</Text>
          <View style={styles.listeKutu}>
            {silinecekler.map((madde) => (
              <View style={styles.listeSatir} key={madde}>
                <Ionicons name="close-circle" size={18} color={renkler.hata} />
                <Text style={styles.listeYazi}>{madde}</Text>
              </View>
            ))}
          </View>

          {/* ---- NE KALACAK ---- */}
          <Text style={styles.bolumBaslik}>Saklanacaklar</Text>
          <View style={styles.listeKutu}>
            {kalacaklar.map((madde) => (
              <View style={styles.listeSatir} key={madde}>
                <Ionicons name="archive-outline" size={18} color={renkler.yaziGri} />
                <Text style={styles.listeYazi}>{madde}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.aciklama}>
            Adın "Silinmiş Kullanıcı" olarak değiştirilir ve e-posta adresin
            serbest kalır — istersen ileride aynı adresle yeni hesap açabilirsin.
          </Text>

          {/* ---- ONAY 1: METİN YAZ ---- */}
          <Text style={[styles.bolumBaslik, { marginTop: 26 }]}>
            1. Onaylamak için yaz
          </Text>
          <Text style={styles.ipucu}>
            Aşağıdaki kutuya <Text style={styles.kod}>{ONAY_METNI}</Text> yaz.
          </Text>

          <TextInput
            style={[
              styles.input,
              /* Doğru yazıldıysa kenarı yeşile çevir — anında görsel
                 geri bildirim. Kullanıcı "yazdım ama olmadı" durumunda
                 kalmasın. */
              onayDogruMu && styles.inputDogru,
            ]}
            value={onayGirdi}
            onChangeText={(metin) => {
              setOnayGirdi(metin);
              if (hata) setHata('');
            }}
            placeholder={ONAY_METNI}
            placeholderTextColor={renkler.yaziGri}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!islemde}
          />

          {/* ---- ONAY 2: ŞİFRE ---- */}
          <Text style={[styles.bolumBaslik, { marginTop: 22 }]}>
            2. Şifrenle doğrula
          </Text>
          <Text style={styles.ipucu}>
            Telefonun başkasının eline geçtiyse hesabını kapatamasın diye
            şifren isteniyor.
          </Text>

          <TextInput
            style={styles.input}
            value={sifre}
            onChangeText={(metin) => {
              setSifre(metin);
              if (hata) setHata('');
            }}
            placeholder="Şifren"
            placeholderTextColor={renkler.yaziGri}
            secureTextEntry={gizli}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!islemde}
          />

          <TouchableOpacity
            style={styles.gosterSatir}
            onPress={() => setGizli(!gizli)}
          >
            <Ionicons
              name={gizli ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={renkler.anaRenk}
            />
            <Text style={styles.gosterYazi}>
              {gizli ? 'Şifreyi göster' : 'Şifreyi gizle'}
            </Text>
          </TouchableOpacity>

          {hata !== '' && (
            <View style={styles.hataKutu}>
              <Ionicons name="alert-circle" size={18} color={renkler.hata} />
              <Text style={styles.hataYazi}>{hata}</Text>
            </View>
          )}

          {/* ---- TEHLİKELİ BUTON ---- */}
          <TouchableOpacity
            style={[
              styles.tehlikeButon,
              (!devamEdilebilir || islemde) && styles.tehlikeButonPasif,
            ]}
            onPress={() => setSonOnayAcik(true)}
            disabled={!devamEdilebilir || islemde}
          >
            {islemde ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.tehlikeYazi}>Hesabımı Kapat</Text>
            )}
          </TouchableOpacity>

          {/* Vazgeçme yolu her zaman görünür ve KOLAY olmalı.
              Tehlikeli ekranlarda çıkış kapısını gizlemek kötü tasarımdır. */}
          <TouchableOpacity
            style={styles.vazgecButon}
            onPress={() => navigation.goBack()}
            disabled={islemde}
          >
            <Text style={styles.vazgecYazi}>Vazgeç, geri dön</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ⚠️ ÜÇÜNCÜ VE SON KAPI. Onay metnini yazmak "bilerek mi",
          şifre "sen kimsin" sorusunu cevaplıyor; bu pencere "hâlâ
          emin misin" diye soruyor. Buton basıldığında işlem HEMEN
          başlamıyor olması bilinçli. */}
      <OnayPenceresi
        acik={sonOnayAcik}
        ikon="warning-outline"
        yikici
        baslik="Emin misin?"
        mesaj="Hesabın kapatılacak ve kişisel bilgilerin silinecek. Bu işlem geri alınamaz."
        onayYazisi="Hesabımı Kapat"
        onVazgec={() => setSonOnayAcik(false)}
        onOnayla={() => { setSonOnayAcik(false); kapat(); }}
      />

      {/* ⚠️ popToTop: goBack() yetmezdi — kullanıcı buraya
          Hesabım → Hesabı Kapat yolundan geldi ve arada başka ekranlar
          da olabilir. popToTop yığını temizleyip Hesabım'a döndürüyor;
          orası token null olduğu için misafir görünümüne geçmiş
          durumda. */}
      <OnayPenceresi
        acik={kapandiAcik}
        ikon="checkmark-circle-outline"
        tekButon
        baslik="Hesabın kapatıldı"
        mesaj="Kişisel bilgilerin silindi. Geçmiş sipariş kayıtların yasal saklama yükümlülüğü nedeniyle muhasebe kaydı olarak saklanıyor, ancak artık kimliğinle ilişkilendirilemez."
        onayYazisi="Tamam"
        onVazgec={() => { setKapandiAcik(false); navigation.popToTop(); }}
        onOnayla={() => { setKapandiAcik(false); navigation.popToTop(); }}
      />
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
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

  ustBaslik: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  icerik: {
    padding: sayfaKenari,
    paddingBottom: bosluk.dev,
  },


  /* ---- UYARI ---- */

  uyariKutu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.orta,
    backgroundColor: renkler.yumusakHata,
    borderRadius: kose.orta,
    borderLeftWidth: 4,
    borderLeftColor: renkler.hata,
    padding: bosluk.normal,
    marginBottom: bosluk.genis,
  },

  uyariYazi: {
    flex: 1,
    fontSize: yazi.normal,
    color: renkler.yaziKoyu,
    lineHeight: satir.normal,
  },

  kalin: {
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.hata,
  },


  /* ---- LİSTELER ---- */

  bolumBaslik: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziGri,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: bosluk.kucuk,
  },

  listeKutu: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
    marginBottom: bosluk.normal,
  },

  listeSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    paddingVertical: bosluk.mikro,
  },

  listeYazi: {
    flex: 1,
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
  },

  aciklama: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    lineHeight: satir.kucuk,
  },


  /* ---- FORM ---- */

  ipucu: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    lineHeight: satir.kucuk,
    marginBottom: bosluk.kucuk,
  },

  kod: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    color: renkler.yaziKoyu,
  },

  input: {
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    paddingHorizontal: bosluk.normal,
    height: 48,
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
    backgroundColor: renkler.kartArka,
  },

  /* ⚠️ Kenarlık kalınlaşıyor ama kutu YÜKSEKLİĞİ sabit (height: 48),
     o yüzden düzen kaymıyor. Yükseklik içeriğe bağlı olsaydı doğru
     yazınca kutu 2px büyür ve altındaki her şey zıplardı. */
  inputDogru: {
    borderColor: renkler.basari,
    borderWidth: 2,
  },


  /* ---- GÖSTER/GİZLE ---- */

  gosterSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    alignSelf: 'flex-start',
    paddingVertical: bosluk.kucuk,
  },

  gosterYazi: {
    fontSize: yazi.kucuk,
    color: renkler.anaRenk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },


  /* ---- HATA ---- */

  hataKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    backgroundColor: renkler.yumusakHata,
    borderLeftWidth: 3,
    borderLeftColor: renkler.hata,
    borderRadius: kose.kucuk,
    padding: bosluk.orta,
    marginTop: bosluk.orta,
  },

  hataYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    color: renkler.hata,
    lineHeight: satir.kucuk,
  },


  /* ---- BUTONLAR ---- */

  /* ⚠️ DOLU KIRMIZI — ve bu, uygulamadaki TEK dolu kırmızı buton.
     Çıkış yapma ve oturum kapatma çerçeveli; onlar geri alınabilir.
     Hesap kapatma geri alınamaz ve o ağırlığı yalnızca burası
     taşıyor. */
  tehlikeButon: {
    backgroundColor: renkler.hata,
    paddingVertical: bosluk.normal,
    borderRadius: kose.orta,
    alignItems: 'center',
    marginTop: bosluk.genis,
  },

  tehlikeButonPasif: {
    opacity: 0.45,
  },

  tehlikeYazi: {
    /* ⚠️ Sabit beyaz ve bilerek: hata rengi hem açık hem koyu temada
       koyu bir kırmızı tonu, üstünde beyaz her iki temada da
       okunuyor. renkler.yaziKoyu kullansaydık koyu temada açık gri
       olur ve kırmızı üstünde okunurluğu düşerdi. */
    color: '#ffffff',
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  vazgecButon: {
    paddingVertical: bosluk.normal,
    alignItems: 'center',
    marginTop: bosluk.kucuk,
  },

  vazgecYazi: {
    fontSize: yazi.orta,
    color: renkler.anaRenk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },
});
