import React, { useState, useEffect } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost, apiDelete } from '../services/api';
import { sonGezileneEkle } from '../services/sonGezilenler';
import { useFavorite } from '../context/FavoriteContext';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';
import { useAuth } from '../context/AuthContext';
import { paraBicimle } from '../utils/bicimlendir';
// ⭐ YENİ (B1) — indirim kuralı ürün kartlarıyla ortak
import { indirimBilgisi, yuzdeYazisi } from '../utils/indirim';
// ⭐ YENİ (5.1) — ortak adet kontrolü
import AdetKontrolu from '../components/AdetKontrolu';
import UrunGaleri from '../components/UrunGaleri';
import YorumBolumu from '../components/YorumBolumu';
import Yildizlar from '../components/Yildizlar';
import Rozet from '../components/Rozet';

// ⭐ YENİ — açıklamanın "uzun" sayıldığı karakter eşiği.
//
// Bu bir YAKLAŞIKLIK. Gerçek doğru yol metnin kaç satır kapladığını
// onTextLayout ile ölçmek olurdu ama o ölçüm ilk render'dan SONRA
// gelir — yani buton bir kare geç belirir ve ekran zıplar.
//
// 160 karakter, telefon genişliğinde kabaca 4 satır ediyor. Kısa
// açıklamalarda "Devamını gör" hiç çıkmıyor, uzunlarda çıkıyor.
// Yanlış tarafa düşen sınır durumunda olan tek şey: gereksiz bir
// buton veya gereksiz bir kesik. İkisi de zararsız.
const ACIKLAMA_ESIGI = 160;

