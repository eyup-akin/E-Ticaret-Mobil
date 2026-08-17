import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import { apiGet, apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';
import { paraBicimle } from '../utils/bicimlendir';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

// ============================================================
//  ÖDEME EKRANI — iyzico ödeme sayfası uygulama içinde açılıyor
//
//  ⚠️ SONUÇ WEBVIEW'DEN OKUNMAZ. Sayfanın gösterdiği "ödendi"
//  yazısı bilgi değil; gerçek sonuç GET /odeme/durum ile sunucudan
//  soruluyor. Aksi hâlde sayfayı taklit eden biri bedava alışveriş
//  yapardı.
//
//  ⚠️ ORIGIN KISITLAMASI YOK. 3DS sırasında bankanın kendi alan
//  adına yönleniyor; whitelist koysak ödeme ortada kalırdı.
// ============================================================
export default function OdemeEkrani({ route, navigation }) {
  const { siparisId, siparisNo, toplam } = route.params;

  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const { sepetiSifirla } = useSepet();

  const [odemeUrl, setOdemeUrl] = useState(null);
  const [donusAdresi, setDonusAdresi] = useState(null);
  const [hata, setHata] = useState('');
  const [sorguluyor, setSorguluyor] = useState(false);

  // ⚠️ Sonuç sorgusu bir kez çalışsın. Dönüş adresine yönlenme
  // WebView'de iki kez tetiklenebiliyor (yükleme başladı + bitti) ve
  // iki kez sorgulamak iki kez ekran değiştirmek olurdu.
  const sonuclandiRef = useRef(false);

  // ---------- ödeme sayfasını başlat ----------
  useEffect(() => {
    let iptal = false;

    async function baslat() {
      try {
        const veri = await apiPost('/odeme/baslat', { siparisId });

        if (iptal) {
          return;
        }

        setOdemeUrl(veri.odemeSayfasiUrl);
        setDonusAdresi(veri.donusAdresi);
      } catch (e) {
        if (!iptal) {
          setHata(e.message);
        }
      }
    }

    baslat();

    return () => {
      iptal = true;
    };
  }, [siparisId]);

  // ---------- geri tuşu ----------
  //
  // ⚠️ Ödeme ortasında sessizce çıkmak müşteriyi yarım siparişle
  // bırakır. Android donanım tuşu da soruyor.
  useEffect(() => {
    function cikmakIstiyor() {
      if (sonuclandiRef.current) {
        return false;
      }

      Alert.alert(
        'Ödemeden vazgeçilsin mi?',
        'Siparişin duruyor ama ödemesi tamamlanmadı. Daha sonra "Siparişlerim" ekranından ödemeyi tamamlayabilirsin.',
        [
          { text: 'Ödemeye dön', style: 'cancel' },
          { text: 'Vazgeç', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );

      return true;
    }

    const abone = BackHandler.addEventListener('hardwareBackPress', cikmakIstiyor);
    return () => abone.remove();
  }, [navigation]);

  // ---------- sonucu SUNUCUDAN sor ----------
  async function sonucuSor() {
    if (sonuclandiRef.current) {
      return;
    }

    sonuclandiRef.current = true;
    setSorguluyor(true);

    try {
      const durum = await apiGet('/odeme/durum/' + siparisId);

      if (durum.odendiMi) {
        // Backend sepeti temizledi; ekranı da senkronla.
        sepetiSifirla();

        navigation.replace('SiparisBasarili', {
          siparisId,
          siparisNo,
          toplam: durum.toplam,
        });

        return;
      }

      if (durum.incelemedeMi) {
        // ⚠️ "Ödendi" demiyoruz: banka doğrulaması sürüyor ve ret
        // gelebilir. Sepet backend'de temizlendi, burada da temizle.
        sepetiSifirla();

        Alert.alert(
          'Ödeme doğrulanıyor',
          'Ödemen alındı ama banka doğrulaması sürüyor. Sonucu "Siparişlerim" ekranından takip edebilirsin.',
          [{ text: 'Tamam', onPress: () => navigation.goBack() }]
        );

        return;
      }

      // Başarısız ya da yarım kalmış: sipariş duruyor, tekrar denenebilir.
      Alert.alert(
        'Ödeme tamamlanmadı',
        durum.hataMesaji || 'Ödeme alınamadı. Siparişin duruyor, tekrar deneyebilirsin.',
        [
          {
            text: 'Tekrar dene',
            onPress: () => {
              sonuclandiRef.current = false;
              setSorguluyor(false);
              setOdemeUrl(null);
              setHata('');
              tekrarBaslat();
            },
          },
          { text: 'Kapat', style: 'cancel', onPress: () => navigation.goBack() },
        ]
      );
    } catch (e) {
      setHata(e.message);
    } finally {
      setSorguluyor(false);
    }
  }

  async function tekrarBaslat() {
    try {
      const veri = await apiPost('/odeme/baslat', { siparisId });
      setOdemeUrl(veri.odemeSayfasiUrl);
      setDonusAdresi(veri.donusAdresi);
    } catch (e) {
      setHata(e.message);
    }
  }

  // WebView her yönlenmede burayı çağırıyor. Tek işimiz dönüş
  // adresini yakalamak — sayfanın içeriğine hiç bakmıyoruz.
  function yonlenmeKontrol(olay) {
    if (donusAdresi && olay.url && olay.url.startsWith(donusAdresi)) {
      sonucuSor();
      return false;
    }

    return true;
  }

  return (
    <SafeAreaView style={styles.sayfa} edges={['top']}>
      <View style={styles.baslikCubugu}>
        <TouchableOpacity
          style={styles.geriDugme}
          onPress={() => {
            if (sonuclandiRef.current) {
              navigation.goBack();
              return;
            }

            Alert.alert(
              'Ödemeden vazgeçilsin mi?',
              'Siparişin duruyor ama ödemesi tamamlanmadı. Daha sonra "Siparişlerim" ekranından ödemeyi tamamlayabilirsin.',
              [
                { text: 'Ödemeye dön', style: 'cancel' },
                { text: 'Vazgeç', style: 'destructive', onPress: () => navigation.goBack() },
              ]
            );
          }}
        >
          <Ionicons name="chevron-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <View style={styles.baslikOrta}>
          <Text style={styles.baslik}>Güvenli Ödeme</Text>
          <Text style={styles.altBaslik}>{paraBicimle(toplam)}</Text>
        </View>

        {/* ⚠️ Kilit ikonu SÜS DEĞİL: WebView'de adres çubuğu
            görünmüyor, müşterinin tek göstergesi bu. */}
        <Ionicons name="lock-closed" size={18} color={renkler.basari} />
      </View>

      {hata !== '' ? (
        <View style={styles.ortala}>
          <Ionicons name="alert-circle-outline" size={44} color={renkler.hata} />
          <Text style={styles.hataYazi}>{hata}</Text>

          <TouchableOpacity style={styles.tekrarDugme} onPress={() => {
            setHata('');
            tekrarBaslat();
          }}>
            <Text style={styles.tekrarYazi}>Tekrar dene</Text>
          </TouchableOpacity>
        </View>
      ) : odemeUrl === null || sorguluyor ? (
        <View style={styles.ortala}>
          <ActivityIndicator size="large" color={renkler.anaRenk} />
          <Text style={styles.bekleYazi}>
            {sorguluyor ? 'Ödeme sonucu kontrol ediliyor...' : 'Ödeme sayfası açılıyor...'}
          </Text>
        </View>
      ) : (
        <WebView
          source={{ uri: odemeUrl }}
          style={styles.webview}
          onShouldStartLoadWithRequest={yonlenmeKontrol}
          onNavigationStateChange={yonlenmeKontrol}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.ortala}>
              <ActivityIndicator size="large" color={renkler.anaRenk} />
            </View>
          )}
          // 3DS sayfaları form gönderiyor ve çerez kullanıyor.
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
        />
      )}
    </SafeAreaView>
  );
}

