import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiPost } from '../services/api';
import { refreshTokenAl } from '../services/tokenStorage';
import { tarihBicimle } from '../utils/bicimlendir';
import { useTema } from '../context/TemaContext';


// User-Agent metnini okunabilir hâle çevirir.
//
// ⚠️ SIRA ÇOK ÖNEMLİ — tarihsel bir karmaşa yüzünden:
//     Edge'in UA'sı "Chrome" DA içeriyor (Chromium tabanlı)
//     Chrome'un UA'sı "Safari" DE içeriyor (eski uyumluluk mirası)
//     Opera'nın UA'sı "Chrome" DA içeriyor
//
//   Genelden özele bakarsak hepsi "Chrome" çıkar. ÖZELDEN GENELE
//   bakmak zorundayız: Edge → Opera → Firefox → Chrome → Safari.
//
// Bu yüzden UA ayrıştırma güvenilir bir teknik DEĞİLDİR; sadece
// kullanıcıya ipucu vermek için kullanılır, karar vermek için asla.
// O yüzden ham metni de ekranda gösteriyoruz.
//
// ⭐ Admin panelindeki OturumListesi.jsx'te AYNI mantık var.
//    İki katmanda aynı işi aynı isimle yapmak bilinçli — birini
//    okuyan diğerini de anlar. (React ile React Native aynı kodu
//    paylaşamıyor; ortak bir pakete çıkarmak bu projede aşırı olurdu.)
function cihazOku(ua) {
  if (!ua || ua.trim() === '') {
    return { tarayici: 'Bilinmeyen cihaz', sistem: '', ikon: 'help-circle-outline' };
  }

  let tarayici = 'Bilinmeyen tarayıcı';
  let ikon = 'desktop-outline';

  // Mobil uygulama isteklerini önce yakalıyoruz — React Native'in
  // ağ katmanı (Android'de okhttp) tarayıcı imzası taşımıyor.
  if (ua.includes('okhttp') || ua.includes('Expo') || ua.includes('ReactNative')) {
    tarayici = 'Mobil uygulama';
    ikon = 'phone-portrait-outline';
  } else if (ua.includes('Edg/')) {
    tarayici = 'Edge';
  } else if (ua.includes('OPR/') || ua.includes('Opera')) {
    tarayici = 'Opera';
  } else if (ua.includes('Firefox/')) {
    tarayici = 'Firefox';
  } else if (ua.includes('Chrome/')) {
    tarayici = 'Chrome';
  } else if (ua.includes('Safari/')) {
    tarayici = 'Safari';
  }

  let sistem = '';

  if (ua.includes('Android')) {
    sistem = 'Android';
    ikon = 'phone-portrait-outline';
  } else if (ua.includes('iPhone')) {
    sistem = 'iPhone';
    ikon = 'phone-portrait-outline';
  } else if (ua.includes('iPad')) {
    sistem = 'iPad';
    ikon = 'tablet-portrait-outline';
  } else if (ua.includes('Windows')) {
    sistem = 'Windows';
  } else if (ua.includes('Mac OS X')) {
    sistem = 'macOS';
  } else if (ua.includes('Linux')) {
    sistem = 'Linux';
  }

  return { tarayici, sistem, ikon };
}