export default function UrunDetayEkrani({ route, navigation }) {
  const { urunId } = route.params;
  const { favoriMi, favoriDegistir } = useFavorite();
  const { token } = useAuth();
  const { renkler } = useTema();
  const { sepet, sepeteEkle } = useSepet();

  // ⚠️ Yüzen geri butonunun durum çubuğunun altında kalması için.
  // Sabit bir sayı yazsaydık centikli telefonlarda saatin üstune
  // binerdi.
  const { top: guvenliUst } = useSafeAreaInsets();
  const styles = stilOlustur(renkler);

  const [urun, setUrun] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  // ⭐ DEĞİŞTİ — "islemde" ve "eklendi" kaldırıldı.
  // O ikisi eski tek butonun durumuydu; sepete ekleme artık
  // AdetKontrolu bileşeninin içinde ve kendi durumunu kendi
  // tutuyor. Burada bırakmak, hiçbir şeyi kontrol etmeyen iki
  // state demekti.
  const [simdiAlIslemde, setSimdiAlIslemde] = useState(false);

  // ⭐ YENİ — açıklama tamamen açık mı?
  //
  // Bu GÖRSEL bir durum (ekranın görünümünü değiştiriyor), o yüzden
  // useState. Görsel olmayan veriler için useRef kullanıyorduk —
  // sipariş anahtarı gibi.
  const [aciklamaAcik, setAciklamaAcik] = useState(false);

  // ⭐ YENİ (5.5) — stok bildirimi isteği gönderiliyor mu?
  //
  // Talebin VAR OLUP OLMADIĞI ayrı bir state'te tutulmuyor;
  // urun.stokBildirimiVar'dan okunuyor. Ayrı state tutsaydık aynı
  // gerçek iki yerde yaşardı ve ürün yeniden çekildiğinde ikisi
  // ayrışabilirdi. "Türetilmiş değer ayrı state'te tutulmaz."
  const [bildirimIslemde, setBildirimIslemde] = useState(false);

  // ---------- STOK BİLDİRİMİ: AÇ / KAPAT ----------
  async function stokBildirimiDegistir() {
    // ⚠️ Misafir kontrolü ÖNCE. İstek atsaydık sunucu 401 döner ve
    // müşteri anlamsız bir hata görürdü; giriş ekranına götürmek
    // ona ne yapması gerektiğini söylüyor. Sepete eklemede de
    // aynı desen var.
    if (!token) {
      navigation.navigate('Giris');
      return;
    }

    const talepVar = urun.stokBildirimiVar === true;

    try {
      setBildirimIslemde(true);

      if (talepVar) {
        await apiDelete('/products/' + urunId + '/stok-bildirimi');
      } else {
        await apiPost('/products/' + urunId + '/stok-bildirimi', {});
      }

      // ⚠️ Ürünü SUNUCUDAN yeniden çekiyoruz, yerelde bayrağı elle
      // çevirmiyoruz. Elle çevirmek, sunucunun gerçekte ne yaptığını
      // varsaymak olurdu; sessiz kalan bir hata durumunda ekran
      // "talebin var" derken sunucuda hiçbir kayıt olmayabilirdi.
      //
      // sessiz=true: tam ekran yükleniyor göstergesi çıkmasın,
      // sayfa yerinde kalsın.
      await urunuGetir(true);
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setBildirimIslemde(false);
    }
  }

  async function urunuGetir(sessiz = false) {
    try {
      if (!sessiz) setYukleniyor(true);
      const veri = await apiGet('/products/' + urunId);
      setUrun(veri);
    } catch (hata) {
      Alert.alert('Hata', 'Ürün yüklenemedi: ' + hata.message);
    } finally {
      if (!sessiz) setYukleniyor(false);
    }
  }

  useEffect(() => { urunuGetir(); }, [urunId]);

  // ⭐ YENİ (GV/Faz 4) — ZİYARETİ CİHAZA KAYDET
  //
  // Ana sayfadaki "Son gezdiğin ürünler" şeridini besleyen tek
  // yer burası.
  //
  // ⚠️ ÜRÜNÜN GELMESİ BEKLENMİYOR, id YETİYOR.
  // urunuGetir'in içine koysaydık istek başarısız olduğunda
  // ziyaret kaydedilmezdi. Oysa müşteri o ürüne BAKTI; ağ
  // hatası bu gerçeği değiştirmiyor. Silinmiş bir ürün de sorun
  // değil: şerit onu sunucudan çekemeyince listeden kendiliğinden
  // düşüyor.
  //
  // ⚠️ await EDİLMİYOR ve hatası yakalanmıyor — servisin kendisi
  // yutuyor. Bu bir arka plan kolaylığı; ekranın açılışını
  // bekletmesi ya da bir hata göstermesi kabul edilemez.
  useEffect(() => { sonGezileneEkle(urunId); }, [urunId]);

  // ⭐ YENİ (5.2) — ŞİMDİ AL
  //
  // Sepete ekler ve sepet ekranına gider. Ayrı bir ödeme akışı
  // DEĞİL — stok/kupon/toplam mantığının ikinci kopyası olurdu.
  //
  // ⚠️ Ürün SEPETTE ZATEN VARSA tekrar eklemiyoruz, doğrudan
  // sepete gidiyoruz. Eklemek adedi sessizce artırırdı ve
  // kullanıcı "1 tane istemiştim, 2 oldu" derdi.
  async function simdiAl() {
    if (!token) {
      navigation.navigate('Giris');
      return;
    }

    try {
      setSimdiAlIslemde(true);

      // ⚠️ Buton zaten sepetteyken görünmüyor ama kontrolü
      // burada da tutuyoruz: iki hızlı dokunuş arasında sepet
      // değişmiş olabilir ve ikinci dokunuş adedi sessizce
      // artırırdı.
      if (!sepetteVar) {
        await sepeteEkle(urun.id, 1);
      }

      // ⚠️ SEKME ADI 'Sepet', 'Sepetim' DEĞİL.
      //
      // 'Sepetim' ekranda GÖRÜNEN başlık (Tab.Screen options.title);
      // gezinme ise ROTA ADIYLA yapılır. İkisini karıştırınca
      // React Navigation "böyle bir ekran yok" diyor.
      //
      // İç içe gezinme: önce sekme, sonra o sekmenin içindeki ekran.
      // Sepet sekmesi bir stack ve ilk ekranı SepetMain.
      navigation.navigate('Sepet', { screen: 'SepetMain' });
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setSimdiAlIslemde(false);
    }
  }

  function favoriBasildi() {
    if (!token) { navigation.navigate('Giris'); return; }
    favoriDegistir(urun.id);
  }

  if (yukleniyor) {
    return <View style={styles.ortala}><ActivityIndicator size="large" color={renkler.anaRenk} /></View>;
  }
  if (!urun) {
    return <View style={styles.ortala}><Text style={styles.bosYazi}>Ürün bulunamadı.</Text></View>;
  }

  const favori = favoriMi(urun.id);

  // ⭐ YENİ — sunucudan gelen stok DURUMU (ham sayı artık gelmiyor).
  //
  // ⚠️ "=== 'yok'" yazıyoruz, "!== 'var'" değil.
  // Alan hiç gelmezse (eski API sürümü) undefined olur; "!== 'var'"
  // yazsaydık ürün tükenmiş görünür ve "Sepete Ekle" butonu kilitli
  // kalırdı. Açıkça "yok" denmedikçe ürün satılabilir sayılıyor —
  // asıl stok kilidi zaten sunucuda, sipariş anındaki atomik UPDATE'te.
  const tukendi = urun.stokDurumu === 'yok';
  const azKaldi = urun.stokDurumu === 'az';

  // ⭐ YENİ — ürün sepette mi?
  //
  // "Şimdi Al" yalnızca ürün HENÜZ SEPETTE DEĞİLKEN anlamlı: işi
  // "sepete at ve sepete git". Ürün zaten sepetteyse o buton
  // "sadece sepete git" demek olurdu ve alt sekmedeki Sepetim ile
  // aynı işi yapardı — aynı işi yapan iki düğme koymuyoruz.
  //
  // Türetilmiş değer, ayrı state yok: sepet değişince kendiliğinden
  // yeniden hesaplanıyor.
  const sepetteVar = sepet.some((s) => s.productId === urun.id);

  // ⭐ YENİ (B1) — indirim durumu.
  //
  // Kural utils/indirim.js'te: ürün kartı, kompakt kart ve bu ekran
  // aynı soruyu soruyor. Burada tekrar hesaplasaydık yuvarlama
  // yönünü değiştirdiğimizde kartta "-%16", detayda "-%17"
  // yazabilirdi — aynı ürün için iki farklı indirim iddiası.
  const { indirimliMi, eskiFiyat, yuzde } = indirimBilgisi(urun);

  return (
    /* ⭐ DEĞİŞTİ (GV/Faz 5.1) — edges'ten 'top' ÇIKARILDI.

       Galeri artık tam genişlik ve ekranın en üstünden başlıyor;
       güvenli alan boşluğu bırakılsaydı fotoğrafın üstünde bir
       şerit kalır ve "tam ekran" hissi kaybolurdu. Durum çubuğuyla
       çakışan tek şey geri butonu ve o zaten aşağıda, güvenli
       alanın altında konumlanıyor. */
    <SafeAreaView style={styles.kapsayici} edges={[]}>
      <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
        {/* GALERİ + FAVORİ KALBİ */}
        <UrunGaleri resimler={urun.images || []} urunAdi={urun.name} />

        {/* ⭐ DEĞİŞTİ (GV/Faz 5.2) — BİLGİ KARTI GALERİNİN ÜSTÜNE BİNİYOR.

            marginTop negatif: yaprak fotoğrafın alt 20dp'sini
            örtüyor ve üst köşeleri yuvarlak olduğu için fotoğraf
            kartın altından çıkıyor gibi duruyor. Tasarımın en
            belirgin hareketi bu.

            ⚠️ Negatif marj + overflow: iOS'ta gölge kırpılmasın
            diye kartın kendi gölgesi yok; ayrımı köşe yuvarlaklığı
            ve renk farkı yapıyor. */}
        <View style={styles.bilgiKart}>
          <Text style={styles.urunAd}>{urun.name}</Text>

          {urun.reviewCount > 0 && (
            <View style={styles.ortalamaSatir}>
              <Yildizlar deger={urun.averageRating} boyut={16} />
              <Text style={styles.ortalamaYazi}>{Number(urun.averageRating).toFixed(1)}</Text>
            </View>
          )}

          {/* META: kaç değerlendirme · kaç favoride */}
          <View style={styles.metaSatir}>
            <View style={styles.metaOge}>
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={renkler.yaziGri} />
              <Text style={styles.metaYazi}>{urun.reviewCount} değerlendirme</Text>
            </View>
            <View style={styles.metaNokta} />
            <View style={styles.metaOge}>
              <Ionicons name="heart-outline" size={15} color={renkler.yaziGri} />
              <Text style={styles.metaYazi}>{urun.favoriteCount || 0} favoride</Text>
            </View>
          </View>

          {/* ⭐ DEĞİŞTİ — ham stok sayısı yerine üç durumlu metin.

              Eskiden "Stokta 847 adet var" yazıyordu. İki sorun:
              rakip stok takibi yapabiliyordu ve büyük sayı aciliyeti
              öldürüyordu. Artık sunucu üç durumdan birini gönderiyor
              ve tam sayı yalnızca eşiğin altındayken (kalanAdet)
              geliyor. */}
          <Text
            style={
              tukendi ? styles.stokYok : azKaldi ? styles.stokAz : styles.stokVar
            }
          >
            {tukendi
              ? 'Tükendi'
              : azKaldi
              ? `Son ${urun.kalanAdet} ürün`
              : 'Stokta var'}
          </Text>
        </View>

        {/* ⭐ YENİ — ÜRÜN AÇIKLAMASI */}
        {/*
          ⚠️ Açıklama boşsa bölüm HİÇ ÇİZİLMİYOR.

          "Açıklama yok" yazan boş bir kart koymak, kullanıcıya
          bilgi vermeyen bir kutu göstermek demek. "İşi olmayan
          ekran yapılmaz" — burada da işi olmayan kart yapılmıyor.

          urun.description null gelebilir; ?. ile güvenli okuyup
          trim ediyoruz ki sadece boşluktan ibaret metinler de
          "yok" sayılsın.
        */}
        {urun.description && urun.description.trim() !== '' && (
          <View style={styles.aciklamaKart}>
            <Text style={styles.aciklamaBaslik}>Ürün Açıklaması</Text>

            <Text
              style={styles.aciklamaMetin}

              /* Kapalıyken 4 satırda kes, açıkken sınır yok.
                 undefined vermek "sınırsız" demek — 0 vermek
                 metni tamamen gizlerdi. */
              numberOfLines={aciklamaAcik ? undefined : 4}
            >
              {urun.description}
            </Text>

            {/* Buton sadece metin GERÇEKTEN uzunsa çizilsin.
                Üç satırlık bir açıklamanın altına "Devamını gör"
                koymak kullanıcıyı boşuna tıklatır. */}
            {urun.description.length > ACIKLAMA_ESIGI && (
              <TouchableOpacity
                style={styles.aciklamaButon}
                onPress={() => setAciklamaAcik(!aciklamaAcik)}
              >
                <Text style={styles.aciklamaButonYazi}>
                  {aciklamaAcik ? 'Daha az göster' : 'Devamını gör'}
                </Text>

                <Ionicons
                  name={aciklamaAcik ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={renkler.anaRenk}
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* YORUMLAR */}
        <View style={styles.yorumKart}>
          <YorumBolumu urunId={urunId} onDegisti={() => urunuGetir(true)} />
        </View>
      </ScrollView>

      {/* ⭐ YENİ (GV/Faz 5.1) — YÜZEN GERİ BUTONU

          Başlıklı üst barın yerini aldı. "Ürün Detayı" yazısı
          kaldırıldı: müşteri zaten bir ürünün fotoğrafına bakıyor,
          nerede olduğunu söylemeye gerek yok — o satır yalnızca
          fotoğrafa ayrılabilecek 48dp'yi yiyordu.

          ⚠️ SafeAreaView'in dışında ve mutlak konumlu: ScrollView
          kayarken buton yerinde kalıyor. İçine koysaydık fotoğrafla
          birlikte yukarı kayar ve uzun sayfalarda geri dönmek için
          en yukarı çıkmak gerekirdi.

          ⚠️ top: güvenli alan + 12. Durum çubuğunun altında
          kalması gerekiyor; sabit bir sayı yazsaydık çentikli
          telefonlarda saatin üstüne binerdi. */}
      <TouchableOpacity
        style={[styles.yuzenButon, styles.geriYuzen, { top: guvenliUst + bosluk.orta }]}
        onPress={() => navigation.goBack()}
        hitSlop={8}
      >
        <Ionicons name="arrow-back" size={22} color={renkler.yaziKoyu} />
      </TouchableOpacity>

      {/* ⭐ DEĞİŞTİ (GV/Faz 5.1 düzeltmesi) — FAVORİ KALBİ GALERİDEN
          BURAYA TAŞINDI.

          ⚠️ Cihazda görülen bir hatanın düzeltmesi: kalp galerinin
          içindeyken üstten SABİT 12dp ile konumlanıyordu. Galeri tam
          ekrana çıkınca o 12dp durum çubuğunun içine düştü ve kalp
          saatin/pil ikonunun üstüne bindi.

          Geri butonu güvenli alanı hesaba katıyordu, kalp katmıyordu
          — yani ikisi zaten farklı hizadaydı ve biri yanlıştı.

          Artık ikisi de AYNI değeri okuyor (guvenliUst + 12) ve aynı
          stil temelini paylaşıyor. Biri değişince diğeri de değişir;
          bir daha ayrışamazlar. */}
      <TouchableOpacity
        style={[styles.yuzenButon, styles.kalpYuzen, { top: guvenliUst + bosluk.orta }]}
        onPress={favoriBasildi}
        hitSlop={8}
      >
        <Ionicons
          name={favori ? 'heart' : 'heart-outline'}
          size={22}
          color={favori ? renkler.favoriRenk : renkler.yaziKoyu}
        />
      </TouchableOpacity>

      {/* ALT BAR: FİYAT + SEPETE EKLE */}
      <View style={styles.altBar}>
        {/* ⭐ DEĞİŞTİ (B1) — indirimli üründe fiyat kutusu iki satır.

            ÜST SATIR : üstü çizili eski fiyat + yüzde rozeti
            ALT SATIR : ödenecek tutar (yeşil)

            ⚠️ ROZET KIRMIZI, TASARIMDAKİ GİBİ YEŞİL DEĞİL.
            Tasarım ürün detayında rozeti yeşil, ürün kartında
            kırmızı çizmiş — kendi içinde tutarsız. Kırmızı seçildi
            çünkü rozet ile fiyat FARKLI işler yapıyor: rozet dikkat
            çeker, fiyat kazancı söyler. İkisi de yeşil olsaydı
            rozetin "bak buraya" işlevi kaybolurdu. Aynı karar
            tema.js'te indirimArka token'ının yanında yazılı.

            ⚠️ GENİŞLİK BÜYÜMÜYOR. Üst satır (12px fiyat + küçük
            hap) altındaki 22px'lik fiyattan dar kalıyor; alt
            çubuktaki "Şimdi Al" ve sepet kontrolü daralmıyor.
            Rozeti fiyatın YANINA koysaydık kutu genişler, iki
            butonun payı azalırdı. */}
        <View style={styles.fiyatKutu}>
          {indirimliMi && (
            <View style={styles.indirimSatir}>
              <Text style={styles.eskiFiyat}>{paraBicimle(eskiFiyat)}</Text>

              {yuzde > 0 && <Rozet tip="indirim" yazi={yuzdeYazisi(yuzde)} />}
            </View>
          )}

          <Text style={[styles.fiyat, indirimliMi && styles.fiyatIndirimli]}>
            {paraBicimle(urun.price)}
          </Text>
        </View>

        {/* ⭐ DEĞİŞTİ (5.1 + 5.2) — tek buton yerine iki eylem.

            ÜSTTE  : Şimdi Al   → sepete ekler + sepete gider
            ALTTA  : AdetKontrolu → sepete ekle / − [n] +

            ⚠️ "Şimdi Al" AYRI BİR ÖDEME AKIŞI DEĞİL.
            Sepete ekleyip sepet ekranına gidiyor. Ayrı bir akış
            yazmak stok, kupon ve toplam mantığının ikinci bir
            kopyası olurdu — üçü de zaten sepet üzerinden çalışıyor
            ve ikiye ayrılan her kural er ya da geç ayrışıyor. */}
        <View style={styles.eylemler}>
          {/* ⭐ DEĞİŞTİ — "Şimdi Al" ÖNE alındı.

              Sıra: kestirme yol solda, asıl eylem sağda. Türkiye'deki
              e-ticaret uygulamalarında sepete ekleme sağdaki baskın
              buton; kullanıcı baş parmağıyla oraya uzanıyor. */}
          {!tukendi && !sepetteVar && (
            <TouchableOpacity
              style={styles.simdiAlButon}
              onPress={simdiAl}
              disabled={simdiAlIslemde}
              activeOpacity={0.85}
            >
              {simdiAlIslemde ? (
                <ActivityIndicator size="small" color={renkler.anaRenk} />
              ) : (
                <Text style={styles.simdiAlYazi}>Şimdi Al</Text>
              )}
            </TouchableOpacity>
          )}

          {/* ⭐ DEĞİŞTİ — sarmalayıcıya flex: 1.

              AdetKontrolu'nun kendi kökü içeriğe göre boyutlanıyor;
              esneme kararını KULLANAN taraf veriyor. Bileşenin
              içine flex koysaydık, onu dar bir yerde kullanmak
              istediğimizde (ürün kartı) orayı da zorlardı.

              Bu satır olmadan sağda boş alan kalıyordu. */}
          {/* ⭐ YENİ (5.5) — TÜKENDİYSE "HABER VER", DEĞİLSE ADET KONTROLÜ

              ⚠️ AdetKontrolu tükenmiş üründe soluk bir "Stokta Yok"
              butonu gösteriyordu. O buton hiçbir işe yaramıyordu:
              müşteriye durumu söylüyor ama YAPABİLECEĞİ bir şey
              sunmuyordu. Yerine gerçek bir eylem koyduk.

              Tükenmiş ürün, müşterinin ilgilendiği ama alamadığı
              ürün demek — mağaza için en değerli sinyallerden biri.
              Eskiden o ilgi kayboluyordu. */}
          <View style={styles.adetSarmal}>
            {tukendi ? (
              <TouchableOpacity
                style={[
                  styles.bildirimButon,
                  urun.stokBildirimiVar === true && styles.bildirimButonAktif,
                ]}
                onPress={stokBildirimiDegistir}
                disabled={bildirimIslemde}
                activeOpacity={0.85}
              >
                {bildirimIslemde ? (
                  <ActivityIndicator size="small" color={renkler.anaRenk} />
                ) : (
                  <>
                    <Ionicons
                      name={
                        urun.stokBildirimiVar === true
                          ? 'notifications'
                          : 'notifications-outline'
                      }
                      size={18}
                      color={renkler.anaRenk}
                    />
                    {/* İki metin de NE OLACAĞINI söylüyor, durumu değil.
                        "Bildirim açık" yazsaydık müşteri basınca ne
                        olacağını tahmin etmek zorunda kalırdı. */}
                    <Text style={styles.bildirimYazi}>
                      {urun.stokBildirimiVar === true
                        ? 'Haber vermeyi bırak'
                        : 'Stoka gelince haber ver'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <AdetKontrolu urun={urun} boyut="buyuk" />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: renkler.arkaPlan },
  ortala: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: renkler.arkaPlan },
  bosYazi: { fontSize: 16, color: renkler.yaziGri },
  /* ⭐ YENİ (GV/Faz 5.1) — YÜZEN GERİ BUTONU.
     Başlıklı üst bar (ustBar/geriButon/ustBaslik) kaldırıldı;
     "Ürün Detayı" yazısı fotoğrafa ayrılabilecek 48dp'yi yiyordu.

     ⚠️ Zemin kartArka: fotoğrafın üstünde duruyor ve fotoğrafın
     rengi bilinmiyor. Saydam bıraksaydık açık bir fotoğrafta ok
     kaybolurdu. */
  /* ⚠️ ORTAK TEMEL — geri ve favori aynı görünümü paylaşıyor.
     İkisini ayrı ayrı tanımlasaydık biri değişince diğeri geride
     kalır ve simetri sessizce bozulurdu; zaten bir kez öyle oldu. */
  yuzenButon: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: kose.tam,
    backgroundColor: renkler.kartArka,
    justifyContent: 'center',
    alignItems: 'center',
    ...renkler.golgeSm,
  },

  geriYuzen: { left: bosluk.orta },
  kalpYuzen: { right: bosluk.orta },

  icerik: { paddingBottom: bosluk.genis },

  bilgiKart: {
    backgroundColor: renkler.kartArka,

    /* ⚠️ YAN BOŞLUK YOK — yaprak ekranın tamamını kaplıyor.
       Kart olarak durmuyor, galerinin üstüne binen bir YÜZEY.
       marginHorizontal verseydik iki yanda fotoğraf görünür ve
       "yaprak" hissi bozulurdu. */
    marginTop: -bosluk.genis,   // galerinin alt 24dp'sini örtüyor
    borderTopLeftRadius: kose.dev,
    borderTopRightRadius: kose.dev,
    paddingHorizontal: bosluk.normal,
    paddingTop: bosluk.genis,
    paddingBottom: bosluk.normal,
  },

  // ⭐ YENİ — açıklama bölümü
  //
  // bilgiKart ile AYNI görsel kabuk (arka plan, kenarlık, yuvarlaklık,
  // kenar boşlukları). Aynı ekranda iki farklı kart görünümü olmasın —
  // "asimetrik boşluk bozuk, simetrik boşluk kasıtlı okunur."
  aciklamaKart: {
    backgroundColor: renkler.kartArka,
    marginHorizontal: sayfaKenari,
    marginTop: bosluk.orta,
    borderRadius: kose.buyuk,
    padding: bosluk.normal,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },

  aciklamaBaslik: {
    fontSize: 16,
    fontWeight: '600', fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: 10,
  },

  aciklamaMetin: {
    fontSize: 14,
    // Uzun metinde satır aralığı okunabilirliğin yarısı.
    // Varsayılan aralık paragraf metni için çok sıkışık.
    lineHeight: 22,
    color: renkler.yaziOrta,
  },

  aciklamaButon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,

    // Dokunma hedefini büyüt: sadece yazı kadar olsaydı
    // parmakla ıskalanırdı.
    paddingVertical: 6,
  },

  aciklamaButonYazi: {
    fontSize: 14,
    fontWeight: '600', fontFamily: font.yari,
    color: renkler.anaRenk,
  },
  urunAd: { fontSize: 22, fontWeight: 'bold', fontFamily: font.kalin, color: renkler.yaziKoyu, marginBottom: 8 },
  ortalamaSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ortalamaYazi: { fontSize: 15, fontWeight: '700', fontFamily: font.kalin, color: renkler.yaziKoyu, marginLeft: 6 },

  metaSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaOge: { flexDirection: 'row', alignItems: 'center' },
  metaYazi: { fontSize: 13, color: renkler.yaziGri, marginLeft: 5 },
  metaNokta: { width: 3, height: 3, borderRadius: 2, backgroundColor: renkler.yaziGri, marginHorizontal: 10 },

  stokVar: { fontSize: 15, color: renkler.basari, fontWeight: '600', fontFamily: font.yari },
  stokYok: { fontSize: 15, color: renkler.yaziGri, fontWeight: '600', fontFamily: font.yari },

  /* ⭐ YENİ — az kaldı hali. Turuncu "acele et" der; yeşil (rahat ol)
     ile gri (yok) arasındaki üçüncü durum. */
  stokAz: { fontSize: 15, color: renkler.uyari, fontWeight: '600', fontFamily: font.yari },

  /* ⭐ YENİ (5.1/5.2) — alt bardaki iki eylem.

     AdetKontrolu esneyerek genişliyor (flex: 1 alt bileşenden
     gelmiyor, buradaki sarmalayıcı veriyor), "Şimdi Al" sabit
     genişlikte kalıyor. Böylece adet 2 haneye çıkınca kontrol
     büyümüyor, düzen zıplamıyor. */
  eylemler: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  /* Sepete ekleme / adet kontrolü kalan alanı doldursun.
     Şimdi Al sabit genişlikte kalıyor. */
  adetSarmal: {
    flex: 1,
  },

  /* "Şimdi Al" İKİNCİL görünümde: çerçeveli, dolgusuz.

     ⚠️ İki dolu buton yan yana durursa hangisinin asıl eylem
     olduğu belirsizleşir. Sepete ekleme birincil (dolu mavi),
     "Şimdi Al" ise kestirme yol — ikincil. */
  simdiAlButon: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: renkler.anaRenk,
    alignItems: 'center',
    justifyContent: 'center',
  },

  simdiAlYazi: {
    color: renkler.anaRenk,
    fontSize: 16,
    fontWeight: '700', fontFamily: font.kalin,
  },

  /* ⭐ YENİ (5.5) — "Stoka gelince haber ver" butonu.

     ⚠️ ÇERÇEVELİ (ikincil), dolu değil.
     Dolu mavi bu ekranda "sepete ekle" demek. Haber verme talebi bir
     satın alma değil, bir hatırlatma isteği — aynı görsel ağırlığı
     vermek, müşteriye satın aldığını düşündürebilirdi.

     Tükenmiş üründe zaten tek eylem bu olduğu için dikkat çekmek
     için doluya ihtiyacı yok; rakibi yok. */
  bildirimButon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: renkler.anaRenk,
  },

  /* Talep AKTİFKEN yumuşak zemin.

     Kenarlık aynı kalıyor, sadece içi doluyor — buton "basılmış"
     görünüyor ama hâlâ basılabilir olduğu belli. Tamamen dolu maviye
     çevirseydik birincil eyleme benzerdi. */
  bildirimButonAktif: {
    backgroundColor: renkler.yumusakVurgu,
  },

  bildirimYazi: {
    color: renkler.anaRenk,
    fontSize: 14,
    fontWeight: '700', fontFamily: font.kalin,
  },

  yorumKart: {
    backgroundColor: renkler.kartArka,
    marginHorizontal: sayfaKenari,
    marginTop: bosluk.orta,
    borderRadius: kose.buyuk,
    padding: bosluk.normal,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },

  altBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: bosluk.orta,
    paddingVertical: bosluk.orta,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  fiyatKutu: { marginRight: bosluk.orta },

  /* ⭐ DEĞİŞTİ (GV/Faz 5.3) — FİYAT ARTIK TURUNCU DEĞİL.
     ⚠️ Bu bir kural ihlaliydi ve palet değişince görünür oldu.

     Turuncu bu uygulamada EYLEM demek. Alt çubukta fiyatın hemen
     yanında "Şimdi Al" ve "Sepete Ekle" butonları var; üçü de
     turuncu olunca hangisine basılacağı renkten okunamıyordu.
     Ürün kartında bu kural zaten uygulanmıştı, detay ekranı
     atlanmış.

     ⚠️ "Fiyat" etiketi de KALDIRILDI: altındaki sayı zaten ₺ ile
     bitiyor, neyin fiyat olduğu belli. Etiket yalnızca alt çubuğu
     iki satır yapıyordu. */
  fiyat: {
    fontSize: yazi.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    lineHeight: satir.baslik,
    color: renkler.yaziKoyu,
  },

  /* ⭐ YENİ (B1) — eski fiyat + yüzde rozeti aynı satırda.

     Rozet fiyatın ÜSTÜNDE değil, eski fiyatın yanında: ikisi de
     "bu ürün ucuzladı" cümlesinin parçası, ödenecek tutar ise ayrı
     bir bilgi. Aynı cümlenin parçaları aynı satırda durur. */
  indirimSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    marginBottom: 2,
  },

  /* Soluk + üstü çizili — ürün kartındaki dilin aynısı.
     Renk tek bilgi kanalı değil: çizgi renkten bağımsız olarak
     "bu tutar artık geçerli değil" diyor. */
  eskiFiyat: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    lineHeight: satir.kucuk,
    textDecorationLine: 'line-through',
  },

  /* ⚠️ İndirimli fiyat YEŞİL, turuncu değil. Alt çubukta fiyatın
     yanında "Şimdi Al" ve "Sepete Ekle" var; fiyat da turuncu
     olsaydı hangisinin basılabilir olduğu renkten okunamazdı. */
  fiyatIndirimli: {
    color: renkler.basari,
  },
});