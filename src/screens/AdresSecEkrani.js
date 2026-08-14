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
import { useTema } from '../context/TemaContext';
import { apiGet, apiDelete } from '../services/api';
import OnayPenceresi from '../components/OnayPenceresi';

export default function AdresSecEkrani({ route, navigation }) {
  // siparisAkisi parametresi varsa SEÇİM modu, yoksa YÖNETİM modu
  const secimModu = route.params?.siparisAkisi === true;
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [adresler, setAdresler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliId, setSeciliId] = useState(null);

  /* ⭐ DEĞİŞTİ — FORM STATE'LERİ BU EKRANDAN GİTTİ.
   *
   * Başlık, açık adres, şehir, telefon seçimi ve kaydetme durumu
   * artık AdresEkleEkrani'nda yaşıyor. Bu ekran yalnızca LİSTELİYOR
   * ve seçtiriyor.
   *
   * ⚠️ Telefon defteri de gitti: numarayı yalnızca form soruyordu.
   * Burada tutmaya devam etseydik her liste açılışında gereksiz bir
   * /phones isteği atılırdı. */

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

  useFocusEffect(
    useCallback(() => {
      adresleriGetir();
    }, [])
  );

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
          {/* ⭐ YENİ — BAŞLIĞIN YANINDA KONUM İKONU.
              ⚠️ Kart tarafında bu rol lacivert kare ikonun; burada
              başlık ("Ev", "İş") zaten kimliği taşıdığı için kare
              gereksiz olurdu. Küçük turuncu bir pin, adres kartını
              kart kartından ayırmaya yetiyor.
              ⚠️ Turuncu ama BASILABİLİR DEĞİL — ikon tek başına eylem
              ima etmiyor; ekrandaki tek dolu turuncu öğe "Kaydet"
              butonu ve o bambaşka bir boyutta. */}
          <View style={styles.adresIkon}>
            <Ionicons name="location" size={16} color={renkler.anaRenkKoyu} />
          </View>

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
               eylem" yeri.

               ⭐ DEĞİŞTİ — çıplak ikon yerine yumuşak kırmızı daire;
               gerekçe KartSecEkrani'nda. */
            <TouchableOpacity
              style={styles.silDaire}
              onPress={() => setSilinecek(item)}
              hitSlop={8}
              accessibilityLabel="Adresi sil"
            >
              <Ionicons name="trash-outline" size={18} color={renkler.hata} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.adresMetin}>{item.fullAddress}</Text>

        {/* ⭐ DEĞİŞTİ — ŞEHİR VE TELEFON ARTIK İKONLU, ALT ALTA DEĞİL.
            ⚠️ Eskiden iki ayrı gri satırdı ve hangisinin ne olduğu
            ancak içeriğe bakarak anlaşılıyordu ("Denizli" mi şehir mi
            mahalle mi?). İkon, etiket yazmadan bunu söylüyor.
            ⚠️ `flexWrap`: uzun şehir + telefon dar ekranda alt alta
            düşsün, kırpılmasın. */}
        <View style={styles.metaSatir}>
          <View style={styles.metaOge}>
            <Ionicons name="business-outline" size={13} color={renkler.yaziGri} />
            <Text style={styles.metaYazi}>{item.city}</Text>
          </View>

          {item.phone ? (
            <View style={styles.metaOge}>
              <Ionicons name="call-outline" size={13} color={renkler.yaziGri} />
              <Text style={styles.metaYazi}>{item.phone}</Text>
            </View>
          ) : null}
        </View>
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
          {adresler.length === 0 && (
            <Text style={styles.bosYazi}>
              Henüz adresin yok. Aşağıdan ekleyebilirsin.
            </Text>
          )}

          {adresler.map(adresKarti)}

          {/* ⭐ DEĞİŞTİ — SATIR İÇİ FORM KALDIRILDI, AYRI EKRANA GEÇTİ.
              ⚠️ Form bu listenin içinde açılıyordu: liste uzunsa
              ekranın altında kalıyor, ayrıca "vazgeç" ile "sil"
              butonları aynı ekranda yan yana duruyordu. Artık
              AdresEkleEkrani'na gidiliyor.
              ⚠️ Dönüşte liste kendini tazeliyor (useFocusEffect),
              yeni adres elle eklenmiyor — sunucudaki gerçek ne ise o
              görünüyor.

              ⚠️ Tasarım burayı KESİKLİ çerçeveyle çiziyor; biz düz
              çerçeve + yumuşak zemin kullanıyoruz. Sebep tasarım
              sistemi skill'inde yazılı: `borderStyle: 'dashed'`
              Android'de yuvarlatılmış köşelerle birlikte ÇİZİLMİYOR,
              yani iOS'ta kesikli Android'de düz görünürdü. */}
          <TouchableOpacity
            style={styles.ekleSatir}
            onPress={() => navigation.navigate('AdresEkle')}
            activeOpacity={0.85}
          >
            <Text style={styles.ekleYazi}>Yeni adres ekle</Text>
            <Ionicons name="add" size={22} color={renkler.anaRenk} />
          </TouchableOpacity>
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

  /* ⭐ DEĞİŞTİ — kart gölgeli ve daha yuvarlak (KartSecEkrani ile
     birebir aynı ölçüler: iki ekran aynı akışın iki adımı).
     ⚠️ `elevation` tek başına yazılmadı — iOS'ta hiçbir etkisi yok.
     ⚠️ Kenarlık duruyor: koyu temada gölge görünmüyor, sınırı o
     taşıyor. */
  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.dev,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
    ...renkler.golgeSm,
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

  /* ⭐ YENİ — başlığın yanındaki turuncu pin karesi. */
  adresIkon: {
    width: 28,
    height: 28,
    borderRadius: kose.kucuk,
    backgroundColor: renkler.yumusakVurgu,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ⭐ YENİ — şehir ve telefon tek satırda, ikonlu.
     ⚠️ `adresSehir` ve `adresTelefon` stilleri KALDIRILDI, ölü kod
     bırakılmadı: ikisinin de tek tüketicisi buydu. */
  metaSatir: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: bosluk.normal,
    marginTop: bosluk.kucuk,
  },

  metaOge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.mikro,
  },

  metaYazi: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
  },

  /* ⭐ YENİ — silme dairesi (KartSecEkrani ile aynı). */
  silDaire: {
    width: 36,
    height: 36,
    borderRadius: kose.tam,
    backgroundColor: renkler.yumusakHata,
    justifyContent: 'center',
    alignItems: 'center',
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






  /* ---------- TELEFON SEÇİMİ (4.9) ---------- */
















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
