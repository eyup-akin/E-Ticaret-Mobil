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
import SifreGucu, { MIN_SIFRE } from '../components/SifreGucu';

// ⭐ DEĞİŞTİ (GV/Faz 7.11) — MIN_SIFRE artık SifreGucu bileşeninden
// geliyor. Sayı iki dosyada ayrı ayrı yazılıydı; biri değişip diğeri
// unutulsaydı çubuk "yeterli" derken form reddederdi.

export default function SifreDegistirEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const { sifreDegistir } = useAuth();

  const [eski, setEski] = useState('');
  const [yeni, setYeni] = useState('');
  const [yeniTekrar, setYeniTekrar] = useState('');

  // Şifreyi göster/gizle. Üç alan için TEK anahtar tutuyoruz —
  // kullanıcı genelde hepsini birden görmek ister.
  const [gizli, setGizli] = useState(true);

  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState('');

  // ⭐ YENİ (GV/Faz 7.11) — başarı penceresi.
  //
  // ⚠️ Alert.alert yerine OnayPenceresi; uygulamada tek bir pencere
  // dili olsun. "Vazgeç" yok çünkü geri alınacak bir şey yok: şifre
  // zaten değişti, pencere yalnızca sonucu bildiriyor.
  const [basariAcik, setBasariAcik] = useState(false);

  // Üç alan da dolu mu? Türetilmiş — buton durumunu bundan okuyoruz.
  const hepsiDolu =
    eski.length > 0 && yeni.length > 0 && yeniTekrar.length > 0;

  async function kaydet() {
    // ---- İSTEMCİ TARAFI DOĞRULAMA ----
    //
    // Bunlar GÜVENLİK katmanı DEĞİL — kullanıcıyı gereksiz ağ turundan
    // kurtaran kolaylık katmanı. Asıl kurallar backend'de:
    //   · [MinLength(6)] attribute'u
    //   · BCrypt.Verify ile eski şifre kontrolü
    //   · "yeni şifre eskisiyle aynı olamaz" kontrolü
    //
    // Biri Postman'den doğrudan istek atsa bu kontrollerin hiçbiri
    // çalışmaz ama sunucu yine reddeder.

    if (yeni.length < MIN_SIFRE) {
      setHata(`Yeni şifre en az ${MIN_SIFRE} karakter olmalı.`);
      return;
    }

    // ⭐ Bu kontrol SADECE burada var, sunucuda yok — ve olmasına gerek yok.
    //    "Tekrar" alanı yazım hatasını yakalamak için var, bir güvenlik
    //    kuralı değil. Sunucuya iki kez aynı şeyi göndermenin faydası
    //    olmazdı, sadece boşa veri taşırdı.
    if (yeni !== yeniTekrar) {
      setHata('Yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (yeni === eski) {
      setHata('Yeni şifre eskisiyle aynı olamaz.');
      return;
    }

    setHata('');
    setKaydediliyor(true);

    try {
      // AuthContext bu çağrıda sunucudan dönen YENİ token çiftini
      // kasaya yazıyor — o adım atlanırsa kullanıcı çıkışa düşer.
      await sifreDegistir(eski, yeni);

      setBasariAcik(true);
    } catch (e) {
      // Sunucudan gelen mesaj: "Mevcut şifren yanlış.",
      // "Yeni şifre eskisiyle aynı olamaz." veya rate limit hatası.
      setHata(e.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  // Üç şifre alanı birebir aynı yapıda — tekrar yazmamak için
  // küçük bir yardımcı. Değişen tek şey etiket, değer ve setter.
  function sifreAlani(etiket, deger, degistir, ipucu) {
    return (
      <View style={styles.alan}>
        <Text style={styles.etiket}>{etiket}</Text>

        <View style={styles.inputSarmal}>
          <TextInput
            style={styles.input}
            value={deger}
            onChangeText={(metin) => {
              degistir(metin);
              if (hata) setHata('');
            }}
            placeholder={ipucu}
            placeholderTextColor={renkler.yaziGri}
            /* secureTextEntry: karakterleri nokta olarak gösterir
               autoCapitalize="none": şifrede otomatik büyük harf olmaz
               autoCorrect={false}: telefon şifreyi "düzeltmeye" kalkmasın
               textContentType="password": iOS şifre yöneticisine ipucu */
            secureTextEntry={gizli}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!kaydediliyor}
          />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>Şifre Değiştir</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.kapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.icerik}>

          {/* Neden eski şifre soruyoruz — kullanıcıya açıklıyoruz.
              Açıklamayan uygulamalar "niye soruyor ki" tepkisi alır. */}
          <View style={styles.bilgiKutu}>
            <Ionicons name="shield-checkmark" size={20} color={renkler.anaRenk} />
            <Text style={styles.bilgiYazi}>
              Güvenliğin için mevcut şifrenizi de istiyoruz. Şifre değişince
              diğer cihazlardaki oturumlar kapatılır.
            </Text>
          </View>

          {sifreAlani('Mevcut Şifre', eski, setEski, 'Şu anki şifren')}
          {sifreAlani('Yeni Şifre', yeni, setYeni, `En az ${MIN_SIFRE} karakter`)}

          {/* ⭐ YENİ (GV/Faz 7.11) — güç göstergesi + kural listesi.

              ⚠️ Gösterge YENİ ŞİFRE alanının hemen altında, formun
              sonunda değil: kullanıcı yazarken görmeli. Aşağıda
              olsaydı geri bildirim, düzeltme fırsatı geçtikten sonra
              gelirdi.

              ⚠️ Zorunlu kural ile öneri AYRILDI. Sunucu bugün
              yalnızca "en az 6 karakter" uyguluyor; büyük harf/rakam
              kuralları backend'de YOK. Onları zorunlu diye
              göstermek, olmayan bir güvenliği vaat etmek olurdu. */}
          <SifreGucu sifre={yeni} />
          {sifreAlani('Yeni Şifre (Tekrar)', yeniTekrar, setYeniTekrar, 'Tekrar yaz')}

          {/* Göster/gizle — tek anahtar üç alanı birden etkiler */}
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
              {gizli ? 'Şifreleri göster' : 'Şifreleri gizle'}
            </Text>
          </TouchableOpacity>

          {hata !== '' && (
            <View style={styles.hataKutu}>
              <Ionicons name="alert-circle" size={18} color={renkler.hata} />
              <Text style={styles.hataYazi}>{hata}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.anaButon,
              (!hepsiDolu || kaydediliyor) && styles.anaButonPasif,
            ]}
            onPress={kaydet}
            disabled={!hepsiDolu || kaydediliyor}
          >
            {kaydediliyor ? (
              <ActivityIndicator color={renkler.anaRenkUstuYazi} />
            ) : (
              <Text style={styles.anaButonYazi}>Şifreyi Değiştir</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <OnayPenceresi
        acik={basariAcik}
        ikon="shield-checkmark-outline"
        tekButon
        baslik="Şifren değişti"
        mesaj="Diğer cihazlardaki oturumların kapatıldı. Bu cihazda oturumun açık kalmaya devam ediyor."
        onayYazisi="Tamam"
        onVazgec={() => { setBasariAcik(false); navigation.goBack(); }}
        onOnayla={() => { setBasariAcik(false); navigation.goBack(); }}
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


  /* ---- BİLGİ KUTUSU ---- */

  bilgiKutu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.kucuk,
    backgroundColor: renkler.acikKart,
    borderRadius: kose.orta,
    padding: bosluk.normal,
    marginBottom: bosluk.normal,
  },

  bilgiYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    color: renkler.yaziOrta,
    lineHeight: satir.kucuk,
  },


  /* ---- FORM ---- */

  alan: {
    marginBottom: bosluk.normal,
  },

  etiket: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.mikro,
  },

  inputSarmal: {
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    backgroundColor: renkler.kartArka,
  },

  input: {
    paddingHorizontal: bosluk.normal,
    height: 48,
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
  },


  /* ---- GÖSTER/GİZLE ---- */

  gosterSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    alignSelf: 'flex-start',
    paddingVertical: bosluk.kucuk,
    marginTop: bosluk.kucuk,
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


  /* ---- BUTON ---- */

  anaButon: {
    backgroundColor: renkler.anaRenk,
    paddingVertical: bosluk.normal,
    borderRadius: kose.orta,
    alignItems: 'center',
    marginTop: bosluk.genis,
  },

  anaButonPasif: {
    opacity: 0.5,
  },

  anaButonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },
});
