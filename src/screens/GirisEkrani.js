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

import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import { apiPost } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import FormAlani from '../components/FormAlani';
import OnayPenceresi from '../components/OnayPenceresi';
import { epostaGecerliMi } from '../utils/dogrulama';

// ============================================================
//  GİRİŞ EKRANI  (GV/Faz 8.1)
//
//  Tasarım: `giri_yap_ve_hata_durumu`
//
//  Yerleşim: üstte lacivert bant (logo + başlık + tek satır
//  açıklama), altında yukarı köşeleri yuvarlatılmış beyaz yaprak.
//  Yaprak bandın son 24dp'sini örtüyor — ürün detayındaki
//  galeri/yaprak ilişkisinin aynısı.
//
//  ⚠️ BANT KAYIT EKRANIYLA BİREBİR AYNI (2026-08-12). İki ekran
//  arasında `replace` ile gidilip geliniyor; farklı bantlar geçişi
//  sıçrama gibi gösteriyordu. Boy içerikten geliyor, sabit ya da
//  ekrana orantılı değil.
//
//  ⚠️ HATALAR ARTIK Alert DEĞİL, EKRANDA.
//  Üç ayrı yer: e-posta biçimi kutunun altında, sunucudan gelen
//  giriş hatası butonun üstündeki kutuda, "hesabın doğrulanmadı"
//  ise bir eylem gerektirdiği için pencerede. Alert hangi alanın
//  yanlış olduğunu söylemiyordu ve kapatınca hiçbir iz kalmıyordu.
//
//  ⚠️ DAVRANIŞ DEĞİŞMEDİ: girisYap çağrısı, doğrulama linki
//  gönderme ve `kapat()` yönlendirmesi aynen duruyor. Bu faz bir
//  yeniden giydirme.
// ============================================================

