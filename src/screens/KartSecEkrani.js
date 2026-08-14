import React, { useState, useCallback } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiDelete } from '../services/api';
import { useTema } from '../context/TemaContext';
import OnayPenceresi from '../components/OnayPenceresi';

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

  /* ⭐ DEĞİŞTİ — FORM STATE'LERİ BU EKRANDAN GİTTİ.
   * Kart numarası, CVV ve kaydetme durumu artık KartEkleEkrani'nda.
   * ⚠️ Hassas verinin bu ekranda hiç tutulmaması ayrıca iyi: liste
   * ekranı açık kaldığı sürece CVV bellekte duruyordu. */

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
        {/* ⭐ DEĞİŞTİ — İKON KARESİ ARTIK LACİVERT.
            ⚠️ Eskiden `acikKart` zemin + `yaziOrta` ikon vardı: gri
            üstüne gri. Ekranın en solundaki ve ilk göze çarpan öğe
            renksizdi, kart da bu yüzden "eski" duruyordu. Lacivert,
            paletin ikinci rengi ve avatarda da aynı token kullanılıyor
            — turuncu yapılmadı çünkü turuncu bu uygulamada EYLEM
            demek, bu ise bir simge. */}
        <View style={styles.kartIkon}>
          <Ionicons name="card" size={24} color={renkler.lacivertYuzeyUstuYazi} />
        </View>

        <View style={styles.kartOrta}>
          {/* ⚠️ Maskeli numara eşit genişlikli fontla: yıldızlar ve
              rakamlar aynı sütunda hizalanmazsa "**** 4242" bozuk
              görünüyor. Aynı karar kupon kodunda da verilmişti. */}
          <Text style={styles.kartNumara}>•••• {item.last4Digits}</Text>
          <Text style={styles.kartSahip} numberOfLines={1}>{item.cardHolderName}</Text>

          {/* ⭐ DEĞİŞTİ — kart markası ve son kullanma AYRI okunuyor.
              ⚠️ Eskiden "Mastercard · 12/30" tek gri satırdı ve ikisi
              de aynı ağırlıktaydı. Marka bir kimlik (hap içinde),
              tarih ise bir ayrıntı (küçük, gri) — farklı şeyler,
              farklı görünmeliler. */}
          <View style={styles.kartMetaSatir}>
            <View style={styles.markaHap}>
              <Text style={styles.markaYazi}>{item.cardType}</Text>
            </View>

            <Text style={styles.kartBilgi}>
              {String(item.expiryMonth).padStart(2, '0')}/{String(item.expiryYear).slice(-2)}
            </Text>
          </View>
        </View>

        {secimModu ? (
          <Ionicons
            name={secili ? 'radio-button-on' : 'radio-button-off'}
            size={22}
            color={secili ? renkler.anaRenk : renkler.yaziGri}
          />
        ) : (
          /* ⭐ DEĞİŞTİ — çıplak ikon yerine yumuşak kırmızı daire.
             ⚠️ Tek başına duran bir çöp kovası hem dokunma hedefi
             belirsiz bırakıyordu hem de kartın içinde "başıboş"
             duruyordu. Daire, hedefi görünür kılıyor ve rengi
             `yumusakHata` olduğu için kırmızıyı bağırtmıyor. */
          <TouchableOpacity
            style={styles.silDaire}
            onPress={() => setSilinecek(item)}
            hitSlop={8}
            accessibilityLabel="Kartı sil"
          >
            <Ionicons name="trash-outline" size={18} color={renkler.hata} />
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
          {kartlar.length === 0 && (
            <Text style={styles.bosYazi}>
              Henüz kartın yok. Aşağıdan ekleyebilirsin.
            </Text>
          )}

          {kartlar.map(kartKarti)}

          {/* ⭐ DEĞİŞTİ — SATIR İÇİ FORM KALDIRILDI, AYRI EKRANA GEÇTİ.
              Gerekçe AdresSecEkrani'ndaki notta; ikisi aynı akışın
              iki adımı ve aynı şekilde davranmalı. */}
          <TouchableOpacity
            style={styles.ekleSatir}
            onPress={() => navigation.navigate('KartEkle')}
            activeOpacity={0.85}
          >
            <Text style={styles.ekleYazi}>Yeni kart ekle</Text>
            <Ionicons name="add" size={22} color={renkler.anaRenk} />
          </TouchableOpacity>
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

  /* ⭐ DEĞİŞTİ — kart artık gölgeli ve daha yuvarlak.
     ⚠️ `elevation` TEK BAŞINA YAZILMADI: yalnızca Android'de
     çalışıyor, iOS'ta kart tamamen düz kalırdı. Tema gölgesi
     shadowColor/Offset/Opacity/Radius + elevation'ı birlikte veriyor.
     ⚠️ Kenarlık DURUYOR: gölge koyu temada neredeyse görünmez
     (siyah üstüne siyah), kartın sınırını orada kenarlık taşıyor. */
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.normal,
    backgroundColor: renkler.kartArka,
    borderRadius: kose.dev,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,

    /* ⚠️⚠️ GÖLGE KALDIRILDI — SEÇİLİ KARTTA HATA ÜRETİYORDU.
     *
     * `golgeSm` içinde `elevation` var ve seçili kart zemini
     * `yumusakVurgu`, yani SAYDAM bir renk (rgba). Android
     * yükseltilmiş bir görünümün gölgesini arkasına çiziyor; zemin
     * saydam olunca o gölge FİLTRENİN ALTINDAN görünüyor ve kartın
     * içinde gri bir dikdörtgen beliriyordu (cihazda görüldü).
     *
     * ⚠️ Çözüm "seçiliyken gölgeyi kapat" DEĞİL: o zaman seçili kart
     * düz, diğerleri yükseltilmiş görünür ve seçim bir kusur gibi
     * okunurdu. Gölge iki durumdan da kalktı; kartı zaten 1px
     * kenarlık ve yuvarlak köşe tanımlıyor.
     *
     * ⚠️ `yumusakVurgu`'yu opak bir tona çevirmek de düşünüldü ve
     * ELENDİ: tema dosyasında bu rengin neden rgba olduğu yazılı —
     * hem beyaz kart hem kırık-beyaz sayfa üstünde kullanılıyor ve
     * düz renk ikisinden birinde tutmuyor. */
  },

  /* Gerekçe AdresSec'te: kalınlık değişseydi seçim her değiştiğinde
     liste 1px zıplardı. */
  kartSecili: {
    borderColor: renkler.anaRenk,
    backgroundColor: renkler.yumusakVurgu,
  },

  kartIkon: {
    width: 52,
    height: 52,
    borderRadius: kose.orta,
    backgroundColor: renkler.lacivertYuzey,
    justifyContent: 'center',
    alignItems: 'center',
  },

  kartOrta: {
    flex: 1,
    minWidth: 0,
  },

  kartNumara: {
    // ⭐ DEĞİŞTİ — bir punto büyüdü: kartı ayırt eden bilgi bu.
    fontSize: yazi.buyuk,
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
  },

  /* ⭐ YENİ — marka hapı + son kullanma tarihi aynı satırda. */
  kartMetaSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    marginTop: bosluk.kucuk,
  },

  /* ⚠️ Ortak `Rozet` KULLANILMADI: o bileşen bir DURUM etiketi
     (basari/uyari/hata/vurgu). Kart markası bir durum değil, bir
     kimlik. Bilinmeyen bir tip verip gri kutu almak, bileşenin
     sözleşmesini istismar etmek olurdu. */
  markaHap: {
    paddingHorizontal: bosluk.kucuk,
    paddingVertical: 2,
    borderRadius: kose.tam,
    backgroundColor: renkler.yumusakVurgu,
  },

  markaYazi: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.anaRenkKoyu,
  },

  /* ⭐ YENİ — silme dairesi. */
  silDaire: {
    width: 36,
    height: 36,
    borderRadius: kose.tam,
    backgroundColor: renkler.yumusakHata,
    justifyContent: 'center',
    alignItems: 'center',
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
