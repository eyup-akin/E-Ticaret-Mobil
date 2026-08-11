import React, { useState, useCallback } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiPost } from '../services/api';
import { refreshTokenAl } from '../services/tokenStorage';
import { tarihBicimle } from '../utils/bicimlendir';
import { useTema } from '../context/TemaContext';
import OnayPenceresi from '../components/OnayPenceresi';


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

  // ⭐ YENİ (GV/Faz 7.10) — onay penceresi durumları.
  //
  // ⚠️ Alert.alert yerine OnayPenceresi: sistem penceresi koyu temada
  // bile beyaz açılıyor ve Android'de butonları büyük harfe çeviriyor.
  // Sepet, adres ve kart ekranlarında aynı değişiklik yapılmıştı;
  // uygulamada tek bir onay dili olsun.
  //
  // İki ayrı state çünkü iki farklı soru: biri TEK oturumu (hangisi
  // olduğunu bilmesi gerek), diğeri hepsini kapatıyor. Tek state'e
  // sıkıştırsaydık pencerenin hangi metni göstereceğini ayrıca
  // hesaplamak gerekirdi.
  const [kapatilacak, setKapatilacak] = useState(null);
  const [digerleriSorusu, setDigerleriSorusu] = useState(false);

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



  async function digerleriniKapat() {
    setDigerleriIslemde(true);
    setHata('');

    try {
      const refresh = (await refreshTokenAl()) ?? '';

      await apiPost('/auth/diger-oturumlari-kapat', {
        refreshToken: refresh,
      });

      // ⭐ DEĞİŞTİ (GV/Faz 7.10) — bitince Alert AÇILMIYOR.
      //
      // ⚠️ Eskiden sunucunun mesajı bir Alert ile gösteriliyordu:
      // kullanıcı onay penceresini kapatıyor, hemen ardından ikinci
      // bir pencere açılıyordu. Sonucu zaten LİSTE söylüyor —
      // kapatılan oturumlar gitmiş oluyor. İşin sonucunu ekranın
      // kendisi anlatıyorsa üstüne bir de pencere koymuyoruz.
      await oturumlariGetir();
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
                        onPress={() => setKapatilacak(o)}
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
                onPress={() => setDigerleriSorusu(true)}
                disabled={digerleriIslemde}
              >
                {digerleriIslemde ? (
                  <ActivityIndicator color={renkler.hata} />
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

      {/* ⚠️ İki pencere ayrı ayrı duruyor, tek bir "genel onay"
          bileşenine sıkıştırılmadı: metinleri, ikonları ve
          sonuçları farklı. Ortaklaştırsaydık pencerenin hangi işi
          yaptığını bir bayrakla seçmek gerekirdi ve yanlış bayrak
          yanlış oturumu kapatırdı. */}
      <OnayPenceresi
        acik={kapatilacak !== null}
        ikon="log-out-outline"
        yikici
        baslik="Oturum kapatılsın mı?"
        mesaj={
          kapatilacak
            ? `"${cihazOku(kapatilacak.cihazBilgisi).tarayici}" oturumu kapatılacak. O cihaz bir sonraki istekte giriş ekranına düşer.`
            : ''
        }
        onayYazisi="Kapat"
        onVazgec={() => setKapatilacak(null)}
        onOnayla={() => {
          const oturum = kapatilacak;
          setKapatilacak(null);
          if (oturum) oturumuKapat(oturum.id);
        }}
      />

      <OnayPenceresi
        acik={digerleriSorusu}
        ikon="log-out-outline"
        yikici
        baslik="Diğer oturumlar kapatılsın mı?"
        mesaj={`Bu cihaz hariç ${digerSayisi} oturum kapatılacak. Diğer cihazlarda tekrar giriş yapman gerekecek.`}
        onayYazisi="Hepsini Kapat"
        onVazgec={() => setDigerleriSorusu(false)}
        onOnayla={() => {
          setDigerleriSorusu(false);
          digerleriniKapat();
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
    paddingBottom: bosluk.dev,
  },


  /* ---- BİLGİ KUTUSU ---- */

  bilgiKutu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.kucuk,
    backgroundColor: renkler.acikKart,
    borderRadius: kose.orta,
    padding: bosluk.normal,
    marginBottom: bosluk.normal,
  },

  bilgiYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    color: renkler.yaziOrta,
    lineHeight: satir.kucuk,
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
    marginBottom: bosluk.normal,
  },

  hataYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    color: renkler.hata,
    lineHeight: satir.kucuk,
  },


  /* ---- LİSTE ---- */

  sayiYazi: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziGri,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: bosluk.kucuk,
  },

  liste: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    paddingHorizontal: bosluk.normal,
  },

  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    paddingVertical: bosluk.normal,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },

  /* ⚠️ İkon dairesi acikKart zeminli, turuncu değil: bu bir cihaz
     göstergesi, bir eylem değil. Faz 1'de düzeltilen dekoratif ana
     renk hatasının aynısı olurdu. */
  ikonDaire: {
    width: 40,
    height: 40,
    borderRadius: kose.tam,
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
    gap: bosluk.kucuk,
    flexWrap: 'wrap',
  },

  cihazAd: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  detay: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 3,
  },

  hamUa: {
    fontSize: yazi.mikro,
    color: renkler.yaziGri,
    marginTop: bosluk.mikro,
    /* Platform.select: iOS ve Android'de monospace font adları farklı */
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },


  /* ---- BU CİHAZ ROZETİ ---- */

  buCihazRozet: {
    backgroundColor: renkler.yumusakBasari,
    borderRadius: kose.tam,
    paddingVertical: 2,
    paddingHorizontal: bosluk.kucuk,
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 7.10) — dolu yeşil + beyaz yazı yerine yumuşak
     zemin + yeşil yazı.

     ⚠️ Dolu yeşil rozet listede en parlak öğeydi ve gözü "bu cihaz"
     etiketine çekiyordu; oysa müşterinin araması gereken şey
     TANIMADIĞI cihazlar. Vurgu yanlış yerdeydi. Ayrıca elle yazılmış
     '#ffffff' de böylece kalktı. */
  buCihazYazi: {
    color: renkler.basari,
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },


  /* ---- BUTONLAR ---- */

  kapatButon: {
    paddingVertical: bosluk.kucuk,
    paddingHorizontal: bosluk.orta,
    borderRadius: kose.kucuk,
    borderWidth: 1,
    borderColor: renkler.hata,
    minWidth: 62,
    alignItems: 'center',
  },

  kapatYazi: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.hata,
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 7.10) — dolu kırmızıdan çerçeveli kırmızıya.

     ⚠️ Dolu kırmızı bu uygulamada "yıkıcı ve geri alınamaz" demek
     (hesap kapatma). Diğer oturumları kapatmak geri alınabilir: o
     cihazlarda tekrar giriş yapılır. Hesabım ekranındaki "Çıkış Yap"
     ile aynı ağırlıkta olmalı ve orası da çerçeveli. */
  tehlikeButon: {
    borderWidth: 1.5,
    borderColor: renkler.hata,
    paddingVertical: bosluk.orta,
    borderRadius: kose.orta,
    alignItems: 'center',
    marginTop: bosluk.normal,
  },

  tehlikeYazi: {
    color: renkler.hata,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },


  /* ---- DİĞER ---- */

  bosYazi: {
    textAlign: 'center',
    marginTop: bosluk.dev,
    fontSize: yazi.normal,
    color: renkler.yaziGri,
  },

  ipucu: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    lineHeight: satir.kucuk,
    marginTop: bosluk.normal,
    textAlign: 'center',
  },
});
