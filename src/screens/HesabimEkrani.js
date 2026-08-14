import React, { useState, useEffect, useCallback } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiGet, apiPost } from '../services/api';
import { SUNUCU_URL } from '../services/config';   // ⭐ YENİ — profil fotoğrafının tam adresi
import * as ImagePicker from 'expo-image-picker';   // ⭐ YENİ
import { refreshTokenAl } from '../services/tokenStorage';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import GirisGerekliEkrani from '../components/GirisGerekliEkrani';   // ⭐ misafir kapısı
import OnayPenceresi from '../components/OnayPenceresi';   // ⭐ YENİ (2026-08-12)

export default function HesabimEkrani({ navigation }) {
  const { token, kullanici, cikisYap, profilFotoYukle, profilFotoSil } = useAuth();
  const { renkler, koyuMu, temaDegistir } = useTema();

  // Misafir görünümündeki yüzen tema düğmesi için — açıklaması aşağıda.
  const insets = useSafeAreaInsets();
  const styles = stilOlustur(renkler);

  /* ⚠️ Profil artık EKRANDA GÖSTERİLMİYOR ama hâlâ çekiliyor:
     "Profili Düzenle" ekranı e-postayı kilitli göstermek için biliyor
     olmalı ve onu buradan parametre olarak alıyor. Orada ayrıca
     /auth/ben-kimim çağırmak gereksiz bir ağ turu olurdu. */
  const [profil, setProfil] = useState(null);

  // Aktif oturum sayısı.
  //
  // null = henüz bilinmiyor / alınamadı.
  //
  // Neden 0 ile başlatmıyoruz? Çünkü 0 geçerli bir cevap ("hiç oturum
  // yok") ama bizim durumumuz "henüz sormadım". İkisini karıştırırsak
  // veri gelmeden ekranda "0" yazar ve kullanıcı yanlış bilgi görür.
  const [oturumSayisi, setOturumSayisi] = useState(null);

  // ⭐ YENİ (2026-08-12) — çıkış onayı.
  //
  // ⚠️ Onay ŞART: çıkış tek dokunuşla oluyordu ve yanlışlıkla
  // basıldığında kullanıcı e-postasını ve şifresini yeniden yazmak
  // zorunda kalıyordu. Geri alınabilir bir işlem, ama geri almanın
  // bedeli yüksek.
  //
  // ⚠️ Alert.alert DEĞİL, OnayPenceresi: sistem penceresi koyu temada
  // beyaz açılıyor ve markanın rengi yerine sistemin mavisini
  // kullanıyor (gerekçenin tamamı bileşenin başında).
  const [cikisSorusu, setCikisSorusu] = useState(false);

  // ⭐ YENİ — profil fotoğrafı akışı.
  const [fotoYukleniyor, setFotoYukleniyor] = useState(false);
  const [fotoSilSorusu, setFotoSilSorusu] = useState(false);
  const [fotoHatasi, setFotoHatasi] = useState('');

  /* Galeriden fotoğraf seç ve yükle.
   *
   * ⚠️ İZİN İSTENİYOR ama reddedilirse UYGULAMA ÇALIŞMAYA DEVAM
   * EDİYOR: profil fotoğrafı isteğe bağlı bir süs. İzin yoksa
   * kısa bir açıklama gösterip bırakıyoruz.
   *
   * ⚠️ `allowsEditing` + 1:1 oran: avatar yuvarlak ve kare olmayan
   * bir fotoğraf `cover` ile kırpılır — kullanıcı neyin kırpıldığını
   * göremez. Kırpmayı ONA yaptırmak, sürprizi ortadan kaldırıyor.
   *
   * ⚠️ `quality: 0.7` — telefon kamerası 4-8 MB üretiyor ve sunucu
   * sınırı 5 MB. Sıkıştırmadan göndersek fotoğrafların bir kısmı
   * "Dosya en fazla 5 MB olabilir!" ile reddedilirdi; avatar 72dp
   * çizildiği için kayıp gözle görülmüyor.
   */
  async function fotografSec() {
    setFotoHatasi('');

    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!izin.granted) {
      setFotoHatasi('Fotoğraf seçebilmek için galeri izni gerekiyor.');
      return;
    }

    const sonuc = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (sonuc.canceled) return;

    const secilen = sonuc.assets?.[0];
    if (!secilen) return;

    // ⚠️ Ad ve tip ELLE kuruluyor. Galeriden gelen varlıkta
    // `fileName` bazen null (özellikle Android'de kameradan gelen
    // dosyalarda) ve `mimeType` her sürümde dolu değil. Sunucu
    // ikisini de zorunlu tutuyor; boş gönderirsek dosya
    // "seçilmedi" ya da "geçersiz tip" diye reddedilir.
    const uzanti = (secilen.uri.split('.').pop() || 'jpg').toLowerCase();
    const tip = secilen.mimeType || (uzanti === 'png' ? 'image/png' : 'image/jpeg');

    try {
      setFotoYukleniyor(true);

      await profilFotoYukle({
        uri: secilen.uri,
        name: secilen.fileName || `profil.${uzanti}`,
        type: tip,
      });
    } catch (hata) {
      setFotoHatasi(hata.message);
    } finally {
      setFotoYukleniyor(false);
    }
  }

  async function fotografiKaldir() {
    setFotoSilSorusu(false);
    setFotoHatasi('');

    try {
      setFotoYukleniyor(true);
      await profilFotoSil();
    } catch (hata) {
      setFotoHatasi(hata.message);
    } finally {
      setFotoYukleniyor(false);
    }
  }

  // Giriş varsa profili çek, çıkışta temizle
  useEffect(() => {
    async function profiliGetir() {
      if (!token) {
        setProfil(null);
        return;
      }
      try {
        const veri = await apiGet('/auth/ben-kimim');
        setProfil(veri);
      } catch (hata) {
        console.log('Profil alınamadı:', hata.message);
      }
    }
    profiliGetir();
  }, [token]);

  // OTURUM SAYISINI ÇEK
  //
  // Neden useFocusEffect, useEffect değil?
  //   Kullanıcı Oturumlarım ekranına girip bir oturum kapatıp geri
  //   dönebilir. useEffect sadece token değişince çalışırdı ve sayaç
  //   bayat kalırdı. useFocusEffect ekran her odağa geldiğinde çalışır.
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setOturumSayisi(null);
        return;
      }

      // ⚠️ İPTAL BAYRAĞI
      //
      // Kullanıcı ekrana girip hemen çıkarsa istek hâlâ yolda olabilir.
      // Cevap gelince setOturumSayisi çağrılır ama ekran artık odakta
      // değil — boşa iş.
      let iptalEdildi = false;

      async function sayiyiGetir() {
        try {
          // Mobilde kasa ASENKRON (SecureStore) — await şart
          const refresh = (await refreshTokenAl()) ?? '';

          const veri = await apiPost('/auth/oturumlarim', {
            refreshToken: refresh,
          });

          if (!iptalEdildi) {
            setOturumSayisi(veri.toplam);
          }
        } catch {
          // Sessizce yut. Bu bir SAYAÇ — alınamazsa ekran yine
          // çalışmalı. Asıl hata yönetimi Oturumlarım ekranında.
          if (!iptalEdildi) {
            setOturumSayisi(null);
          }
        }
      }

      sayiyiGetir();

      return () => {
        iptalEdildi = true;
      };
    }, [token])
  );

  /* MENÜ SATIRI
   *
   * ⭐ DEĞİŞTİ (2026-08-12) — HER SATIR YİNE KENDİ KARTI.
   * 7.1'de "tek kart + ince ayraç" denenmişti (sepet satırlarıyla
   * aynı dil olsun diye); cihazda görülünce ayrı kartların daha
   * ferah durduğu söylendi ve geri dönüldü. Sepet hâlâ tek kart:
   * orada satırlar BİR SİPARİŞİN parçaları, burada birbirinden
   * bağımsız hedefler.
   *
   * ⚠️ İkon yuvarlak köşeli bir karenin içinde.
   *
   * ⭐ DEĞİŞTİ (2026-08-12): kare ve ikon TURUNCUYA döndü. 7.1'de
   * "turuncu değil" denmişti — gerekçe sekiz PARLAK turuncu ikonun
   * "turuncu = eylem" kuralını görünmez yapmasıydı. Şimdiki hâl o
   * değil: zemin %12'lik ton, ikon `anaRenkKoyu`. Ekranda dolu
   * turuncu buton zaten yok, çakışacak bir şey de yok.
   *
   * Satırın tıklanabilir olduğunu hâlâ sağdaki chevron söylüyor.
   *
   * @param rozet  sağda gösterilecek sayaç (yalnızca oturumlarda var)
   */
  function menuSatiri({ ikon, baslik, hedef, parametre, rozet }) {
    return (
      <TouchableOpacity
        key={baslik}
        style={styles.menuSatir}
        onPress={() => navigation.navigate(hedef, parametre)}
        activeOpacity={0.7}
      >
        <View style={styles.menuIkon}>
          {/* ⚠️ `anaRenkKoyu`, `anaRenk` değil: parlak turuncu bu
              boyutta cırtlak çıkıyor ve butonlarla aynı tonu
              paylaşırdı. Koyu ton hem sakin hem de açık zeminde
              daha okunur. */}
          <Ionicons name={ikon} size={18} color={renkler.anaRenkKoyu} />
        </View>

        <Text style={styles.menuYazi}>{baslik}</Text>

        {rozet !== undefined && (
          /* Sayı henüz gelmediyse "···". Boş bırakmak "hiç oturum yok"
             gibi okunurdu; 0 yazmak düpedüz yanlış bilgi olurdu. */
          <View style={styles.sayacRozet}>
            <Text style={styles.sayacYazi}>{rozet === null ? '···' : rozet}</Text>
          </View>
        )}

        <Ionicons name="chevron-forward" size={18} color={renkler.yaziGri} />
      </TouchableOpacity>
    );
  }

  /* Grup = turuncu başlık hapı + altında ayrı ayrı satır kartları. */
  function menuGrubu(baslik, satirlar) {
    return (
      <View style={styles.grup}>
        <View style={styles.grupBaslikSerit}>
          <Text style={styles.grupBaslik}>{baslik}</Text>
        </View>

        {satirlar.map((s) => menuSatiri(s))}
      </View>
    );
  }

  /* ⭐ DEĞİŞTİ (2026-08-12) — MİSAFİR GÖRÜNÜMÜ ARTIK ORTAK BİLEŞEN.
   *
   * Eskiden burada kendi kartı vardı: beyaz kutu, içinde daire,
   * başlık, iki buton. Sepetim ve Favorilerim aynı durumu
   * `GirisGerekliEkrani` ile çiziyordu — yani misafir kullanıcı üç
   * sekmede üç farklı "giriş yap" ekranı görüyordu.
   *
   * ⚠️ BAŞLIK DA KALKTI. Sepetim'de misafirken "Sepetim" yazmıyor;
   * ekran zaten bir kapı, içeriğin adını söylemenin bir anlamı yok.
   * Sekme çubuğu hangi sekmede olduğunu zaten gösteriyor.
   *
   * ⚠️ BEYAZ KUTU DA KALKTI: içerik sayfanın kendi zemininde ve
   * DİKEY ORTALI (bileşenin kendi yerleşimi). Kutu, ortada duran bir
   * içeriği yukarı itip ekranın altını boş bırakıyordu.
   *
   * ⚠️ TEMA DÜĞMESİ KALIYOR — yüzen hâlde, sağ üstte. Başlıkla
   * birlikte kaldırsaydık misafir kullanıcı temayı hiçbir yerden
   * değiştiremezdi; tema tercihinin evi bu ekran. */
  if (!token) {
    return (
      /* ⚠️⚠️ BURADA `SafeAreaView` YOK — BİLEREK.
       *
       * Sepetim ve Favorilerim misafir kapısını doğrudan döndürüyor;
       * Hesabım'ı SafeAreaView ile sarınca üstten güvenli alan kadar
       * (cihazda ~24-40dp) DAHA aşağı kayıyordu. Üç sekme arasında
       * geçerken daire ve yazılar birkaç piksel oynuyordu — kullanıcı
       * fark etti. Kapı üç ekranda da aynı yerde durmalı.
       *
       * ⚠️ Güvenli alanı bu ekranda YALNIZCA tema düğmesi umursuyor
       * (aşağıda `insets.top` ile). İçerik dikey ortalı olduğu için
       * durum çubuğunun altına girmesi zaten mümkün değil. */
      <View style={styles.kapsayici}>
        <TouchableOpacity
          style={[
            styles.temaButon,
            styles.temaButonYuzen,
            /* ⚠️ MUTLAK KONUMLU ÇOCUK GÜVENLİ ALANI GÖRMEZ.
               SafeAreaView'in dolgusu yalnızca AKIŞTAKİ çocukları
               iter; `position: absolute` olan bu düğme kutunun en
               üstünden ölçülüyordu ve durum çubuğunun altında
               kalıyordu (cihazda görüldü). Inset'i elle ekliyoruz. */
            { top: insets.top + bosluk.kucuk },
          ]}
          onPress={() => temaDegistir(koyuMu ? 'acik' : 'koyu')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={koyuMu ? 'Açık temaya geç' : 'Koyu temaya geç'}
        >
          <Ionicons
            name={koyuMu ? 'sunny-outline' : 'moon-outline'}
            size={20}
            color={renkler.yaziKoyu}
          />
        </TouchableOpacity>

        {/* ⚠️ B12 — "Sana özel" öneri bölümü burada ÇİZİLMİYOR.
            Misafirin gezme geçmişi cihazda var ama bu ekran bir
            kapı; önerileri ana sayfada gösteriyoruz. */}
        <GirisGerekliEkrani
          ikon="person-outline"
          baslik="Hesabına giriş yap"
          aciklama="Siparişlerini takip etmek, favorilerini ve adreslerini yönetmek için giriş yapman gerekiyor."
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <ScrollView contentContainerStyle={styles.icerik}>
        {/* ⭐ DEĞİŞTİ — TEMA SEÇİCİ BAŞLIK SATIRINA, TEK BUTONA İNDİ.

            Aşağıda "GÖRÜNÜM" başlıklı bir kartın içinde iki sekme
            (Açık / Koyu) vardı. İki sekme, iki durumlu bir tercih için
            gereğinden fazla: seçenekler birbirinin değili, listelenmeye
            değmiyor. Tek düğme hem durumu gösteriyor hem de tek
            dokunuşta çeviriyor.

            ⚠️ İKON GİDİLECEK YERİ SÖYLÜYOR, BULUNULAN YERİ DEĞİL.
            Açık temada AY ("karanlığa geç"), koyu temada GÜNEŞ
            ("aydınlığa dön"). Tersi de savunulabilir bir dil ama
            ikisi bir arada olamaz; düğme bir eylem düğmesi olduğu için
            eylemi gösteriyor. accessibilityLabel de aynı şeyi söylüyor,
            böylece ekran okuyucu kullanan için belirsizlik kalmıyor.

            ⚠️ Düğmenin kendisi nötr kalıyor (kart zemini + gri
            kenarlık): menü ikonları turuncuya döndü ama bu bir
            ikon değil, basılabilir bir kontrol. Turuncuya boyasaydık
            ekranın sağ üstündeki en parlak öğe, en az kullanılan
            düğme olurdu. */}
        <View style={styles.baslikSatir}>
          <Text style={styles.baslik}>Hesabım</Text>

          {/* ⭐ DEĞİŞTİ (2026-08-12) — ÇIKIŞ SAYFANIN DİBİNDEN
              SOL ÜSTE TAŞINDI.
              Eskiden en altta, hesap kapatma bağlantısının hemen
              üstünde çerçeveli bir butondu. İki sorun vardı: en sık
              kullanılan eylemlerden biri için sayfanın sonuna kadar
              kaydırmak gerekiyordu ve "çıkış" ile "hesabı kapat" yan
              yana durunca ikisi aynı ağırlıkta okunuyordu — oysa biri
              geri alınabilir, diğeri değil.

              ⚠️ Tema düğmesiyle SİMETRİK: ikisi de mutlak konumda,
              ikisi de başlık satırının kenarında. Akışa koysaydık
              ortalı başlık düğme genişliği kadar kayardı.

              ⚠️ İkon + yazı, sadece ikon DEĞİL: bir kapı ikonu tek
              başına "çıkış mı, giriş mi?" belirsizliği taşıyor. */}
          {/* ⭐ DEĞİŞTİ — TEMA SOLA, ÇIKIŞ SAĞA GEÇTİ.
              ⚠️ JSX sırası da değişti, sadece stil değil: ikisi de
              mutlak konumda olduğu için görünüm stilden geliyor ama
              ekran okuyucu JSX sırasını okuyor. Sırayı bırakıp
              yalnızca stili değiştirseydik, ekranda solda duran
              düğme ekran okuyucuda ikinci sırada okunurdu. */}
          <TouchableOpacity
            style={styles.temaButon}
            onPress={() => temaDegistir(koyuMu ? 'acik' : 'koyu')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={koyuMu ? 'Açık temaya geç' : 'Koyu temaya geç'}
          >
            <Ionicons
              name={koyuMu ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={renkler.yaziKoyu}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cikisButon}
            onPress={() => setCikisSorusu(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Çıkış yap"
          >
            <Ionicons name="exit-outline" size={18} color={renkler.hata} />
            <Text style={styles.cikisYazi}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        {/* ============ ÜYE GÖRÜNÜMÜ ============ */}
        {/* ⭐ DEĞİŞTİ (2026-08-12) — KİMLİK KARTI KALDIRILDI,
                YERİNE ORTALI BİR SELAMLAMA GELDİ.

                Eskiden beyaz bir kartın içinde avatar + ad + e-posta +
                üyelik tarihi vardı ve sağında bir chevron. Üç bilgiden
                ikisi müşteriye bir şey söylemiyordu: **kendi
                e-postasını ve ne zaman üye olduğunu zaten biliyor.**
                Ekranın en üstündeki en büyük kutu, en az işe yarayan
                bilgiyi taşıyordu — "Rol: musteri" satırını 7.1'de
                eleyen gerekçenin aynısı.

                Kalan: baş harf ve "Merhaba, [ad]". Biri kimin hesabı
                olduğunu doğruluyor, diğeri selam veriyor.

                ⚠️ KART DA GİTTİ, sadece içeriği değil. Beyaz kart
                sayfanın kırık-beyaz zemininde yüzen bir kutuydu ve
                altındaki menü kartlarıyla aynı ağırlıkta görünüyordu;
                oysa bu bir menü değil, ekranın başlığı.

                ⚠️ Kartın "Profili Düzenle"ye götüren dokunuşu
                kaldırıldı ama işlev KAYBOLMADI: GÜVENLİK grubunda
                aynı ada sahip bir satır zaten var. İki giriş noktası
                bırakmak, aynı işi yapan iki kontrol demekti.

                ⚠️ Avatar zemini `lacivertYuzey` — yorum kartındaki
                avatarla AYNI token. Turuncu yapılmadı: dekoratif ana
                renk Faz 1'de düzeltilen hatanın ta kendisi.

                ⚠️ Harf toLocaleUpperCase('tr-TR') ile büyütülüyor —
                "irem" → "İREM"; varsayılan büyütme "IREM" yapardı. */}
            <View style={styles.kimlik}>
              {/* ⭐ YENİ — AVATAR ARTIK BASILABİLİR: fotoğraf seçtiriyor.
                  ⚠️ Ayrı bir "fotoğraf ekle" butonu KOYULMADI. Dokunma
                  hedefi zaten avatarın kendisi ve sağ altındaki kalem
                  rozeti basılabilir olduğunu söylüyor; ikinci bir
                  buton, aynı işi yapan iki kontrol olurdu. */}
              <TouchableOpacity
                style={styles.avatarKap}
                onPress={fotografSec}
                disabled={fotoYukleniyor}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={
                  kullanici?.profilFotoUrl
                    ? 'Profil fotoğrafını değiştir'
                    : 'Profil fotoğrafı ekle'
                }
              >
                <View style={styles.avatar}>
                  {fotoYukleniyor ? (
                    <ActivityIndicator color={renkler.lacivertYuzeyUstuYazi} />
                  ) : kullanici?.profilFotoUrl ? (
                    /* ⚠️ Adres SUNUCU_URL ile birleştiriliyor: sunucu
                       göreli yol ("/uploads/profil/a3f9.jpg")
                       döndürüyor, Image ise tam adres istiyor. */
                    <Image
                      source={{ uri: SUNUCU_URL + kullanici.profilFotoUrl }}
                      style={styles.avatarFoto}
                    />
                  ) : (
                    <Text style={styles.avatarHarf}>
                      {(kullanici?.fullName || '?').trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'}
                    </Text>
                  )}
                </View>

                {!fotoYukleniyor && (
                  <View style={styles.avatarRozet}>
                    <Ionicons
                      name={kullanici?.profilFotoUrl ? 'pencil' : 'camera'}
                      size={13}
                      color={renkler.anaRenkUstuYazi}
                    />
                  </View>
                )}
              </TouchableOpacity>

              {/* ⚠️ Kaldırma bağlantısı YALNIZCA fotoğraf varken.
                  Olmayan bir şeyi kaldırmayı teklif etmek, ekranda
                  hiçbir zaman işe yaramayan bir kontrol bırakırdı. */}
              {kullanici?.profilFotoUrl && !fotoYukleniyor && (
                <TouchableOpacity
                  onPress={() => setFotoSilSorusu(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text style={styles.fotoKaldir}>Fotoğrafı kaldır</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.merhaba} numberOfLines={1}>
                Merhaba, {(kullanici?.fullName || '').trim().split(' ')[0] || 'hoş geldin'}
              </Text>

              {/* ⚠️ Hata BURADA, pencerede değil: fotoğraf yükleme
                  kullanıcının başlattığı küçük bir iş. Modal açmak,
                  "izin vermedin" gibi hafif bir durum için ekranı
                  kilitlemek olurdu. */}
              {fotoHatasi !== '' && (
                <Text style={styles.fotoHata}>{fotoHatasi}</Text>
              )}
            </View>

            {/* ⚠️ G1 — 5. SEKME YOK. Tasarım bazı ekranlarda
                "Kategoriler" diye beşinci bir sekme çiziyor; bizde
                kategoriler ana sayfadaki şeridin "Tümü" karosundan
                açılıyor. Buradaki menü o kararı değiştirmiyor. */}
            {menuGrubu('HESABIM', [
              { ikon: 'receipt-outline', baslik: 'Siparişlerim', hedef: 'Siparislerim' },

              /* ⚠️ Rota adı 'Favoriler', ekranda görünen başlık
                 'Favorilerim'. Gezinme BAŞLIKLA değil ROTA ADIYLA
                 yapılır — bu bir kez karıştırıldı ve "Şimdi Al" butonu
                 çökmüştü ('Sepetim' yazılmıştı, doğrusu 'Sepet').

                 Favoriler alt sekmede zaten var; buraya da koyuyoruz
                 çünkü kullanıcı "hesabımla ilgili her şey" ararken
                 buraya bakıyor. İki giriş noktası tekrar değil, farklı
                 iki arama yolunun aynı yere çıkması. */
              { ikon: 'heart-outline', baslik: 'Favorilerim', hedef: 'Favoriler' },

              { ikon: 'location-outline', baslik: 'Adreslerim', hedef: 'Adreslerim' },

              /* ⭐ YENİ (4.9) — Numaralarım.
                 ⚠️ Adreslerim'in HEMEN ALTINDA, bilinçli: adres formu
                 buradaki numaralardan birini seçtiriyor, ikisi aynı
                 işin iki parçası. GÜVENLİK grubuna koymadık — telefon
                 bugün bir iletişim bilgisi; SMS doğrulaması gelince
                 (Faz 2) o zaman bir kimlik aracına dönüşecek ve grubu
                 yeniden düşünmek gerekecek. */
              { ikon: 'call-outline', baslik: 'Numaralarım', hedef: 'Numaralarim' },

              { ikon: 'card-outline', baslik: 'Kartlarım', hedef: 'Kartlarim' },
              { ikon: 'wallet-outline', baslik: 'Ödemelerim', hedef: 'Odemelerim' },

              /* ⭐ YENİ (Aşama 8.4) — Destek.
                 ⚠️ HESABIM grubunda, ayrı bir "YARDIM" grubu
                 açılmadı: tek satırlık bir grup başlığı, ayırdığı
                 şeyden uzun olurdu. Referans tasarımdaki "Get Help /
                 FAQ" ikilisinden yalnızca biri var; SSS diye bir
                 içerik yok ve olmayan bir sayfaya bağlantı koymak
                 (B8'de yardım ikonunda verilen karar) yapılmıyor. */
              // ⭐ YENİ (Aşama 9.4) — Siparişlerim'in yanında: ikisi de
              // sipariş geçmişine dair.
              { ikon: 'arrow-undo-outline', baslik: 'İadelerim', hedef: 'Iadelerim' },

              { ikon: 'chatbubbles-outline', baslik: 'Destek', hedef: 'Destek' },
            ])}

            {/* ⚠️ "GÜVENLİK" başlığı, eski "Hesap Ayarları"nın yerine.
                Bu üç satırın ortak paydası hesap değil GÜVENLİK: kimlik
                bilgisi, şifre ve oturumlar. "Ayarlar" adı, tema seçici
                gibi zararsız tercihlerle aynı kefeye koyuyordu. */}
            {menuGrubu('GÜVENLİK', [
              {
                ikon: 'person-outline',
                baslik: 'Profili Düzenle',
                hedef: 'ProfilDuzenle',
                /* Profil ekranı e-postayı KİLİTLİ göstermek için biliyor
                   olmalı; parametre olarak geçiyoruz. Orada ayrıca
                   /auth/ben-kimim çağırmak gereksiz bir ağ turu olurdu. */
                parametre: { eposta: profil?.email },
              },
              { ikon: 'lock-closed-outline', baslik: 'Şifre Değiştir', hedef: 'SifreDegistir' },
              {
                ikon: 'desktop-outline',
                baslik: 'Aktif Oturumlar',
                hedef: 'Oturumlarim',
                rozet: oturumSayisi,
              },

              /* ⭐ YENİ (Aşama 10) — KVKK veri erişim hakkı.
                 GÜVENLİK grubunda: şifre doğrulaması istiyor ve
                 hesabın tamamına dair bir işlem. */
              {
                ikon: 'download-outline',
                baslik: 'Verilerimi İndir',
                hedef: 'VerilerimiIndir',
              },
            ])}

        {/* ⚠️ "GÖRÜNÜM" KARTI KALDIRILDI — tema artık başlıktaki tek
            düğmede. İkisi birden dursaydı aynı state'i çeviren iki
            kontrol olurdu; ürün detayındaki "Adet" satırı (5.5) ve
            açıklama katlama bağlantısı (5.6) aynı gerekçeyle
            elenmişti. */}

        {/* ⚠️ ÇIKIŞ BUTONU BURADAN KALKTI → başlık satırının sol üstü.
            Gerekçe orada yazılı. */}

        {/* ⭐ TEHLİKELİ BÖLGE

            · En ALTTA duruyor — kullanıcı buraya kazara gelmez
            · Büyük buton DEĞİL, ince bir metin bağlantısı
            · Üstünde ayırıcı çizgi var — "burası farklı bir bölge"
            · Altında ne olacağı yazıyor — tıklamadan önce bilsin

            Yıkıcı işlemleri kolay erişilir yapmak kötü tasarımdır.
            Zor bulunur ama BULUNABİLİR olmalı — gizlemek de yanlış. */}
        <View style={styles.tehlikeAyirac} />

        <TouchableOpacity
          style={styles.tehlikeSatir}
          onPress={() => navigation.navigate('HesapKapat')}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={renkler.hata} />
          <Text style={styles.tehlikeYazi}>Hesabımı Kapat</Text>
        </TouchableOpacity>

        <Text style={styles.tehlikeAciklama}>
          Kişisel bilgilerin silinir, geçmiş siparişlerin muhasebe
          kaydı olarak saklanır. Bu işlem geri alınamaz.
        </Text>
      </ScrollView>

      {/* ⭐ YENİ (2026-08-12) — ÇIKIŞ ONAYI
          ⚠️ `yikici` VERİLMEDİ (turuncu onay butonu). Kırmızı dolu
          buton bu uygulamada "geri alınamaz" demek — hesap kapatmaya
          ait. Çıkış geri alınabilir: tekrar giriş yapılır.
          ⚠️ Mesaj neyin KORUNDUĞUNU söylüyor. Asıl korku "sepetim
          gider mi?" ve cevabı hayır: sepet sunucuda, tema tercihi
          cihazda. Sormadan tahmin ettirmek yerine yazıyoruz. */}
      <OnayPenceresi
        acik={cikisSorusu}
        ikon="exit-outline"
        baslik="Çıkış Yap"
        mesaj="Oturumun kapatılacak. Sepetin ve ayarların korunacak. Çıkış yapmak istediğine emin misin?"
        onayYazisi="Evet, Çıkış Yap"
        vazgecYazisi="İptal"
        onVazgec={() => setCikisSorusu(false)}
        onOnayla={() => {
          setCikisSorusu(false);
          cikisYap();
        }}
      />

      {/* ⭐ YENİ — fotoğraf kaldırma onayı.
          ⚠️ Onay soruluyor çünkü geri alınamaz: dosya sunucudan da
          siliniyor, "vazgeçtim" diyen kullanıcı fotoğrafı yeniden
          seçmek zorunda. */}
      <OnayPenceresi
        acik={fotoSilSorusu}
        ikon="trash-outline"
        baslik="Fotoğrafı kaldır"
        mesaj="Profil fotoğrafın silinecek ve yerine adının baş harfi gelecek."
        onayYazisi="Evet, Kaldır"
        vazgecYazisi="Vazgeç"
        onVazgec={() => setFotoSilSorusu(false)}
        onOnayla={fotografiKaldir}
      />
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },

  icerik: {
    padding: sayfaKenari,
    paddingBottom: bosluk.dev,
  },

  /* ⭐ DEĞİŞTİ (2026-08-12) — BAŞLIK ORTALI.
     Sepetim ve Favorilerim ile aynı hizada dursun diye: üç sekme kökü
     üç farklı başlık yerleşimi kullanıyordu.

     ⚠️ Tema düğmesi MUTLAK KONUMDA. Akışta kalsaydı başlığı sola
     iter ve "ortalı" başlık aslında düğmenin genişliği kadar kaymış
     olurdu. */
  baslikSatir: {
    justifyContent: 'center',
    minHeight: 40,
    marginBottom: bosluk.normal,
  },

  baslik: {
    fontSize: yazi.baslik,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    textAlign: 'center',
  },

  /* 40dp — dokunma hedefinin alt sınırı. İkon 20dp; kalanı çevresine
     bırakılan boşluk, çünkü küçük yuvarlak düğmeler parmakla
     ıskalanıyor. */
  /* ⚠️ Misafir görünümünde başlık satırı yok; düğme doğrudan
     ekranın sağ üstünde yüzüyor. `sayfaKenari` yerine `bosluk.normal`:
     içerik kenarı olmayan bir ekranda düğme kenara fazla yapışıyordu. */
  /* ⚠️ `top` BURADA YOK: güvenli alan cihaza göre değişiyor ve
     bileşende `insets.top` ile veriliyor. Sabit bir sayı yazsaydık
     çentikli telefonda düğme durum çubuğunun altında kalırdı. */
  temaButonYuzen: {
    right: bosluk.normal,
    zIndex: 1,
  },

  temaButon: {
    // ⭐ DEĞİŞTİ — sağdan sola geçti (çıkışla yer değiştirdi).
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: kose.tam,
    backgroundColor: renkler.kartArka,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    justifyContent: 'center',
    alignItems: 'center',
  },


  /* ---------- KİMLİK KARTI ---------- */

  /* ⭐ DEĞİŞTİ (2026-08-12) — kart yok, ortalı bir selamlama var. */
  kimlik: {
    alignItems: 'center',
    marginBottom: bosluk.genis,
  },

  /* 72dp: kartın içindeyken 56 yetiyordu, tek başına ortada duran bir
     öğe olarak küçük kalıyordu. Ekranın "kim olduğunu" söyleyen tek
     görsel bu. */
  // ⭐ YENİ — avatar + rozet birlikte konumlansın diye sarmalayıcı.
  avatarKap: {
    width: 72,
    height: 72,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: kose.tam,
    backgroundColor: renkler.lacivertYuzey,
    justifyContent: 'center',
    alignItems: 'center',

    // ⚠️ Fotoğraf yuvarlak çerçevenin dışına taşmasın.
    // borderRadius tek başına Android'de alt öğeyi kırpmıyor.
    overflow: 'hidden',
  },

  // ⚠️ Kendi ölçüsü DEĞİL, kabın tamamı: ölçü tek yerde (avatar)
  // tanımlı kalsın. İki yere 72 yazsaydık biri değişince fotoğraf
  // daireden taşardı.
  avatarFoto: {
    width: '100%',
    height: '100%',
  },

  /* Kalem/kamera rozeti — avatarın sağ altında.
     ⚠️ Turuncu ve dolu: bu bir EYLEM işareti ve ekranda dolu turuncu
     başka bir şey yok, "turuncu = eylem" kuralıyla çakışmıyor.
     ⚠️ Sayfa zemini renginde ince bir kenarlık, rozeti fotoğraftan
     ayırıyor — koyu bir fotoğrafta sınırı kaybolurdu. */
  avatarRozet: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: kose.tam,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: renkler.arkaPlan,
  },

  fotoKaldir: {
    marginTop: bosluk.kucuk,
    fontSize: yazi.kucuk,
    fontFamily: font.orta,
    color: renkler.yaziGri,

    // ⚠️ Altı çizili: bu bir bağlantı ve rengi gri. Renk tek başına
    // "basılabilir" demiyor, biçim de söylemeli.
    textDecorationLine: 'underline',
  },

  fotoHata: {
    marginTop: bosluk.kucuk,
    paddingHorizontal: sayfaKenari,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    fontFamily: font.orta,
    color: renkler.hata,
    textAlign: 'center',
  },

  avatarHarf: {
    color: renkler.lacivertYuzeyUstuYazi,
    fontSize: yazi.dev,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  merhaba: {
    fontSize: yazi.buyuk,
    lineHeight: satir.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    textAlign: 'center',
    marginTop: bosluk.orta,
  },


  /* ---------- MENÜ GRUPLARI ---------- */

  /* Grup tek bir kart: başlık şeridi + satırlar.
     overflow: satırların basılı zemini kartın yuvarlak köşesinden
     taşmasın. */
  /* ⭐ DEĞİŞTİ (2026-08-12) — GRUP ARTIK BİR KART DEĞİL, BİR KAPSAYICI.
     Kart olduğunda başlık şeridi ve satırlar tek bir bloktu; şimdi
     başlık kendi hapında, her satır kendi kartında. Gerekçe aşağıda
     (menuSatir). */
  grup: {
    marginBottom: bosluk.genis,
  },

  /* ⚠️ Başlık artık kartın DIŞINDA değil İÇİNDE, kendi şeridinde.
     Dışarıdayken satır kartlarıyla arasında sahipsiz bir boşluk
     kalıyordu ve hangi gruba ait olduğu boşlukla anlatılıyordu.

     ⭐ DEĞİŞTİ (2026-08-12) — ZEMİN ARTIK YUMUŞAK TURUNCU.
     `acikKart` (soluk fıstık yeşili) cihazda ölü duruyordu.
     `yumusakVurgu` ana rengin %12'lik hâli: markanın turuncusu ama
     bir yüzey olarak, buton gücünde değil. */
  /* ⭐ DEĞİŞTİ (2026-08-12) — ŞERİT ARTIK KENDİ BAŞINA DURAN BİR HAP.
     ⚠️ Rengi `vurguSerit` (%32): `yumusakVurgu` (%12) tek başına
     duran bir şerit olarak neredeyse görünmüyordu. İkon karesi hâlâ
     %12'de — orada ikonu bastırmaması gerekiyor.
     ⚠️ Alt çizgi kalktı: şerit artık satırlara YAPIŞIK değil,
     ayıracak bir şey yok. */
  grupBaslikSerit: {
    backgroundColor: renkler.vurguSerit,
    borderRadius: kose.orta,
    paddingHorizontal: bosluk.normal,
    paddingVertical: bosluk.kucuk,
    marginBottom: bosluk.orta,
    alignItems: 'center',
  },

  /* Küçük + BÜYÜK HARF + harf aralığı: başlık bir AYRAÇ, bir eylem
     değil.
     ⚠️ Renk `yaziGri`den `yaziKoyu`ya çıktı: turuncu zeminin üstünde
     gri yazı okunmuyordu (~3:1). Turuncu yazı da denenmedi — 11
     puntoda turuncu-üstü-turuncu kontrastı sınırın altında kalıyor.
     Turuncuyu zemin ve ikon taşıyor, yazı okunaklılığı koruyor. */
  grupBaslik: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    letterSpacing: 0.8,
  },

  /* ⭐ DEĞİŞTİ (2026-08-12) — HER SATIR KENDİ KARTI.
     ⚠️ Bu, 7.1'de "satırlar tek kartın içinde, aralarında ince
     ayraç" diye verilen kararın geri alınmasıdır. O karar sepet
     satırlarıyla aynı dili kurmak içindi; cihazda görülünce ayrı
     kartların daha ferah ve "premium" durduğu söylendi. Sepet hâlâ
     tek kart: orada satırlar BİR SİPARİŞİN parçaları, burada ise
     birbirinden bağımsız hedefler — gruplamayı gevşetmek doğru.
     ⚠️ Gölge `golgeSm` token'ından: elle `elevation` yazmak iOS'ta
     hiçbir şey çizmez. */
  menuSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    paddingHorizontal: bosluk.normal,
    paddingVertical: bosluk.orta,
    marginBottom: bosluk.kucuk,
    ...renkler.golgeSm,
  },

  /* ⭐ DEĞİŞTİ (2026-08-12) — İKON KARESİ TURUNCUYA DÖNDÜ.
     ⚠️ Bu, 7.1'de verilen "menü ikonları turuncu DEĞİL" kararının
     geri alınmasıdır. O karar sekiz adet PARLAK turuncu ikonun
     "turuncu = eylem" kuralını görünmez yapmasına karşıydı. Şimdiki
     hâl farklı: zemin %12'lik bir ton, ikon ise `anaRenkKoyu` —
     basılabilir bir yüzey değil, kategori işareti gibi okunuyor.
     Gerçek eylem turuncusu (dolu `anaRenk` butonlar) bu ekranda
     zaten yok, dolayısıyla çakışacak bir şey de yok. */
  menuIkon: {
    width: 34,
    height: 34,
    borderRadius: kose.kucuk,
    backgroundColor: renkler.yumusakVurgu,
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuYazi: {
    flex: 1,
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
  },

  /* minWidth: tek haneli ve iki haneli sayılarda rozet aynı genişlikte
     kalsın, satırlar arası zıplama olmasın. */
  sayacRozet: {
    minWidth: 26,
    paddingVertical: 2,
    paddingHorizontal: bosluk.kucuk,
    borderRadius: kose.tam,
    backgroundColor: renkler.acikKart,
    alignItems: 'center',
  },

  sayacYazi: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziOrta,
  },


  /* ---------- ÇIKIŞ ---------- */

  /* ⭐ DEĞİŞTİ (2026-08-12) — başlık satırının SOL ÜSTÜNDE.
     ⚠️ Çerçeve kaldırıldı. Aşağıdayken tam genişlikte çerçeveli bir
     butondu; başlık hizasında o çerçeve, yanındaki yuvarlak tema
     düğmesiyle yarışan ikinci bir kutu olurdu. Kırmızı renk ve
     ikon zaten yeterli işaret.
     ⚠️ DOLU kırmızı yapılmadı: dolu kırmızı "yıkıcı" demek ve o
     ağırlık hesap kapatmaya ait. Çıkış geri alınabilir.
     ⚠️ minHeight 40 — tema düğmesiyle aynı dokunma hedefi. */
  /* ⭐ DEĞİŞTİ (2026-08-12) — HAP BİÇİMİ, referans görselden.
     Çerçevesiz düz satır cihazda "yamuk" duruyordu: zemini yoktu,
     başlıkla aynı hizada yüzen bir yazı gibi görünüyordu. */
  cikisButon: {
    // ⭐ DEĞİŞTİ — soldan sağa geçti (temayla yer değiştirdi).
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    height: 40,
    paddingHorizontal: bosluk.normal,
    borderRadius: kose.tam,
    backgroundColor: renkler.yumusakHata,
  },

  cikisYazi: {
    color: renkler.hata,
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },


  /* ---------- TEHLİKELİ BÖLGE ---------- */

  tehlikeAyirac: {
    height: 1,
    backgroundColor: renkler.kenarlik,
    marginTop: bosluk.dev,
    marginBottom: bosluk.normal,
  },

  tehlikeSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.kucuk,
    paddingVertical: bosluk.orta,
  },

  tehlikeYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.hata,
  },

  tehlikeAciklama: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    textAlign: 'center',
    lineHeight: satir.kucuk,
  },
});
