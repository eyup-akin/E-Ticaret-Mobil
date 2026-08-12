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
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import { useTema } from '../context/TemaContext';
import Rozet from '../components/Rozet';
import OnayPenceresi from '../components/OnayPenceresi';

// ============================================================
//  ⭐ YENİ (4.9) — NUMARALARIM
//
//  Adreslerim ve Kartlarım ekranlarının üçüncü kardeşi: aynı üst
//  bar, aynı kart dili, aynı "yeni ekle" satırı, aynı silme
//  penceresi. Üçü de "hesabıma kayıtlı şeyler" sorusunu cevaplıyor;
//  farklı çizilselerdi müşteri her birinde yeni bir arayüz öğrenirdi.
//
//  ⚠️ NEDEN SEÇİM MODU YOK — Adres ve Kart ekranlarında var?
//  O ikisi sipariş akışının adımları (1/3, 2/3). Telefon sipariş
//  akışında ayrı bir adım DEĞİL: adres zaten bir numaraya bağlı,
//  müşteri adresi seçtiğinde numarayı da seçmiş oluyor. Seçim modu
//  eklemek, akışa dördüncü bir adım uydurmak olurdu.
//
//  ⚠️ NUMARA BİÇİMLENDİRME BURADA YOK. Sunucu `gorunum` alanını
//  hazır gönderiyor (TelefonBicimi.Goster). Burada ikinci bir
//  formatlayıcı yazsaydık admin panelindeki kopyasıyla ikiye
//  ayrılırdı — kural değişince biri unutulurdu.
// ============================================================
export default function NumaralarimEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [numaralar, setNumaralar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // Yeni numara formu
  const [formAcik, setFormAcik] = useState(false);
  const [numara, setNumara] = useState('');
  const [etiket, setEtiket] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // Silinecek kayıt. null = pencere kapalı.
  // ⚠️ Alert.alert değil OnayPenceresi — gerekçe AdresSec'te yazılı:
  // sistem penceresi koyu temada beyaz açılıyor ve markanın rengini
  // kullanmıyor.
  const [silinecek, setSilinecek] = useState(null);

  async function numaralariGetir() {
    try {
      const veri = await apiGet('/phones');
      setNumaralar(veri);
    } catch (hata) {
      console.log('Numaralar alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      numaralariGetir();
    }, [])
  );

  async function numaraEkle() {
    if (!numara.trim() || !etiket.trim()) {
      Alert.alert('Eksik bilgi', 'Numara ve etiket gerekli.');
      return;
    }

    try {
      setKaydediliyor(true);

      // ⚠️ Numara HAM HALİYLE gönderiliyor; normalizasyon sunucuda.
      // Burada temizleyip gönderseydik kural iki yerde yaşardı ve
      // sunucudakini değiştirdiğimizde mobil sessizce eski kuralla
      // çalışmaya devam ederdi.
      await apiPost('/phones', { numara: numara, etiket: etiket.trim() });

      setNumara('');
      setEtiket('');
      setFormAcik(false);
      await numaralariGetir();
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  async function asilYap(item) {
    try {
      await apiPut('/phones/' + item.id + '/varsayilan', {});
      await numaralariGetir();
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    }
  }

  async function numarayiSil(item) {
    try {
      await apiDelete('/phones/' + item.id);
      await numaralariGetir();
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    }
  }

  function numaraKarti(item) {
    return (
      <View key={item.id} style={styles.kart}>
        <View style={styles.kartIkon}>
          <Ionicons name="call-outline" size={22} color={renkler.yaziOrta} />
        </View>

        <View style={styles.kartOrta}>
          {/* ⚠️ Eşit genişlikli font: numara karakter karakter
              okunan bir metin (kupon kodu ve kart maskesiyle aynı
              karar). Orantılı fontta "111" ile "888" farklı
              genişlikte çıkıyor ve göz haneleri kaybediyor. */}
          <Text style={styles.kartNumara}>{item.gorunum}</Text>

          <View style={styles.kartAlt}>
            <Text style={styles.kartEtiket} numberOfLines={1}>{item.etiket}</Text>
            {item.varsayilanMi && <Rozet tip="vurgu" yazi="Asıl" />}
          </View>
        </View>

        {/* ⚠️ "Asıl yap" SADECE asıl olmayanlarda çizilir. Zaten asıl
            olan numarada da göstermek, hiçbir şey yapmayan bir buton
            koymak olurdu — "aynı işi yapan iki düğme koyma"nın
            kardeşi: "hiçbir işi olmayan düğme koyma". */}
        {!item.varsayilanMi && (
          <TouchableOpacity
            onPress={() => asilYap(item)}
            hitSlop={8}
            accessibilityLabel="Asıl numara yap"
            style={styles.asilButon}
          >
            <Ionicons name="star-outline" size={20} color={renkler.anaRenk} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => setSilinecek(item)}
          hitSlop={8}
          accessibilityLabel="Numarayı sil"
        >
          <Ionicons name="trash-outline" size={20} color={renkler.hata} />
        </TouchableOpacity>
      </View>
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
      <View style={styles.ustBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.geriButon}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <View style={styles.ustOrta}>
          <Text style={styles.ustBaslik}>Numaralarım</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.kapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.icerik}
          keyboardShouldPersistTaps="handled"
        >
          {numaralar.length === 0 && !formAcik && (
            <Text style={styles.bosYazi}>
              Henüz kayıtlı numaran yok. Aşağıdan ekleyebilirsin.
            </Text>
          )}

          {numaralar.map(numaraKarti)}

          {formAcik ? (
            <View style={styles.form}>
              <Text style={styles.formBaslik}>Yeni Numara</Text>

              <TextInput
                style={styles.input}
                placeholder="0532 123 45 67"
                placeholderTextColor={renkler.yaziGri}
                value={numara}
                onChangeText={setNumara}
                keyboardType="phone-pad"
                maxLength={20}
              />

              <TextInput
                style={styles.input}
                placeholder="Etiket (Cep, İş, Annem...)"
                placeholderTextColor={renkler.yaziGri}
                value={etiket}
                onChangeText={setEtiket}
                maxLength={30}
              />

              {/* ⚠️ HAZIR ETİKETLER — etiket zorunlu olduğu için
                  yazmayı kolaylaştırıyoruz. Serbest metin alanı
                  DURUYOR: "Annem", "Kapıcı", "Ofis santral" gibi
                  bizim tahmin edemeyeceğimiz etiketler var.
                  Hazır seçenek bir kısayol, bir kısıt değil. */}
              <View style={styles.hazirlar}>
                {['Cep', 'İş', 'Ev'].map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hazir, etiket === h && styles.hazirSecili]}
                    onPress={() => setEtiket(h)}
                  >
                    <Text style={[styles.hazirYazi, etiket === h && styles.hazirYaziSecili]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formButonlar}>
                <TouchableOpacity
                  style={styles.iptalButon}
                  onPress={() => setFormAcik(false)}
                >
                  <Text style={styles.iptalYazi}>Vazgeç</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.kaydetButon}
                  onPress={numaraEkle}
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
            /* Kesikli çerçeve kullanılmadı; gerekçe AdresSec'te:
               Android yuvarlak köşeyle birlikte çizmiyor. */
            <TouchableOpacity
              style={styles.ekleSatir}
              onPress={() => setFormAcik(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.ekleYazi}>Yeni numara ekle</Text>
              <Ionicons name="add" size={22} color={renkler.anaRenk} />
            </TouchableOpacity>
          )}

          {/* ⚠️ BU NOT EKRANIN EN ÖNEMLİ CÜMLESİ. Müşteri numarayı
              silmenin adresini de sileceğini ya da geçmiş siparişini
              bozacağını sanabilir. İkisi de olmuyor: adres numarasız
              kalıyor (yeniden seçilebilir), sipariş kendi dondurulmuş
              kopyasını taşıyor. */}
          <View style={styles.bilgiKutu}>
            <Ionicons name="information-circle-outline" size={16} color={renkler.yaziOrta} />
            <Text style={styles.bilgiYazi}>
              Adreslerin buradaki numaralara bağlıdır. Bir numarayı silersen
              ona bağlı adres numarasız kalır; geçmiş siparişlerin etkilenmez.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OnayPenceresi
        acik={silinecek !== null}
        ikon="trash-outline"
        yikici
        baslik="Numara silinsin mi?"
        mesaj={silinecek ? `${silinecek.gorunum} kalıcı olarak silinecek.` : ''}
        onayYazisi="Sil"
        onVazgec={() => setSilinecek(null)}
        onOnayla={() => {
          const kayit = silinecek;
          setSilinecek(null);
          if (kayit) numarayiSil(kayit);
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


  /* ---------- NUMARA SATIRI ---------- */

  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
  },

  kartIkon: {
    width: 44,
    height: 44,
    borderRadius: kose.orta,
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
  },

  kartOrta: {
    flex: 1,
    minWidth: 0,
  },

  kartNumara: {
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    letterSpacing: 1,
  },

  kartAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    marginTop: 4,
  },

  kartEtiket: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
    flexShrink: 1,
  },

  asilButon: {
    padding: 2,
  },


  /* ---------- YENİ NUMARA SATIRI ---------- */

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

  hazirlar: {
    flexDirection: 'row',
    gap: bosluk.kucuk,
    marginBottom: bosluk.orta,
  },

  hazir: {
    paddingHorizontal: bosluk.orta,
    paddingVertical: bosluk.kucuk,
    borderRadius: kose.tam,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    backgroundColor: renkler.arkaPlan,
  },

  hazirSecili: {
    borderColor: renkler.anaRenk,
    backgroundColor: renkler.yumusakVurgu,
  },

  hazirYazi: {
    fontSize: yazi.kucuk,
    color: renkler.yaziOrta,
  },

  hazirYaziSecili: {
    color: renkler.anaRenk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },

  formButonlar: {
    flexDirection: 'row',
    gap: bosluk.kucuk,
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


  /* ---------- BİLGİ NOTU ---------- */

  bilgiKutu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.kucuk,
    backgroundColor: renkler.acikKart,
    borderRadius: kose.orta,
    padding: bosluk.orta,
  },

  bilgiYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
  },
});
