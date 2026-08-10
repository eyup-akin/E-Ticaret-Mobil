import React, { useState } from 'react';
import { font } from '../theme/olculer';
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

  // Onay metni doğru yazıldı mı?
  //
  // trim(): telefon klavyeleri kelime sonunda otomatik boşluk ekleyebiliyor.
  // toUpperCase(): kullanıcı küçük harfle yazdıysa da kabul edelim —
  //   amaç "bilerek yaptığını kanıtlamak", imla sınavı yapmak değil.
  //   Aşırı katı olmak kullanıcıyı sinirlendirir, güvenlik kazandırmaz.
  const onayDogruMu = onayGirdi.trim().toUpperCase() === ONAY_METNI;

  // İki koşul birden sağlanmalı. Türetilmiş değer — ayrı state yok.
  const devamEdilebilir = onayDogruMu && sifre.length > 0;

  // Son uyarı penceresini açar.
  //
  // Neden ayrı bir adım? Buton basıldığında işlem HEMEN başlamasın.
  // Yazıyı yazmak "bilerek mi" sorusunu, şifre "sen kimsin" sorusunu
  // cevaplıyor. Bu pencere üçüncü ve farklı bir soruyu soruyor:
  // "hâlâ emin misin?" — son çıkış kapısı.
  function sonOnayiSor() {
    Alert.alert(
      'Emin misin?',
      'Hesabın kapatılacak ve kişisel bilgilerin silinecek. ' +
      'Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabımı Kapat',
          style: 'destructive',   // iOS'ta kırmızı gösterir
          onPress: kapat,
        },
      ]
    );
  }

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
      Alert.alert(
        'Hesabın kapatıldı',
        'Kişisel bilgilerin silindi. Geçmiş sipariş kayıtların yasal ' +
        'saklama yükümlülüğü nedeniyle muhasebe kaydı olarak saklanıyor, ' +
        'ancak artık kimliğinle ilişkilendirilemez.\n\n' +
        'Bizi tercih ettiğin için teşekkürler.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              // Yığının en başına dön.
              //
              // goBack() yeterli olmazdı: kullanıcı buraya
              // Hesabım → Hesabı Kapat yolundan geldi ve arada başka
              // ekranlar da olabilir. popToTop yığını temizleyip
              // Hesabım ekranına döndürüyor — orası token null olduğu
              // için otomatik olarak misafir görünümüne geçmiş durumda.
              navigation.popToTop();
            },
          },
        ]
      );
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
            onPress={sonOnayiSor}
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
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },
  icerik: {
    padding: 16,
    paddingBottom: 32,
  },

  /* ---- UYARI ---- */
  uyariKutu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: renkler.acikKart,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: renkler.hata,
    padding: 14,
    marginBottom: 24,
  },
  uyariYazi: {
    flex: 1,
    fontSize: 14,
    color: renkler.yaziKoyu,
    lineHeight: 20,
  },
  kalin: {
    fontWeight: 'bold',
    fontFamily: font.kalin,
    color: renkler.hata,
  },

  /* ---- LİSTELER ---- */
  bolumBaslik: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    marginBottom: 8,
  },
  listeKutu: {
    backgroundColor: renkler.acikKart,
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  listeSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  listeYazi: {
    flex: 1,
    fontSize: 14,
    color: renkler.yaziOrta,
  },
  aciklama: {
    fontSize: 13,
    color: renkler.yaziGri,
    lineHeight: 19,
  },

  /* ---- FORM ---- */
  ipucu: {
    fontSize: 13,
    color: renkler.yaziGri,
    lineHeight: 19,
    marginBottom: 10,
  },
  kod: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
  },
  input: {
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    color: renkler.yaziKoyu,
    backgroundColor: renkler.kartArka,
  },
  inputDogru: {
    borderColor: renkler.basari,
    borderWidth: 2,
  },

  /* ---- GÖSTER/GİZLE ---- */
  gosterSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  gosterYazi: {
    fontSize: 13,
    color: renkler.anaRenk,
    fontWeight: '600',
    fontFamily: font.yari,
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
    marginTop: 12,
  },
  hataYazi: {
    flex: 1,
    fontSize: 13,
    color: renkler.hata,
    lineHeight: 18,
  },

  /* ---- BUTONLAR ---- */
  tehlikeButon: {
    backgroundColor: renkler.hata,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  tehlikeButonPasif: {
    opacity: 0.45,
  },
  tehlikeYazi: {
    /* Sabit beyaz: hata rengi hem açık hem koyu temada koyu bir kırmızı
       tonu, üstünde beyaz her iki temada da okunuyor. renkler.yaziKoyu
       kullansaydık koyu temada açık gri olur ve kırmızı üstünde
       okunurluğu düşerdi. */
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: font.kalin,
  },
  vazgecButon: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  vazgecYazi: {
    fontSize: 15,
    color: renkler.anaRenk,
    fontWeight: '600',
    fontFamily: font.yari,
  },
});