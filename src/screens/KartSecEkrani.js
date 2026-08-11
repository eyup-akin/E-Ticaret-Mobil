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
import { apiGet, apiPost, apiDelete } from '../services/api';
import { useTema } from '../context/TemaContext';
import OnayPenceresi from '../components/OnayPenceresi';
import { tarihFormatla, tarihiParcala, numaraFormatla, numarayiTemizle } from '../services/kartYardimci';

export default function KartSecEkrani({ route, navigation }) {
  // adresId varsa SİPARİŞ AKIŞINDAYIZ (seçim modu)
  // yoksa HESABIM'dan geldik (yönetim modu)
  const adresId = route.params?.adresId;
  const secimModu = adresId !== undefined;

  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [kartlar, setKartlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliId, setSeciliId] = useState(null);

  // Yeni kart formu
  const [formAcik, setFormAcik] = useState(false);
  const [sahip, setSahip] = useState('');
  const [numara, setNumara] = useState('');
  const [tarih, setTarih] = useState('');     // "05/31" formatında
  const [cvv, setCvv] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  // ⭐ YENİ (GV/Faz 6.10) — silinecek kart. Gerekçe AdresSec'te yazılı:
  // sistem penceresi tema dışı kalıyordu.
  const [silinecek, setSilinecek] = useState(null);

  async function kartlariGetir() {
    try {
      const veri = await apiGet('/cards');
      setKartlar(veri);
      if (secimModu && veri.length === 1) setSeciliId(veri[0].id);
    } catch (hata) {
      console.log('Kartlar alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      kartlariGetir();
    }, [])
  );

  async function kartEkle() {
    const temizNumara = numarayiTemizle(numara);
    const tarihBilgi = tarihiParcala(tarih);

    if (!sahip || !temizNumara || !tarih || !cvv) {
      Alert.alert('Eksik bilgi', 'Tüm alanları doldur.');
      return;
    }
    if (temizNumara.length !== 16) {
      Alert.alert('Geçersiz kart', 'Kart numarası 16 haneli olmalı.');
      return;
    }
    if (!tarihBilgi) {
      Alert.alert('Geçersiz tarih', 'Son kullanma tarihini AA/YY şeklinde gir (örnek: 05/31).');
      return;
    }

    try {
      setKaydediliyor(true);
      await apiPost('/cards', {
        cardHolderName: sahip,
        cardNumber: temizNumara,        // backend SADECE son 4 haneyi saklar
        expiryMonth: tarihBilgi.ay,
        expiryYear: tarihBilgi.yil,
        cvv: cvv,                       // backend ASLA saklamaz
      });

      // Formu temizle — hassas veri hafızada kalmasın
      setSahip('');
      setNumara('');
      setTarih('');
      setCvv('');
      setFormAcik(false);
      await kartlariGetir();
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  async function kartiSil(item) {
    try {
      await apiDelete('/cards/' + item.id);
      await kartlariGetir();
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    }
  }

  function devamEt() {
    if (!seciliId) {
      Alert.alert('Kart seç', 'Devam etmek için bir kart seçmelisin.');
      return;
    }
    navigation.navigate('SiparisOnay', { adresId: adresId, kartId: seciliId });
  }

  /* ⭐ DEĞİŞTİ (GV/Faz 6.10) — KART SATIRI, ADRES KARTIYLA AYNI DİLDE.

     İki ekran aynı akışın iki adımı ve aynı soruyu soruyor
     ("hangisini seçiyorsun"). Farklı çizilselerdi müşteri her adımda
     yeni bir arayüz öğrenirdi.

     ⚠️ Kart tipi ikonu SOLDA, yumuşak zeminli bir karede: kart
     numarası tek başına hangi kart olduğunu söylemiyor, dört hane
     birbirine benziyor. */
  function kartKarti(item) {
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
        <View style={styles.kartIkon}>
          <Ionicons name="card-outline" size={22} color={renkler.yaziOrta} />
        </View>

        <View style={styles.kartOrta}>
          {/* ⚠️ Maskeli numara eşit genişlikli fontla: yıldızlar ve
              rakamlar aynı sütunda hizalanmazsa "**** 4242" bozuk
              görünüyor. Aynı karar kupon kodunda da verilmişti. */}
          <Text style={styles.kartNumara}>•••• {item.last4Digits}</Text>
          <Text style={styles.kartSahip} numberOfLines={1}>{item.cardHolderName}</Text>
          <Text style={styles.kartBilgi}>
            {item.cardType} · {String(item.expiryMonth).padStart(2, '0')}/
            {String(item.expiryYear).slice(-2)}
          </Text>
        </View>

        {secimModu ? (
          <Ionicons
            name={secili ? 'radio-button-on' : 'radio-button-off'}
            size={22}
            color={secili ? renkler.anaRenk : renkler.yaziGri}
          />
        ) : (
          <TouchableOpacity
            onPress={() => setSilinecek(item)}
            hitSlop={8}
            accessibilityLabel="Kartı sil"
          >
            <Ionicons name="trash-outline" size={20} color={renkler.hata} />
          </TouchableOpacity>
        )}
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
            {secimModu ? 'Ödeme Yöntemi' : 'Kartlarım'}
          </Text>
          {secimModu && <Text style={styles.adimYazi}>2 / 3 — Kart seç</Text>}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.kapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ⭐ DEĞİŞTİ (GV/Faz 6.10) — ScrollView içindeki FlatList
            kaldırıldı; gerekçe AdresSec'tekiyle aynı. */}
        <ScrollView
          contentContainerStyle={styles.icerik}
          keyboardShouldPersistTaps="handled"
        >
          {kartlar.length === 0 && !formAcik && (
            <Text style={styles.bosYazi}>
              Henüz kartın yok. Aşağıdan ekleyebilirsin.
            </Text>
          )}

          {kartlar.map(kartKarti)}

          {formAcik ? (
            <View style={styles.form}>
              <Text style={styles.formBaslik}>Yeni Kart</Text>

              <TextInput
                style={styles.input}
                placeholder="Kart üzerindeki isim"
                placeholderTextColor={renkler.yaziGri}
                value={sahip}
                onChangeText={setSahip}
                autoCapitalize="characters"
              />

              <TextInput
                style={styles.input}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={renkler.yaziGri}
                value={numara}
                onChangeText={(metin) => setNumara(numaraFormatla(metin))}
                keyboardType="number-pad"
                maxLength={19}   // 16 rakam + 3 boşluk
              />

              <View style={styles.ikiliSatir}>
                <TextInput
                  style={[styles.input, styles.inputYarim]}
                  placeholder="AA/YY"
                  placeholderTextColor={renkler.yaziGri}
                  value={tarih}
                  onChangeText={(metin) => setTarih(tarihFormatla(metin))}
                  keyboardType="number-pad"
                  maxLength={5}   // "05/31"
                />
                <TextInput
                  style={[styles.input, styles.inputYarim]}
                  placeholder="CVV"
                  placeholderTextColor={renkler.yaziGri}
                  value={cvv}
                  onChangeText={(metin) => setCvv(metin.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={3}
                  secureTextEntry
                />
              </View>

              {/* ⭐ DEĞİŞTİ (GV/Faz 6.10) — GÜVENLİK NOTU ARTIK
                  KİLİT İKONLU BİR KUTU, italik bir dipnot değil.

                  ⚠️ Bu cümle ekrandaki en önemli metin: müşteri kart
                  numarasını yazarken "bu nereye gidiyor" diye
                  düşünüyor. İtalik gri dipnot, okunmayan yerdi. */}
              <View style={styles.guvenlikKutu}>
                <Ionicons name="lock-closed" size={16} color={renkler.basari} />
                <Text style={styles.guvenlikYazi}>
                  Kart numaran ve CVV'n saklanmaz — sadece son 4 hane kaydedilir.
                </Text>
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
                  onPress={kartEkle}
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
              <Text style={styles.ekleYazi}>Yeni kart ekle</Text>
              <Ionicons name="add" size={22} color={renkler.anaRenk} />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Devam butonu SADECE seçim modunda */}
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
        baslik="Kart silinsin mi?"
        mesaj={silinecek ? `•••• ${silinecek.last4Digits} numaralı kart kalıcı olarak silinecek.` : ''}
        onayYazisi="Sil"
        onVazgec={() => setSilinecek(null)}
        onOnayla={() => {
          const kart = silinecek;
          setSilinecek(null);
          if (kart) kartiSil(kart);
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


  /* ---------- KART SATIRI ---------- */

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

  /* Gerekçe AdresSec'te: kalınlık değişseydi seçim her değiştiğinde
     liste 1px zıplardı. */
  kartSecili: {
    borderColor: renkler.anaRenk,
    backgroundColor: renkler.yumusakVurgu,
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

  kartSahip: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
    marginTop: 2,
  },

  kartBilgi: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },


  /* ---------- YENİ KART SATIRI ---------- */

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

  ikiliSatir: {
    flexDirection: 'row',
    gap: bosluk.kucuk,
  },

  inputYarim: {
    flex: 1,
  },

  guvenlikKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    backgroundColor: renkler.yumusakBasari,
    borderRadius: kose.kucuk,
    paddingVertical: bosluk.kucuk,
    paddingHorizontal: bosluk.orta,
    marginBottom: bosluk.orta,
  },

  guvenlikYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.basari,
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
