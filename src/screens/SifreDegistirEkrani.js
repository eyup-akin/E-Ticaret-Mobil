import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTema } from '../context/TemaContext';
import { useAuth } from '../context/AuthContext';

// Sunucudaki kuralla AYNI sayı.
// İki katmanda farklı olsaydı arayüzde kabul edilen şifre sunucuda
// reddedilirdi — kullanıcı sebebini anlamazdı.
const MIN_SIFRE = 6;

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

      Alert.alert(
        'Şifren değişti',
        'Diğer cihazlardaki oturumların kapatıldı. Bu cihazda oturumun ' +
        'açık kalmaya devam ediyor.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
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
  icerik: {
    padding: 16,
  },

  /* ---- BİLGİ KUTUSU ---- */
  bilgiKutu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: renkler.acikKart,
    borderRadius: 10,
    padding: 14,
    marginBottom: 22,
  },
  bilgiYazi: {
    flex: 1,
    fontSize: 13,
    color: renkler.yaziOrta,
    lineHeight: 19,
  },

  /* ---- FORM ---- */
  alan: {
    marginBottom: 16,
  },
  etiket: {
    fontSize: 14,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 6,
  },
  inputSarmal: {
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: 8,
    backgroundColor: renkler.kartArka,
  },
  input: {
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: renkler.yaziKoyu,
  },

  /* ---- GÖSTER/GİZLE ---- */
  gosterSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  gosterYazi: {
    fontSize: 13,
    color: renkler.anaRenk,
    fontWeight: '600',
  },

  /* ---- HATA ---- */
  hataKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: renkler.acikKart,
    borderLeftWidth: 3,
    borderLeftColor: renkler.hata,
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
  },
  hataYazi: {
    flex: 1,
    fontSize: 13,
    color: renkler.hata,
    lineHeight: 18,
  },

  /* ---- BUTON ---- */
  anaButon: {
    backgroundColor: renkler.anaRenk,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  anaButonPasif: {
    opacity: 0.5,
  },
  anaButonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
});