export default function GirisEkrani({ navigation }) {
  const { girisYap } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [gizli, setGizli] = useState(true);

  /* ⭐ YENİ — bant kaydırmanın içine alındığı için ölçüm ref'leri.
   *
   * ⚠️ Bu ekranda şifre kriter listesi YOK (o yalnızca kayıtta var),
   * yani "kriterleri klavyenin üstüne çıkar" derdi burada geçerli
   * değil. Yine de `yaprakY` tutuluyor: iki ekran arasında `replace`
   * ile gidilip geliniyor ve yapıları birebir aynı kalmalı — biri
   * kaydırılabilir diğeri değilse geçiş sıçrar. */
  const kaydirmaRef = useRef(null);
  const yaprakY = useRef(0);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Alan hatası ile genel hata AYRI: biri kutunun altına, diğeri
  // butonun üstüne yazılıyor. Tek bir metinde toplasaydık "şifre
  // yanlış" hatası e-posta kutusunun altında belirirdi.
  const [epostaHatasi, setEpostaHatasi] = useState('');
  const [hata, setHata] = useState('');
  const [bilgi, setBilgi] = useState('');

  // Doğrulanmamış hesap penceresi
  const [dogrulamaAcik, setDogrulamaAcik] = useState(false);
  const [dogrulamaMesaji, setDogrulamaMesaji] = useState('');

  // MODALI KAPAT → HER ZAMAN ANA SAYFAYA DÖN
  //
  // Neden goBack() değil: modal her zaman "Ana"nın üstüne açılıyor,
  // yani canGoBack() hep true dönüyordu ve kullanıcı geldiği sekmeye
  // geri düşüyordu. Hesabım'dan gelen, giriş yapsa da vazgeçse de
  // yine Hesabım'da uyanıyordu.
  //
  // Üç katı da belirtiyoruz çünkü her navigator kendi geçmişini tutar:
  //   'Ana'          → RootStack'teki sekme kabuğu
  //   'AnaSayfa'     → o kabuğun Ana Sayfa sekmesi
  //   'AnaSayfaMain' → o sekmenin ürün listesi ekranı
  // Sonuncusu olmazsa sekme UrunDetay'da kalmışsa orada uyanırdı.
  function kapat() {
    navigation.navigate('Ana', {
      screen: 'AnaSayfa',
      params: { screen: 'AnaSayfaMain' },
    });
  }

  // Doğrulama linkini yeniden gönderir.
  // AuthContext üzerinden değil doğrudan apiPost ile çağırıyoruz:
  // bu işlem oturumla ilgili değil, tek seferlik basit bir istek.
  async function dogrulamaLinkiGonder() {
    setDogrulamaAcik(false);

    try {
      const veri = await apiPost('/auth/resend-verification', { email });
      setBilgi(veri.mesaj);
      setHata('');
    } catch (e) {
      // Rate limit'e takılırsa ("15 dakikada 3 istek") mesajı burada görünür
      setHata(e.message);
    }
  }

  async function girisButonu() {
    setBilgi('');

    if (!email.trim() || !sifre) {
      setHata('E-posta ve şifre boş olamaz.');
      return;
    }

    if (!epostaGecerliMi(email)) {
      setEpostaHatasi('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setEpostaHatasi('');
    setHata('');

    try {
      setYukleniyor(true);
      await girisYap(email, sifre);
      kapat();   // ← giriş başarılı, modalı kapat ve geldiği yere dön
    } catch (e) {
      // ⭐ Email doğrulanmamışsa bu bir "hata" değil, eksik bir adım.
      // Backend'in gönderdiği KOD'a bakıyoruz, mesaj metnine değil —
      // metin ileride değişirse kontrol kırılmasın.
      if (e.kod === 'EMAIL_DOGRULANMADI') {
        setDogrulamaMesaji(e.message);
        setDogrulamaAcik(true);
        return;
      }

      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      {/* ⭐⭐ DEĞİŞTİ — BANT ARTIK KAYDIRMANIN İÇİNDE.
       *
       * ⚠️ Kayıt ekranıyla AYNI değişiklik ve aynı gerekçe: bant
       * ScrollView'in dışındayken ekranın yarısını kalıcı kaplıyor,
       * klavye açılınca forma çok az yer kalıyordu. İki ekran
       * arasında `replace` ile gidilip geliniyor; birinde kayıp
       * diğerinde sabit bir bant, geçişi sıçrama gibi gösterirdi. */}
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
        {/* ⭐ YENİ (2026-08-12) — LOGO.

            ⚠️ BEYAZ KARENİN İÇİNDE, doğrudan bandın üstünde değil.
            Logo dosyası saydam DEĞİL (PNG renk tipi 2, alfa kanalı
            yok); lacivert bandın üstüne koyduğumuz an arkasında
            beyaz bir dikdörtgen görünürdü. Yuvarlak köşeli beyaz
            karo bunu bir kusur olmaktan çıkarıp uygulama simgesi
            diline çeviriyor.

            ⚠️ Ayrıca "Satık" YAZISI KALDIRILDI: logonun içinde zaten
            marka adı yazıyor ve ikisini birlikte göstermek aynı adı
            ekranda iki kez yazmak olurdu. */}
        <View style={styles.logoKaro}>
          <Image
            source={require('../../assets/satik-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Satık"
          />
        </View>

        {/* ⭐ DEĞİŞTİ (2026-08-12) — BAŞLIK BANDA TAŞINDI.
            Kayıt ekranı referans alındı: iki ekran arasında `replace`
            ile gidilip geliniyor ve bantları farklı yapıdaydı — biri
            logo+slogan, diğeri logo+başlık+slogan. Geçiş sıçrama gibi
            görünüyordu. Artık ikisi de aynı: logo, ne yaptığını
            söyleyen başlık, tek satır açıklama.
            ⚠️ Yapraktaki "Giriş Yap" başlığı KALDIRILDI — aynı yazı
            ekranda iki kez durmuş olurdu. */}
        <Text style={styles.bantBaslik}>Giriş Yap</Text>
        <Text style={styles.slogan}>Alışverişe kaldığın yerden devam et.</Text>
      </View>

      {/* ---- BEYAZ YAPRAK ---- */}
      <View
        style={styles.yaprak}
        onLayout={(olay) => { yaprakY.current = olay.nativeEvent.layout.y; }}
      >
          <FormAlani
            etiket="E-posta"
            ikon="mail-outline"
            placeholder="e-posta@ornek.com"
            value={email}
            onChangeText={(metin) => {
              setEmail(metin);
              if (epostaHatasi) setEpostaHatasi('');
              if (hata) setHata('');
            }}
            hata={epostaHatasi}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!yukleniyor}
          />

          <FormAlani
            etiket="Şifre"
            ikon="lock-closed-outline"
            placeholder="••••••••"
            value={sifre}
            onChangeText={(metin) => {
              setSifre(metin);
              if (hata) setHata('');
            }}
            secureTextEntry={gizli}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!yukleniyor}
            sagIkon={gizli ? 'eye-outline' : 'eye-off-outline'}
            sagIkonEtiket={gizli ? 'Şifreyi göster' : 'Şifreyi gizle'}
            onSagIkonBas={() => setGizli(!gizli)}
          />

          {/* Sağa yaslı — tasarımdan. Şifre kutusunun hemen altında
              duruyor çünkü aklına orada geliyor. */}
          <TouchableOpacity
            style={styles.unuttumSatir}
            onPress={() => navigation.navigate('SifremiUnuttum')}
          >
            <Text style={styles.unuttumYazi}>Şifremi unuttum</Text>
          </TouchableOpacity>

          {hata !== '' && (
            <View style={styles.hataKutu}>
              <Ionicons name="alert-circle" size={18} color={renkler.hata} />
              <Text style={styles.hataYazi}>{hata}</Text>
            </View>
          )}

          {bilgi !== '' && (
            <View style={styles.bilgiKutu}>
              <Ionicons name="mail-outline" size={18} color={renkler.basari} />
              <Text style={styles.bilgiYazi}>{bilgi}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.anaButon, yukleniyor && styles.butonPasif]}
            onPress={girisButonu}
            disabled={yukleniyor}
            activeOpacity={0.85}
          >
            {yukleniyor
              ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
              : <Text style={styles.anaButonYazi}>Giriş Yap</Text>}
          </TouchableOpacity>

          {/* ⚠️ Çerçeve lacivert, turuncu değil: turuncu "asıl eylem"
              demek ve bu ekranın asıl eylemi giriş yapmak. İkisi de
              turuncu olsaydı hangisinin beklenen yol olduğu
              okunmazdı. */}
          <TouchableOpacity
            style={styles.ikincilButon}
            onPress={kapat}
            activeOpacity={0.85}
          >
            <Text style={styles.ikincilButonYazi}>Misafir olarak devam et</Text>
          </TouchableOpacity>

          {/* replace: Giriş'i yığından çıkarır, Kayıt'ı yerine koyar.
              push olsaydı iki ekran üst üste birikir ve geri tuşu
              kullanıcıyı az önce vazgeçtiği forma geri atardı. */}
          <TouchableOpacity
            style={styles.altSatir}
            onPress={() => navigation.replace('Kayit')}
          >
            <Text style={styles.altYazi}>
              Hesabın yok mu? <Text style={styles.altVurgu}>Kayıt ol</Text>
            </Text>
          </TouchableOpacity>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ⭐ DEĞİŞTİ — KAPATMA X'İ KAYDIRMANIN DIŞINDA.
          ⚠️ Bu ekranın kendi kuralı: "çıkış yolu her zaman görünür
          olmalı" — bu ekran bir modal ve klavye açıkken alttaki
          "Misafir olarak devam et" butonu görünmeyebiliyor. Bant
          artık kayıyor; X onunla birlikte kaysaydı klavye açıkken
          ekranda hiçbir çıkış kalmazdı.
          ⚠️ Beyaz daire + gölge: altında bazen lacivert bant bazen
          beyaz yaprak oluyor, tek renk ikon birinde kaybolurdu. */}
      <TouchableOpacity
        onPress={kapat}
        style={styles.kapatButon}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Kapat"
      >
        <Ionicons name="close" size={22} color={renkler.yaziKoyu} />
      </TouchableOpacity>

      {/* ⚠️ Bu pencere bir SORU sorduğu için pencere: kullanıcının
          seçmesi gereken bir eylem var (linki tekrar iste). Sonuç
          bildiren mesajlar ise ekrandaki kutulara yazılıyor. */}
      <OnayPenceresi
        acik={dogrulamaAcik}
        ikon="mail-unread-outline"
        baslik="Hesabın henüz doğrulanmadı"
        mesaj={`${dogrulamaMesaji}\n\nMaili bulamıyorsan yeni bir link isteyebilirsin.`}
        onayYazisi="Linki tekrar gönder"
        vazgecYazisi="Tamam"
        onOnayla={dogrulamaLinkiGonder}
        onVazgec={() => setDogrulamaAcik(false)}
      />
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  /* Zemin lacivert: yaprağın yuvarlak köşelerinin arkasından bant
     görünsün diye. Beyaz olsaydı köşeler kesik görünürdü. */
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.lacivertYuzey,
  },

  /* ⭐ DEĞİŞTİ (2026-08-12) — KAYIT EKRANIYLA BİREBİR AYNI BANT.
     ⚠️ Orantılı yükseklik (`ekran * 0.27`) KALDIRILDI: Kayıt'ta yok
     ve iki ekran arasında geçerken bandın boyu değişiyordu. Boy
     artık içerikten geliyor, ikisinde de aynı içerik var.
     ⚠️ Alt dolgu iki kat: yaprak bandın son 24dp'sini örtüyor,
     sloganın oraya sıkışmaması için. */
  bant: {
    alignItems: 'center',
    paddingHorizontal: bosluk.genis,
    paddingTop: bosluk.kucuk,
    paddingBottom: bosluk.genis + bosluk.genis,
  },

  /* Beyaz karo: logonun kendi beyaz zemini var, karo onu kusur
     olmaktan çıkarıp simge diline çeviriyor. */
  logoKaro: {
    width: 104,
    height: 104,
    borderRadius: kose.dev,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: bosluk.kucuk,
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  /* ⭐ DEĞİŞTİ — beyaz daire + gölge (Kayıt ekranıyla aynı).
     ⚠️ Eskiden bandın içinde çıplak beyaz bir ikondu ve bandın
     laciverdine güveniyordu. Bant artık kayıyor; X'in altında bazen
     lacivert bazen beyaz yaprak oluyor, tek renk ikon birinde
     kaybolurdu. */
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

  /* Kayıt ekranındaki "Hesap Oluştur" ile aynı punto ve renk. */
  bantBaslik: {
    fontSize: yazi.baslik,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.lacivertYuzeyUstuYazi,
    textAlign: 'center',
    marginTop: bosluk.orta,
  },

  /* ⚠️ Slogan lacivertYuzeyPasif — yaziGri burada okunmuyor
     (lacivert üstünde ~2,2:1). Bu token tam bu iş için var. */
  slogan: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.lacivertYuzeyPasif,
    textAlign: 'center',
    marginTop: bosluk.orta,
  },

  govde: { flex: 1 },

  /* ⭐ DEĞİŞTİ — `yaprakKap` KALDIRILDI (bant kaydırmaya girdi).
     ⚠️ `flexGrow: 1`: içerik ekrandan kısaysa yaprak yine de dibe
     kadar uzasın, altında lacivert şerit kalmasın. */
  kaydirmaIcerik: {
    flexGrow: 1,
  },

  yaprak: {
    flexGrow: 1,

    // ⚠️ Bandın son 24dp'sini örtüyor — eskiden `yaprakKap`'taydı.
    marginTop: -bosluk.genis,

    backgroundColor: renkler.kartArka,
    borderTopLeftRadius: kose.dev,
    borderTopRightRadius: kose.dev,
    paddingHorizontal: bosluk.genis,
    /* ⭐ DEĞİŞTİ (2026-08-12) — üst dolgu 24 → 32; Kayıt ekranıyla
       aynı sayı. İki ekran arasında `replace` ile gidilip geliniyor,
       farklı dolgu geçişi sıçratırdı. */
    paddingTop: bosluk.dev,
    paddingBottom: bosluk.dev,
  },

  /* ⚠️ Şifre kutusunun ALTINDA duruyor ama ona ait değil, bir
     kaçış yolu. FormAlani zaten altına 24 koyuyor; buradaki üst
     eksi boşluk onu 12'ye çekiyor ki bağlantı kutudan kopmasın,
     ardından butondan önce 24 nefes kalsın. */
  unuttumSatir: {
    alignSelf: 'flex-end',
    marginTop: -bosluk.orta,
    paddingVertical: bosluk.kucuk,
    marginBottom: bosluk.orta,
  },

  unuttumYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.anaRenk,
  },


  /* ---- DURUM KUTULARI ---- */

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

  bilgiKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    backgroundColor: renkler.yumusakBasari,
    borderLeftWidth: 3,
    borderLeftColor: renkler.basari,
    borderRadius: kose.kucuk,
    padding: bosluk.orta,
    marginBottom: bosluk.orta,
  },

  bilgiYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.basari,
  },


  /* ---- BUTONLAR ---- */

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

  /* ⚠️ Kenarlık `yaziKoyu`, `lacivertYuzey` DEĞİL.
     Önce lacivertti ve açık temada doğru duruyordu; koyu temada
     zeminle (#182a54) neredeyse aynı renge düşüp buton kayboldu —
     cihazda değil tarayıcıda yakalandı. Çerçeveyi yazının rengine
     bağlamak iki temada da okunur bir kontrast veriyor. */
  ikincilButon: {
    height: 48,
    borderWidth: 1.5,
    borderColor: renkler.yaziKoyu,
    borderRadius: kose.orta,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: bosluk.orta,
  },

  ikincilButonYazi: {
    color: renkler.yaziKoyu,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  /* marginTop: 'auto' — kayıt satırı yaprağın DİBİNE yapışıyor.
     Formun hemen altında olsaydı butonlarla arasında hiyerarşi
     kalmaz, üçüncü bir eylem gibi okunurdu. */
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