function stilOlustur(renkler) {
  return StyleSheet.create({
    sayfa: {
      flex: 1,
      backgroundColor: renkler.arkaPlan,
    },

    baslikCubugu: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.orta,
      paddingHorizontal: sayfaKenari,
      paddingVertical: bosluk.orta,
      backgroundColor: renkler.kartArka,
      borderBottomWidth: 1,
      borderBottomColor: renkler.kenarlik,
    },

    geriDugme: {
      padding: bosluk.mikro,
    },

    baslikOrta: {
      flex: 1,
    },

    baslik: {
      fontSize: yazi.orta,
      fontWeight: agirlik.kalin,
      fontFamily: font.kalin,
      color: renkler.yaziKoyu,
    },

    altBaslik: {
      fontSize: yazi.kucuk,
      color: renkler.yaziOrta,
    },

    webview: {
      flex: 1,
    },

    ortala: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: bosluk.genis,
      gap: bosluk.orta,
    },

    bekleYazi: {
      fontSize: yazi.normal,
      color: renkler.yaziOrta,
      textAlign: 'center',
    },

    hataYazi: {
      fontSize: yazi.normal,
      color: renkler.yaziKoyu,
      textAlign: 'center',
      lineHeight: yazi.normal * satir.normal,
    },

    tekrarDugme: {
      marginTop: bosluk.kucuk,
      paddingVertical: bosluk.orta,
      paddingHorizontal: bosluk.genis,
      borderRadius: kose.orta,
      backgroundColor: renkler.anaRenk,
    },

    tekrarYazi: {
      fontSize: yazi.normal,
      fontWeight: agirlik.kalin,
      fontFamily: font.kalin,
      color: renkler.anaRenkUstuYazi,
    },
  });
}