export default function OturumlarimEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [oturumlar, setOturumlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [islemdekiId, setIslemdekiId] = useState(null);
  const [digerleriIslemde, setDigerleriIslemde] = useState(false);

  async function oturumlariGetir() {
    setHata('');

    try {
      // ⚠️ Mobilde kasa ASENKRON (SecureStore) — await şart.
      //    Admin panelinde localStorage senkron olduğu için await yoktu.
      //    Aynı isimli fonksiyon iki katmanda farklı davranıyor;
      //    bu yüzden kodu kopyalarken dikkat gerekiyor.
      const refresh = (await refreshTokenAl()) ?? '';

      const veri = await apiPost('/auth/oturumlarim', { refreshToken: refresh });

      setOturumlar(veri.oturumlar);
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // useFocusEffect: ekran her ODAĞA GELDİĞİNDE çalışır.
  //
  // Neden useEffect değil? Kullanıcı oturum kapatıp geri gelirse
  // (veya başka bir sekmeden bir şey değişirse) liste tazelensin.
  // useEffect sadece ilk yüklemede çalışırdı.
  useFocusEffect(
    useCallback(() => {
      oturumlariGetir();
    }, [])
  );


  // Tek oturumu kapat
  function kapatmayiOnayla(oturum) {
    const cihaz = cihazOku(oturum.cihazBilgisi);

    Alert.alert(
      'Oturumu kapat',
      `"${cihaz.tarayici}" oturumu kapatılacak. O cihaz bir sonraki ` +
      'istekte giriş ekranına düşer.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kapat',
          style: 'destructive',
          onPress: () => oturumuKapat(oturum.id),
        },
      ]
    );
  }

  async function oturumuKapat(id) {
    setIslemdekiId(id);
    setHata('');

    try {
      await apiPost('/auth/oturum-iptal/' + id, {});

      // Listeyi yeniden çekiyoruz.
      //
      // Yerelde satırı silmek de olurdu ama yeniden sormak daha güvenli:
      // aradan geçen sürede başka bir oturum açılmış veya süresi dolmuş
      // olabilir. Sunucudaki gerçek hâli gösteriyoruz.
      await oturumlariGetir();
    } catch (e) {
      setHata(e.message);
    } finally {
      setIslemdekiId(null);
    }
  }


  // Bu cihaz hariç hepsini kapat
  function digerleriniOnayla() {
    Alert.alert(
      'Diğer oturumları kapat',
      `Bu cihaz hariç ${digerSayisi} oturum kapatılacak. Diğer ` +
      'cihazlarda tekrar giriş yapman gerekecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hepsini Kapat',
          style: 'destructive',
          onPress: digerleriniKapat,
        },
      ]
    );
  }

  async function digerleriniKapat() {
    setDigerleriIslemde(true);
    setHata('');

    try {
      const refresh = (await refreshTokenAl()) ?? '';

      const veri = await apiPost('/auth/diger-oturumlari-kapat', {
        refreshToken: refresh,
      });

      await oturumlariGetir();

      Alert.alert('Tamamlandı', veri.mesaj);
    } catch (e) {
      setHata(e.message);
    } finally {
      setDigerleriIslemde(false);
    }
  }


  // Bu cihaz dışında kaç oturum var? Türetilmiş değer — ayrı state yok.
  // "Diğerlerini kapat" butonunu göstermek için kullanıyoruz;
  // tek oturumla o buton anlamsız olurdu.
  const digerSayisi = oturumlar.filter((o) => !o.buCihaz).length;


  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>Aktif Oturumlar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.icerik}>

        {/* Mobilde bu uyarı web'dekinden daha güçlü.
            Sebebi: telefon kaybı/ödünç verme/eski telefon satışı gerçek
            senaryolar. Web panelinde bu bir yönetici kolaylığı,
            mobilde gerçek bir güvenlik ihtiyacı. */}
        <View style={styles.bilgiKutu}>
          <Ionicons name="shield-checkmark" size={20} color={renkler.anaRenk} />
          <Text style={styles.bilgiYazi}>
            Hesabına giriş yapılmış cihazlar. Telefonunu kaybettiysen,
            birine ödünç verdiysen veya tanımadığın bir cihaz görüyorsan
            oturumunu kapat ve şifreni değiştir.
          </Text>
        </View>

        {hata !== '' && (
          <View style={styles.hataKutu}>
            <Ionicons name="alert-circle" size={18} color={renkler.hata} />
            <Text style={styles.hataYazi}>{hata}</Text>
          </View>
        )}

        {yukleniyor ? (
          <ActivityIndicator
            size="large"
            color={renkler.anaRenk}
            style={{ marginTop: 30 }}
          />
        ) : oturumlar.length === 0 ? (
          <Text style={styles.bosYazi}>Aktif oturum bulunamadı.</Text>
        ) : (
          <>
            <Text style={styles.sayiYazi}>
              {oturumlar.length} aktif oturum
            </Text>

            <View style={styles.liste}>
              {oturumlar.map((o) => {
                const cihaz = cihazOku(o.cihazBilgisi);

                return (
                  <View style={styles.satir} key={o.id}>
                    <View style={styles.ikonDaire}>
                      <Ionicons
                        name={cihaz.ikon}
                        size={20}
                        color={renkler.anaRenk}
                      />
                    </View>

                    <View style={styles.orta}>
                      <View style={styles.cihazSatir}>
                        <Text style={styles.cihazAd}>
                          {cihaz.tarayici}
                          {cihaz.sistem !== '' ? ' · ' + cihaz.sistem : ''}
                        </Text>

                        {o.buCihaz && (
                          <View style={styles.buCihazRozet}>
                            <Text style={styles.buCihazYazi}>Bu cihaz</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.detay}>
                        Giriş: {tarihBicimle(o.createdAt)}
                      </Text>

                      {/* Ham User-Agent — ayrıştırma yanlış çıkarsa
                          kullanıcı gerçeği görebilsin. */}
                      <Text style={styles.hamUa} numberOfLines={2}>
                        {o.cihazBilgisi || '—'}
                      </Text>
                    </View>

                    {/* ⭐ BU CİHAZ İÇİN KAPAT BUTONU YOK.
                        
                        Kendi oturumunu buradan kapatmak kafa karıştırıcı
                        olurdu: buton çalışır, sonraki istek 401 yer,
                        sessiz yenileme başarısız olur ve kullanıcı aniden
                        giriş ekranına düşer. "Ne oldu?" der.
                        
                        Bu işin adı zaten var: Çıkış Yap. Aynı işi yapan
                        iki farklı düğme koymuyoruz. */}
                    {!o.buCihaz && (
                      <TouchableOpacity
                        style={styles.kapatButon}
                        onPress={() => kapatmayiOnayla(o)}
                        disabled={islemdekiId === o.id}
                      >
                        {islemdekiId === o.id ? (
                          <ActivityIndicator size="small" color={renkler.hata} />
                        ) : (
                          <Text style={styles.kapatYazi}>Kapat</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Buton SADECE başka oturum varsa görünür — türetilmiş koşul */}
            {digerSayisi > 0 && (
              <TouchableOpacity
                style={styles.tehlikeButon}
                onPress={digerleriniOnayla}
                disabled={digerleriIslemde}
              >
                {digerleriIslemde ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.tehlikeYazi}>
                    Diğer {digerSayisi} Oturumu Kapat
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        <Text style={styles.ipucu}>
          Her cihaz veya tarayıcı ayrı bir oturum açar. Bir oturumu
          kapattığında o cihaz bir sonraki istekte giriş ekranına düşer.
        </Text>

      </ScrollView>
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
    paddingBottom: 32,
  },

  /* ---- BİLGİ KUTUSU ---- */
  bilgiKutu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: renkler.acikKart,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  bilgiYazi: {
    flex: 1,
    fontSize: 13,
    color: renkler.yaziOrta,
    lineHeight: 19,
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
    marginBottom: 16,
  },
  hataYazi: {
    flex: 1,
    fontSize: 13,
    color: renkler.hata,
    lineHeight: 18,
  },

  /* ---- LİSTE ---- */
  sayiYazi: {
    fontSize: 15,
    fontWeight: '700',
    color: renkler.yaziKoyu,
    marginBottom: 10,
  },
  liste: {
    backgroundColor: renkler.kartArka,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    paddingHorizontal: 14,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },
  ikonDaire: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  /* flex: 1 → orta blok kalan alanı doldursun.
     minWidth: 0 → uzun metin taşırmasın (flex öğelerinin varsayılan
     minWidth'i auto, bu da taşmaya yol açar) */
  orta: {
    flex: 1,
    minWidth: 0,
  },
  cihazSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cihazAd: {
    fontSize: 14,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  detay: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginTop: 3,
  },
  hamUa: {
    fontSize: 10,
    color: renkler.yaziGri,
    marginTop: 4,
    /* Platform.select: iOS ve Android'de monospace font adları farklı */
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },

  /* ---- BU CİHAZ ROZETİ ---- */
  buCihazRozet: {
    backgroundColor: renkler.basari,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 9,
  },
  buCihazYazi: {
    /* Sabit beyaz: başarı rengi hem açık hem koyu temada koyu yeşil,
       üstünde beyaz her iki temada okunuyor. */
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },

  /* ---- BUTONLAR ---- */
  kapatButon: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: renkler.hata,
    minWidth: 62,
    alignItems: 'center',
  },
  kapatYazi: {
    fontSize: 13,
    fontWeight: '600',
    color: renkler.hata,
  },
  tehlikeButon: {
    backgroundColor: renkler.hata,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 18,
  },
  tehlikeYazi: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  /* ---- DİĞER ---- */
  bosYazi: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 15,
    color: renkler.yaziGri,
  },
  ipucu: {
    fontSize: 12,
    color: renkler.yaziGri,
    lineHeight: 18,
    marginTop: 18,
    textAlign: 'center',
  },
});