import React, { useState } from 'react';
import {
  View,
  Text,
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
import { apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';
import { epostaGecerliMi } from '../utils/dogrulama';
import FormAlani from '../components/FormAlani';

// ============================================================
//  ŞİFREMİ UNUTTUM  (GV/Faz 8.3)
//
//  Tasarım: `ifremi_unuttum_ve_giri_gerekli` (üstteki iki kart)
//
//  Giriş ve Kayıt ile aynı iskelet: lacivert bant + beyaz yaprak.
//  Tasarım burayı tek başına duran bir kart gibi çiziyor ama bu
//  ekran o ikisinin arasında yaşıyor; üç ekranın iskeleti aynı
//  olmazsa geçişler sıçrama gibi görünür.
//
//  ⚠️ İKİ DURUM, TEK EKRAN: form ve "gönderdik" onayı. Link
//  gönderildiğinde form GİZLENİYOR — her istek yeni bir token
//  üretip öncekini geçersiz kılıyor, üst üste basan kullanıcı
//  elindeki maildeki linki kendi eliyle çürütmüş olurdu.
// ============================================================
export default function SifremiUnuttumEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [email, setEmail] = useState('');
  const [basari, setBasari] = useState('');   // backend'in dönen mesajı
  const [yukleniyor, setYukleniyor] = useState(false);
  const [alanHatasi, setAlanHatasi] = useState('');
  const [hata, setHata] = useState('');

  // Bu ekran Giriş'in üstüne açılıyor; geri dönülecek yer var.
  function geriDon() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Giris');
    }
  }

  async function gonderButonu() {
    if (!epostaGecerliMi(email)) {
      setAlanHatasi('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setAlanHatasi('');
    setHata('');

    try {
      setYukleniyor(true);

      const veri = await apiPost('/auth/forgot-password', { email });

      // ⚠️ Backend email kayıtlı OLSA DA OLMASA DA aynı 200'ü döner
      // (user enumeration koruması). Bu yüzden "bulunamadı" dalı YOK.
      setBasari(veri.mesaj);
    } catch (e) {
      // Buraya sadece gerçek hatalar düşer: ağ kopukluğu, 500, rate limit...
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.bant}>
        <TouchableOpacity
          onPress={geriDon}
          style={styles.geriButon}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <Ionicons name="arrow-back" size={24} color={renkler.lacivertYuzeyUstuYazi} />
        </TouchableOpacity>

        <Text style={styles.marka}>Şifreni mi unuttun?</Text>
        <Text style={styles.slogan}>
          E-posta adresini gir, sana bir sıfırlama bağlantısı gönderelim.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.yaprakKap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.yaprak}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {basari === '' ? (
            <>
              <FormAlani
                etiket="E-posta"
                ikon="mail-outline"
                placeholder="e-posta@ornek.com"
                value={email}
                onChangeText={(m) => {
                  setEmail(m);
                  if (alanHatasi) setAlanHatasi('');
                  if (hata) setHata('');
                }}
                hata={alanHatasi}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!yukleniyor}
              />

              {hata !== '' && (
                <View style={styles.hataKutu}>
                  <Ionicons name="alert-circle" size={18} color={renkler.hata} />
                  <Text style={styles.hataYazi}>{hata}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.anaButon, yukleniyor && styles.butonPasif]}
                onPress={gonderButonu}
                disabled={yukleniyor}
                activeOpacity={0.85}
              >
                {yukleniyor
                  ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
                  : <Text style={styles.anaButonYazi}>Sıfırlama Bağlantısı Gönder</Text>}
              </TouchableOpacity>
            </>
          ) : (
            /* ⚠️ Onay durumu yumuşak zeminli bir daire + iki satır.
               Tasarımdaki yeşil çerçeveli kutu yerine bu dil
               seçildi: uygulamadaki diğer "oldu" ekranları
               (BosDurum, sipariş başarılı) böyle görünüyor. */
            <View style={styles.onayKutu}>
              <View style={styles.onayDaire}>
                <Ionicons name="mail-open-outline" size={38} color={renkler.basari} />
              </View>

              <Text style={styles.onayBaslik}>Bağlantıyı e-postana gönderdik</Text>
              <Text style={styles.onayMetin}>{basari}</Text>
              <Text style={styles.onayAlt}>
                Linke tıklayıp yeni şifreni belirledikten sonra buradan giriş
                yapabilirsin.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.altSatir}
            onPress={() => navigation.replace('Giris')}
          >
            <Text style={styles.altVurgu}>Giriş sayfasına dön</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.lacivertYuzey,
  },

  bant: {
    paddingHorizontal: bosluk.genis,
    paddingTop: bosluk.kucuk,
    paddingBottom: bosluk.dev,
  },

  geriButon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  marka: {
    fontSize: yazi.baslik,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.lacivertYuzeyUstuYazi,
    marginTop: bosluk.kucuk,
  },

  slogan: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.lacivertYuzeyPasif,
    marginTop: bosluk.mikro,
  },

  yaprakKap: {
    flex: 1,
    marginTop: -bosluk.genis,
  },

  yaprak: {
    flexGrow: 1,
    backgroundColor: renkler.kartArka,
    borderTopLeftRadius: kose.dev,
    borderTopRightRadius: kose.dev,
    paddingHorizontal: bosluk.genis,
    paddingTop: bosluk.genis,
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


  /* ---- GÖNDERİLDİ DURUMU ---- */

  onayKutu: {
    alignItems: 'center',
    paddingVertical: bosluk.normal,
  },

  onayDaire: {
    width: 96,
    height: 96,
    borderRadius: kose.tam,
    backgroundColor: renkler.yumusakBasari,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: bosluk.normal,
  },

  onayBaslik: {
    fontSize: yazi.buyuk,
    lineHeight: satir.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    textAlign: 'center',
    marginBottom: bosluk.kucuk,
  },

  onayMetin: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.yaziOrta,
    textAlign: 'center',
  },

  onayAlt: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziGri,
    textAlign: 'center',
    marginTop: bosluk.orta,
  },

  altSatir: {
    marginTop: 'auto',
    paddingTop: bosluk.genis,
    alignItems: 'center',
  },

  altVurgu: {
    fontSize: yazi.normal,
    color: renkler.anaRenk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },
});
