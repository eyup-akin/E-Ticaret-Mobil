import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { epostaGecerliMi } from '../utils/dogrulama';
import FormAlani from '../components/FormAlani';
import SifreGucu, { MIN_SIFRE } from '../components/SifreGucu';
import OnayPenceresi from '../components/OnayPenceresi';
import SozlesmeOnayKutusu from '../components/SozlesmeOnayKutusu';   // ⭐ YENİ (Aşama 10)

// ============================================================
//  KAYIT EKRANI  (GV/Faz 8.2)
//
//  Tasarım: `kay_t_ol`
//
//  Giriş ekranıyla AYNI iskelet: lacivert bant + beyaz yaprak.
//  İki ekran arasında `replace` ile gidilip geliniyor; farklı
//  iskeletler kullansaydık geçiş sıçrama gibi görünürdü.
//
//  ⚠️ "KULLANIM KOŞULLARI" ONAY KUTUSU ÇİZİLMEDİ.
//  Tasarımda zorunlu bir onay kutusu ve koşullara giden bir
//  bağlantı var; bizde koşul metni diye bir şey YOK. Hiçbir yere
//  gitmeyen bir bağlantı, olmayan bir belgeyi varmış gibi
//  gösterir (B8'de yardım ikonu için verilen kararın aynısı).
//  Ayrıca sunucu böyle bir onay beklemiyor: zorunlu göstermek
//  uygulanmayan bir kural uydurmak olurdu.
//
//  ⚠️ ŞİFRE İPUCU "En az 8 karakter" DEĞİL.
//  Tasarım 8 diyor, sunucu 6 uyguluyor. Tasarımdaki sayıyı
//  yazsaydık 7 karakterlik şifre kabul edilirken ekran "olmaz"
//  demiş olurdu. Sayı tek yerden geliyor: `MIN_SIFRE`.
//
//  ⚠️ "Şifre (Tekrar)" alanı SUNUCUYA GİTMİYOR — yazım hatasını
//  yakalamak için var. Şifre Değiştir ekranındaki kararın aynısı.
// ============================================================
export default function KayitEkrani({ navigation }) {
  const { kayitOl } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [adSoyad, setAdSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [gizli, setGizli] = useState(true);

  /* ⭐ YENİ — ŞİFRE ALANINA BASINCA KRİTERLER KLAVYENİN ÜSTÜNE ÇIKSIN.
   *
   * ⚠️ SORUN: şifre kutusuna dokunulunca klavye açılıyor ve hemen
   * altındaki "güçlü şifre" kriter listesini tamamen örtüyordu.
   * Kullanıcı hangi kuralı sağlamadığını göremeden yazmaya
   * çalışıyordu — listenin var olma sebebi tam olarak o an.
   *
   * ⚠️ ÇÖZÜM `KeyboardAvoidingView` DEĞİL: o, formu yukarı itiyor
   * ama neyin görüneceğine karar vermiyor; şifre alanı ekranın
   * dibinde kaldığı sürece altındaki liste yine kapalı kalıyordu.
   * Odaklanınca şifre bloğunu ekranın ÜSTÜNE kaydırıyoruz — altındaki
   * her şey (kriterler) böylece klavyenin üstünde kalıyor.
   *
   * ⚠️ Konum `useRef`'te, state'te DEĞİL: yalnızca kaydırma anında
   * okunuyor ve state'e yazsaydık her ölçümde gereksiz bir render
   * tetiklenirdi. */
  const kaydirmaRef = useRef(null);

  /* ⚠️⚠️ İKİ AYRI ÖLÇÜM, TOPLANARAK KULLANILIYOR.
   *
   * `onLayout` konumu HER ZAMAN doğrudan üst öğeye göre veriyor.
   * Şifre bloğunun y'si yaprağın içindeki konumu; kaydırma ise
   * içeriğin en üstünden ölçülüyor. Yalnızca blok y'sini kullansaydık
   * bandın yüksekliği kadar EKSİK kaydırırdık ve şifre alanı yine
   * ekranın ortasında kalırdı — hatanın sessiz olanı: bir şey oluyor
   * ama yetmiyor. */
  const yaprakY = useRef(0);
  const sifreBlokY = useRef(0);

  function sifreyeKaydir() {
    /* ⚠️ GECİKME ŞART. Klavye animasyonla açılıyor ve Android'de
       yerleşim onunla birlikte küçülüyor; hemen kaydırsaydık hedef
       konum kaydırma sınırının dışında kalır, `scrollTo` onu kırpar
       ve ekran yanlış yerde dururdu. */
    setTimeout(() => {
      const hedef = yaprakY.current + sifreBlokY.current - bosluk.kucuk;

      kaydirmaRef.current?.scrollTo({ y: Math.max(0, hedef), animated: true });
    }, 250);
  }

  // ⚠️ Varsayılan false — onay kutusu önceden işaretli gelmez.
  const [sozlesmeOnayi, setSozlesmeOnayi] = useState(false);

  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [alanHatasi, setAlanHatasi] = useState({});

  // Kayıt sonucu penceresi — Alert değil, uygulamanın kendi dili.
  const [basariAcik, setBasariAcik] = useState(false);
  const [basariMesaji, setBasariMesaji] = useState('');

  // MODALI KAPAT → HER ZAMAN ANA SAYFAYA DÖN
  // (GirisEkrani'ndaki ile birebir aynı mantık — açıklaması orada.)
  function kapat() {
    navigation.navigate('Ana', {
      screen: 'AnaSayfa',
      params: { screen: 'AnaSayfaMain' },
    });
  }

  // Bir alana yazılınca o alanın hatası ve genel hata siliniyor:
  // düzeltmeye başlamış birine hâlâ eski hatayı göstermek gürültü.
  function alaniGuncelle(anahtar, deger, setter) {
    setter(deger);
    if (alanHatasi[anahtar]) setAlanHatasi((o) => ({ ...o, [anahtar]: '' }));
    if (hata) setHata('');
  }

  async function kayitButonu() {
    const hatalar = {};

    if (!adSoyad.trim()) hatalar.ad = 'Adını ve soyadını yaz.';
    if (!epostaGecerliMi(email)) hatalar.eposta = 'Lütfen geçerli bir e-posta adresi girin.';
    if (sifre.length < MIN_SIFRE) hatalar.sifre = `Şifre en az ${MIN_SIFRE} karakter olmalı.`;
    else if (sifre !== sifreTekrar) hatalar.tekrar = 'Şifreler birbiriyle eşleşmiyor.';

    if (!sozlesmeOnayi) {
      setHata('Devam etmek için gizlilik politikası ve kullanım koşullarını onaylaman gerekiyor.');
      setAlanHatasi(hatalar);
      return;
    }

    if (Object.keys(hatalar).length > 0) {
      setAlanHatasi(hatalar);
      return;
    }

    setAlanHatasi({});
    setHata('');

    try {
      setYukleniyor(true);

      const veri = await kayitOl(adSoyad, email, sifre, sozlesmeOnayi);

      // Kayıt başarılı AMA hesap henüz doğrulanmamış → modalı
      // kapatmıyoruz. Kullanıcıyı Giriş ekranına bırakıyoruz ki
      // maili doğrulayıp buradan devam edebilsin.
      setBasariMesaji(
        veri?.mesaj ||
        'Mailine doğrulama linki gönderdik. Doğruladıktan sonra giriş yapabilirsin.'
      );
      setBasariAcik(true);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      {/* ⭐⭐ DEĞİŞTİ — BANT ARTIK KAYDIRMANIN İÇİNDE.
       *
       * ⚠️ Eskiden ScrollView'in DIŞINDAYDI ve ekranın yarısını
       * kalıcı olarak kaplıyordu: klavye açılınca forma 200dp'lik bir
       * şerit kalıyor, şifre alanı ekranın dibine sıkışıyordu.
       * Şimdi form aşağı kaydırılınca bant yukarı kayıp gidiyor ve
       * ekranın tamamı forma kalıyor.
       *
       * ⚠️ Kapatma X'i BANTLA BİRLİKTE KAYMIYOR (aşağıda, kaydırmanın
       * dışında). Bu ekranın kendi kuralı: "çıkış yolu her zaman
       * görünür olmalı" — bant kayınca X de kaysaydı, klavye açıkken
       * ekranda hiçbir çıkış kalmazdı. */}
      <KeyboardAvoidingView
        style={styles.govde}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={kaydirmaRef}
          contentContainerStyle={styles.kaydirmaIcerik}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
      {/* ---- LACİVERT BANT ---- */}
      <View style={styles.bant}>
        {/* ⭐ YENİ (2026-08-12) — logo, Giriş ekranıyla AYNI karo.
            İki ekran arasında `replace` ile gidilip geliniyor; logo
            birinde olup diğerinde olmasaydı geçiş sıçrama gibi
            görünürdü. Gerekçeler (beyaz karo, saydam olmayan dosya)
            GirisEkrani'nda yazılı. */}
        <View style={styles.logoKaro}>
          <Image
            source={require('../../assets/satik-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Satık"
          />
        </View>

        {/* ⚠️ Burada marka adı DEĞİL bir eylem başlığı var; logo
            markayı zaten söylüyor, bu satır ne yapıldığını söylüyor. */}
        <Text style={styles.marka}>Hesap Oluştur</Text>
        <Text style={styles.slogan}>Avantajlı alışveriş dünyasına katıl.</Text>
      </View>

      {/* ---- BEYAZ YAPRAK ---- */}
      <View
        style={styles.yaprak}
        onLayout={(olay) => { yaprakY.current = olay.nativeEvent.layout.y; }}
      >
          <FormAlani
            etiket="Ad Soyad"
            ikon="person-outline"
            placeholder="Adın ve soyadın"
            value={adSoyad}
            onChangeText={(m) => alaniGuncelle('ad', m, setAdSoyad)}
            hata={alanHatasi.ad}
            editable={!yukleniyor}
          />

          <FormAlani
            etiket="E-posta"
            ikon="mail-outline"
            placeholder="e-posta@ornek.com"
            value={email}
            onChangeText={(m) => alaniGuncelle('eposta', m, setEmail)}
            hata={alanHatasi.eposta}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!yukleniyor}
          />

          {/* ⚠️ Şifre alanı ve kriter listesi AYNI SARMALAYICIDA:
              ölçtüğümüz konum ikisinin birlikte başladığı yer. Ayrı
              ölçseydik listenin nerede bittiğini de hesaplamak
              gerekirdi. */}
          <View
            onLayout={(olay) => { sifreBlokY.current = olay.nativeEvent.layout.y; }}
          >
            <FormAlani
              etiket="Şifre"
              ikon="lock-closed-outline"
              placeholder={`En az ${MIN_SIFRE} karakter`}
              value={sifre}
              onChangeText={(m) => alaniGuncelle('sifre', m, setSifre)}
              hata={alanHatasi.sifre}
              secureTextEntry={gizli}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!yukleniyor}
              onFocus={sifreyeKaydir}
              sagIkon={gizli ? 'eye-outline' : 'eye-off-outline'}
              sagIkonEtiket={gizli ? 'Şifreyi göster' : 'Şifreyi gizle'}
              onSagIkonBas={() => setGizli(!gizli)}
            />

          {/* ⚠️ Gösterge şifre alanının HEMEN ALTINDA, formun sonunda
              değil: kullanıcı yazarken görmeli. Bileşen 7.11'de
              yazıldı; kuralı ikinci kez yazmak, birini güncelleyip
              diğerini unutmak demekti.

              ⚠️ SARMALAYICI View KALDIRILDI (2026-08-12): şifre
              boşken bileşen `null` dönüyor ama sarmalayıcının
              `marginBottom`'ı duruyordu ve iki şifre alanı arasında
              sebepsiz bir boşluk bırakıyordu. Boşluk artık
              bileşenin içinde. */}
            <SifreGucu sifre={sifre} />
          </View>

          <FormAlani
            etiket="Şifre (Tekrar)"
            ikon="lock-closed-outline"
            placeholder="Şifreni tekrar yaz"
            value={sifreTekrar}
            onChangeText={(m) => alaniGuncelle('tekrar', m, setSifreTekrar)}
            hata={alanHatasi.tekrar}
            secureTextEntry={gizli}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!yukleniyor}
          />

          {/* ⭐ YENİ (Aşama 10) — açık rıza. Kutu önceden işaretli
              DEĞİL; metinlere dokununca tam metin açılıyor. */}
          <SozlesmeOnayKutusu
            isaretli={sozlesmeOnayi}
            onDegis={setSozlesmeOnayi}
            oncesi=""
            parcalar={[
              { tip: 'gizlilik', etiket: 'Gizlilik Politikası' },
              { tip: 'kullanim', etiket: 'Kullanım Koşulları' },
            ]}
            sonrasi="'nı okudum, kabul ediyorum."
          />

          {hata !== '' && (
            <View style={styles.hataKutu}>
              <Ionicons name="alert-circle" size={18} color={renkler.hata} />
              <Text style={styles.hataYazi}>{hata}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.anaButon, yukleniyor && styles.butonPasif]}
            onPress={kayitButonu}
            disabled={yukleniyor}
            activeOpacity={0.85}
          >
            {yukleniyor
              ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
              : <Text style={styles.anaButonYazi}>Kayıt Ol</Text>}
          </TouchableOpacity>

          {/* replace: Kayıt'ı yığından çıkarır, Giriş'i yerine koyar */}
          <TouchableOpacity
            style={styles.altSatir}
            onPress={() => navigation.replace('Giris')}
          >
            <Text style={styles.altYazi}>
              Zaten hesabın var mı? <Text style={styles.altVurgu}>Giriş yap</Text>
            </Text>
          </TouchableOpacity>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ⭐ DEĞİŞTİ — KAPATMA X'İ KAYDIRMANIN DIŞINDA, HEP GÖRÜNÜR.
          ⚠️ Tasarımda geri oku var, bizde X: geri ok "bir önceki
          ekran Giriş'ti" varsayıyor, oysa bu ekrana Hesabım'dan ve
          misafir kapısından da doğrudan geliniyor.
          ⚠️ Beyaz daire içinde koyu ikon: bant kaydıkça altında
          bazen lacivert bazen beyaz yaprak oluyor. Düz beyaz bir
          ikon, yaprağın üstüne gelince görünmez olurdu. */}
      <TouchableOpacity
        onPress={kapat}
        style={styles.kapatButon}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Kapat"
      >
        <Ionicons name="close" size={22} color={renkler.yaziKoyu} />
      </TouchableOpacity>

      {/* ⚠️ Tek buton: geri alınacak bir şey yok, pencere yalnızca
          sonucu bildiriyor ve tek bir yere götürüyor. */}
      <OnayPenceresi
        acik={basariAcik}
        ikon="mail-unread-outline"
        tekButon
        baslik="Kayıt başarılı"
        mesaj={basariMesaji}
        onayYazisi="Giriş ekranına dön"
        onOnayla={() => { setBasariAcik(false); navigation.replace('Giris'); }}
        onVazgec={() => { setBasariAcik(false); navigation.replace('Giris'); }}
      />
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.lacivertYuzey,
  },

  /* ⭐ DEĞİŞTİ (2026-08-12) — ALT DOLGU BÜYÜDÜ.
     ⚠️ Beyaz yaprak bandın son 24dp'sini ÖRTÜYOR (`yaprakKap`
     marginTop -24). Bandın alt dolgusu da 24 olunca slogan tam o
     örtülen şeride denk geliyordu: cihazda yazı yaprağın kenarına
     sıkışmış görünüyordu. Dolgu artık örtülen 24'ü + nefes payını
     birlikte taşıyor. */
  bant: {
    alignItems: 'center',
    paddingHorizontal: bosluk.genis,
    paddingTop: bosluk.kucuk,
    paddingBottom: bosluk.genis + bosluk.genis,
  },

  logoKaro: {
    width: 84,
    height: 84,
    borderRadius: kose.buyuk,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: bosluk.kucuk,
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  /* ⭐ DEĞİŞTİ — MUTLAK KONUM, akışta değil.
     ⚠️ Eskiden bandın içindeydi ve `alignSelf: 'flex-end'` ile
     sağa yaslanıyordu. Bant artık kayıyor; X ise kaymamalı.
     ⚠️ Beyaz daire + gölge: altında bazen lacivert bant bazen beyaz
     yaprak oluyor. Tek renk bir ikon, ikisinden birinde kaybolurdu. */
  kapatButon: {
    position: 'absolute',
    top: bosluk.kucuk,
    right: bosluk.genis,
    width: 36,
    height: 36,
    borderRadius: kose.tam,
    backgroundColor: renkler.kartArka,
    justifyContent: 'center',
    alignItems: 'center',
    ...renkler.golgeSm,
  },

  /* ⚠️ Giriş'teki "Satık"tan bir punto küçük: orada marka adı var,
     burada bir eylem başlığı. Aynı puntoda olsalardı iki ekran da
     aynı şeyi söylüyormuş gibi okunurdu. */
  marka: {
    fontSize: yazi.baslik,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.lacivertYuzeyUstuYazi,
    textAlign: 'center',
    marginTop: bosluk.orta,
  },

  slogan: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.lacivertYuzeyPasif,
    textAlign: 'center',
    marginTop: bosluk.mikro,
  },

  govde: { flex: 1 },

  /* ⭐ DEĞİŞTİ — `yaprakKap` KALDIRILDI, yerine kaydırma kabı.
     ⚠️ `flexGrow: 1` şart: içerik ekrandan kısaysa yaprak yine de
     ekranın dibine kadar uzasın, altında lacivert bir şerit
     kalmasın. */
  kaydirmaIcerik: {
    flexGrow: 1,
  },

  yaprak: {
    flexGrow: 1,

    /* ⚠️ Bandın son 24dp'sini örtüyor — eskiden bu `yaprakKap`'ta
       duruyordu; kap kalkınca yaprağın kendisine geçti. */
    marginTop: -bosluk.genis,

    backgroundColor: renkler.kartArka,
    borderTopLeftRadius: kose.dev,
    borderTopRightRadius: kose.dev,
    paddingHorizontal: bosluk.genis,
    /* ⭐ DEĞİŞTİ (2026-08-12) — yaprağın üst dolgusu 24 → 32.
       İlk etiket yuvarlatılmış köşenin hemen dibinde başlıyordu ve
       form bandın altına sıkışmış görünüyordu. */
    paddingTop: bosluk.dev,
    paddingBottom: bosluk.dev,
  },

  hataKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    backgroundColor: renkler.yumusakHata,
    borderLeftWidth: 3,
    borderLeftColor: renkler.hata,
    borderRadius: kose.kucuk,
    padding: bosluk.orta,
    marginBottom: bosluk.orta,
  },

  hataYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.hata,
  },

  anaButon: {
    backgroundColor: renkler.anaRenk,
    height: 48,
    borderRadius: kose.orta,
    justifyContent: 'center',
    alignItems: 'center',
  },

  butonPasif: {
    opacity: 0.6,
  },

  anaButonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  altSatir: {
    marginTop: 'auto',
    paddingTop: bosluk.genis,
    alignItems: 'center',
  },

  altYazi: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
  },

  altVurgu: {
    color: renkler.anaRenk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },
});
