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

export default function ProfilDuzenleEkrani({ route, navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const { kullanici, profilGuncelle } = useAuth();

  // E-posta salt okunur gösterilecek; HesabimEkrani'ndan parametre olarak geliyor.
  // route.params boş gelebilir (örneğin derin bağlantıyla açılırsa),
  // o yüzden ?. ve ?? ile korunuyoruz.
  const eposta = route.params?.eposta ?? '';

  // Form başlangıç değeri: mevcut ad.
  // ?? '' → kullanici null ise TextInput'a undefined vermeyelim;
  // React Native'de undefined value kontrolsüz (uncontrolled) input yaratır.
  const [adSoyad, setAdSoyad] = useState(kullanici?.fullName ?? '');

  const [kaydediliyor, setKaydediliyor] = useState(false);

  // ⭐ YENİ (GV/Faz 7.13) — kaydedildi penceresi.
  // Alert.alert yerine OnayPenceresi; gerekçe diğer ekranlarla aynı.
  const [kaydedildiAcik, setKaydedildiAcik] = useState(false);
  const [hata, setHata] = useState('');

  // Değişiklik var mı? Türetilmiş değer — ayrı state tutmuyoruz.
  // Kullanıcı hiçbir şey değiştirmediyse "Kaydet" butonu soluk kalsın,
  // boşa ağ isteği atmayalım.
  const degistiMi = adSoyad.trim() !== (kullanici?.fullName ?? '').trim();

  async function kaydet() {
    const temiz = adSoyad.trim();

    // İstemci tarafı doğrulama — sunucudaki kuralın AYNISI.
    // Sunucuya gitmeden yakalayınca kullanıcı anında geri bildirim alıyor.
    // Ama bu bir GÜVENLİK katmanı değil; asıl kural DTO'daki
    // [StringLength(100, MinimumLength = 2)] attribute'unda.
    if (temiz.length < 2) {
      setHata('Ad soyad en az 2 karakter olmalı.');
      return;
    }

    if (temiz.length > 100) {
      setHata('Ad soyad en fazla 100 karakter olabilir.');
      return;
    }

    setHata('');
    setKaydediliyor(true);

    try {
      await profilGuncelle(temiz);

      // Bildirip geri dönüyoruz. Ekranda yeşil bir mesaj gösterip
      // beklemek de olurdu ama kullanıcı burada tek bir iş yapmaya
      // geldi; işi bitince geri dönmesi doğal.
      setKaydedildiAcik(true);
    } catch (e) {
      setHata(e.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>Profili Düzenle</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.kapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.icerik}>

          <Text style={styles.etiket}>Ad Soyad</Text>
          <TextInput
            style={styles.input}
            value={adSoyad}
            onChangeText={(metin) => {
              setAdSoyad(metin);
              if (hata) setHata('');   // yazmaya başlayınca hatayı temizle
            }}
            placeholder="Ad Soyad"
            placeholderTextColor={renkler.yaziGri}
            autoCapitalize="words"
            maxLength={100}
            editable={!kaydediliyor}
          />

          {/* ---- E-POSTA: KİLİTLİ ---- */}
          {/* Alanı hiç göstermemek "acaba nerede" sorusu yaratır.
              Kilitli gösterip sebebini yazmak durumu net söyler.
              Kupon formundaki kod alanıyla aynı yaklaşım. */}
          <Text style={[styles.etiket, { marginTop: 20 }]}>E-posta</Text>
          <View style={styles.kilitliSatir}>
            <Text style={styles.kilitliYazi} numberOfLines={1}>
              {eposta || '—'}
            </Text>
            <Ionicons name="lock-closed" size={16} color={renkler.yaziGri} />
          </View>

          <Text style={styles.ipucu}>
            E-posta adresi şu an değiştirilemiyor. Adres kimlik doğrulama
            anahtarı olduğu için değiştirmek yeni bir doğrulama akışı
            gerektiriyor.
          </Text>

          {hata !== '' && (
            <View style={styles.hataKutu}>
              <Ionicons name="alert-circle" size={18} color={renkler.hata} />
              <Text style={styles.hataYazi}>{hata}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.anaButon,
              (!degistiMi || kaydediliyor) && styles.anaButonPasif,
            ]}
            onPress={kaydet}
            disabled={!degistiMi || kaydediliyor}
          >
            {kaydediliyor ? (
              <ActivityIndicator color={renkler.anaRenkUstuYazi} />
            ) : (
              <Text style={styles.anaButonYazi}>Kaydet</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <OnayPenceresi
        acik={kaydedildiAcik}
        ikon="checkmark-circle-outline"
        tekButon
        baslik="Kaydedildi"
        mesaj="Profilin güncellendi."
        onayYazisi="Tamam"
        onVazgec={() => { setKaydedildiAcik(false); navigation.goBack(); }}
        onOnayla={() => { setKaydedildiAcik(false); navigation.goBack(); }}
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
  },

  etiket: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.mikro,
  },

  input: {
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    paddingHorizontal: bosluk.normal,
    height: 48,
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
    backgroundColor: renkler.kartArka,
  },


  /* ---- KİLİTLİ ALAN ---- */

  /* ⚠️ Kilitli alan input'la AYNI ölçülerde ama zemini acikGri ve
     kenarlığı daha silik: aynı kutu gibi görünüp basılamıyor olması
     kafa karıştırırdı, tamamen farklı görünmesi ise "bu bir alan
     değil" izlenimi verirdi. Ortada durması bilinçli. */
  kilitliSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    borderRadius: kose.orta,
    paddingHorizontal: bosluk.normal,
    height: 48,
    backgroundColor: renkler.acikGri,
  },

  kilitliYazi: {
    flex: 1,
    fontSize: yazi.orta,
    color: renkler.yaziOrta,
  },

  ipucu: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    lineHeight: satir.kucuk,
    marginTop: bosluk.kucuk,
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
    marginTop: bosluk.normal,
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
