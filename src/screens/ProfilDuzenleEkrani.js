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

      // Alert ile bildirip geri dönüyoruz.
      // Ekranda yeşil mesaj gösterip beklemek de olurdu ama kullanıcı
      // burada tek bir iş yapmaya geldi; işi bitince listeye dönmesi doğal.
      Alert.alert('Kaydedildi', 'Profilin güncellendi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
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
  },
  etiket: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: 6,
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

  /* ---- KİLİTLİ ALAN ---- */
  kilitliSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: renkler.acikGri,
  },
  kilitliYazi: {
    flex: 1,
    fontSize: 15,
    color: renkler.yaziOrta,
  },
  ipucu: {
    fontSize: 12,
    color: renkler.yaziGri,
    lineHeight: 18,
    marginTop: 8,
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
    marginTop: 18,
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
    marginTop: 26,
  },
  anaButonPasif: {
    opacity: 0.5,
  },
  anaButonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: font.kalin,
  },
}); 