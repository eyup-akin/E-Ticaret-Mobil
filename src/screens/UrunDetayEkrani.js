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
import YatayListe from '../components/YatayListe';       // ⭐ YENİ
import KombinSeridi from '../components/KombinSeridi';   // ⭐ YENİ

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

  // ⭐ YENİ — öneri bölümleri. Üçü de İKİNCİL veri: gelmezse
  // bölüm hiç çizilmiyor, ürün detayı çalışmaya devam ediyor.
  const [benzerler, setBenzerler] = useState([]);
  const [birlikte, setBirlikte] = useState([]);
  const [kombinler, setKombinler] = useState([]);

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

  // ⭐ YENİ — kombinin TÜM ürünlerini sepete ekler.
  //
  // ⚠️ İndirim istemcide hesaplanmıyor: sunucu sepette kombinin
  // tamamını görünce indirimi kendisi uyguluyor.
  async function kombinSepeteEkle(kombin) {
    try {
      for (const u of kombin.urunler) {
        await sepeteEkle(u.id, 1);
      }

      Alert.alert('Sepete eklendi', kombin.ad + ' sepetine eklendi.');
    } catch (hata) {
      Alert.alert('Eklenemedi', hata.message);
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

  // ⭐ YENİ — ÖNERİ BÖLÜMLERİ
  //
  // ⚠️ Ürün detayından AYRI istekler: detay bunlar gelmeden de tam
  // çalışıyor, öneriler gecikirse sayfa beklemiyor.
  useEffect(() => {
    let iptal = false;

    (async () => {
      try {
        const [b, ba, k] = await Promise.all([
          apiGet('/products/' + urunId + '/benzer'),
          apiGet('/products/' + urunId + '/birlikte-alinanlar'),
          apiGet('/products/' + urunId + '/kombinler'),
        ]);

        if (iptal) return;

        setBenzerler(b);
        setBirlikte(ba);
        setKombinler(k);
      } catch (hata) {
        // Sessizce geçiliyor: öneri ikincil veri.
        console.log('Öneriler alınamadı:', hata.message);
      }
    })();

    return () => { iptal = true; };
  }, [urunId]);

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

  // ⭐ YENİ (GV/Faz 5.6) — açıklama tek yerde hazırlanıyor.
  //
  // Eskiden urun.description üç ayrı yerde okunuyordu: bölümün
  // çizilip çizilmeyeceği, metnin kendisi ve uzunluk eşiği. Üçü de
  // ayrı ayrı trim etmiyordu — sadece boşluktan ibaret bir açıklama
  // "var" sayılıp boş bir kart çiziyordu ve eşik ölçümü baştaki
  // boşlukları da sayıyordu.
  const aciklama = (urun.description || '').trim();

  // Metin gerçekten uzun mu? Katlama kontrolü SADECE bunun için var;
  // kısa açıklamada chevron çizilmiyor ve başlık satırı basılabilir
  // değil. Basınca hiçbir şey değişmeyen bir kontrol, "bozuk"
  // izlenimi verir.
  const aciklamaUzun = aciklama.length > ACIKLAMA_ESIGI;

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

          {/* ⭐ DEĞİŞTİ (GV/Faz 5.3) — STOK DURUMU ARTIK ROZET.

              Eskiden renkli düz yazıydı. Tasarımda hap biçiminde bir
              rozet var ve ürün kartında da rozet kullanılıyor; aynı
              bilgi iki ekranda iki farklı biçimde çizilmemeli.

              ⚠️ Ham sayı yine yok: sunucu üç durumdan birini
              gönderiyor, tam sayı yalnızca eşiğin altındayken
              (kalanAdet) geliyor.

              ⚠️ "Stokta var" rozeti BURADA duruyor ama ürün
              kartında YOK — 5.4b'de bilerek kaldırılmıştı. Fark:
              kartta o rozet neredeyse her üründe çıkıyor ve
              yanındaki "Son 3 ürün" uyarısını değersizleştiriyordu.
              Burada tek ürün var, seyreltecek bir komşusu yok ve
              müşteri tam da satın alma kararını veriyor. */}
          <View style={styles.stokRozetYeri}>
            <Rozet
              tip={tukendi ? 'notr' : azKaldi ? 'uyari' : 'basari'}
              yazi={
                tukendi
                  ? 'Tükendi'
                  : azKaldi
                  ? `Son ${urun.kalanAdet} ürün`
                  : 'Stokta var'
              }
            />
          </View>

          {/* ⭐ YENİ (GV/Faz 5.3 + 5.4) — FİYAT BLOĞU ALT ÇUBUKTAN
              BURAYA TAŞINDI.

              ⚠️ ALT ÇUBUKTA ARTIK FİYAT YOK — bilinçli.

              Tasarım fiyatı içeriğe koyuyor, alt çubuğu yalnızca
              eyleme ayırıyor. İkisinde birden gösterseydik aynı sayı
              ekranda iki kez dururdu; dahası alt çubuk üç şeyi
              (fiyat + Şimdi Al + Sepete Ekle) taşımaya çalıştığı
              için sıkışıktı.

              ⚠️ Bu değişiklik G10'u da çözüyor: yer açılınca
              "Sepete Ekle" butonu yazısıyla birlikte rahat sığıyor.
              İkon-only buton erişilebilirlik açısından zayıftı.

              ⚠️ Sıra: önce ÖDENECEK tutar, sonra eski fiyat.
              Ürün kartında ters (eski fiyat üstte) çünkü orada
              alt alta iki satır var ve göz yukarıdan aşağı okuyor;
              burada yan yanalar ve en soldaki önce okunuyor. İki
              yerde de son sözü ödenecek tutar söylüyor. */}
          <View style={styles.fiyatBlok}>
            <Text style={[styles.fiyat, indirimliMi && styles.fiyatIndirimli]}>
              {paraBicimle(urun.price)}
            </Text>

            {indirimliMi && (
              <Text style={styles.eskiFiyat}>{paraBicimle(eskiFiyat)}</Text>
            )}

            {indirimliMi && yuzde > 0 && (
              <Rozet tip="indirim" yazi={yuzdeYazisi(yuzde)} />
            )}
          </View>

          {/* ⭐ DEĞİŞTİ — EYLEMLER ARTIK SAYFA İÇİNDE, sabit alt
              çubukta değil. Altına gelen benzer ürün / kombin
              bölümleri için yer açıldı; butonlar kaydırılınca
              yukarıda kalıyor. */}
          <View style={styles.eylemBloku}>
            {/* ⭐ DEĞİŞTİ (5.1 + 5.2) — tek buton yerine iki eylem.

                SOLDA  : Şimdi Al   → sepete ekler + sepete gider
                SAĞDA  : AdetKontrolu → sepete ekle / − [n] +

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

        </View>

        {/* ÜRÜN AÇIKLAMASI */}
        {/*
          ⚠️ Açıklama boşsa bölüm HİÇ ÇİZİLMİYOR.

          "Açıklama yok" yazan boş bir kart koymak, kullanıcıya
          bilgi vermeyen bir kutu göstermek demek. "İşi olmayan
          ekran yapılmaz" — burada da işi olmayan kart yapılmıyor.
        */}
        {aciklama !== '' && (
          <View style={styles.aciklamaKart}>
            {/* ⭐ DEĞİŞTİ (GV/Faz 5.6) — KATLAMA KONTROLÜ BAŞLIK
                SATIRINA TAŞINDI.

                Eski hali: başlık düz yazıydı, metnin ALTINDA
                "Devamını gör / Daha az göster" bağlantısı vardı.
                Tasarımda başlık satırının kendisi bir düğme: solda
                "Ürün Açıklaması", sağda chevron.

                ⚠️ Alttaki bağlantı KALDIRILDI, ikisi birden
                bırakılmadı. İkisi de aynı state'i çeviriyordu; aynı
                işi yapan iki kontrol, 5.5'te "Adet" satırını
                elemekte kullanılan gerekçenin aynısıyla düşüyor.
                Kalan taraf başlık satırı çünkü hem tasarımın
                söylediği bu, hem de dokunma hedefi kartın tam
                genişliği — bağlantı yalnızca yazı kadardı.

                ⚠️ KAPALIYKEN METİN TAMAMEN GİZLENMİYOR, 4 satır
                görünüyor. Tasarımın chevron'u tam katlama ima
                ediyor ama tam katlarsak müşteri açıklamanın ilgisini
                çekip çekmediğini öğrenmek için dokunmak zorunda
                kalır. Dört satırlık önizleme çoğu soruyu zaten
                cevaplıyor. Davranış da bu fazın kuralı gereği
                değişmiyor: kapalı hâl 5.6 öncesindekiyle aynı.

                ⚠️ Kısa açıklamada satır basılabilir DEĞİL ve
                chevron yok — disabled, accessibilityRole 'header'e
                düşüyor. Ekran okuyucuya "burada bir düğme var" deyip
                hiçbir şey yapmamak, gören kullanıcıya ölü bir ok
                göstermekten daha kötü. */}
            <TouchableOpacity
              style={styles.aciklamaBaslikSatir}
              onPress={() => setAciklamaAcik(!aciklamaAcik)}
              disabled={!aciklamaUzun}
              activeOpacity={0.7}
              accessibilityRole={aciklamaUzun ? 'button' : 'header'}
              accessibilityState={aciklamaUzun ? { expanded: aciklamaAcik } : undefined}
            >
              <Text style={styles.aciklamaBaslik}>Ürün Açıklaması</Text>

              {/* ⚠️ Chevron anaRenk — tasarımdaki soluk gri değil.
                  Tasarım sisteminde ana renk "tıklanabilir" demek ve
                  bu satırın tıklanabilir olduğunu söyleyen tek işaret
                  bu ok. Gri bırakılsaydı süs gibi okunurdu. */}
              {aciklamaUzun && (
                <Ionicons
                  name={aciklamaAcik ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={renkler.anaRenk}
                />
              )}
            </TouchableOpacity>

            <Text
              style={styles.aciklamaMetin}

              /* Kapalıyken 4 satırda kes, açıkken sınır yok.
                 undefined vermek "sınırsız" demek — 0 vermek
                 metni tamamen gizlerdi. */
              numberOfLines={aciklamaAcik ? undefined : 4}
            >
              {aciklama}
            </Text>
          </View>
        )}

        {/* ⭐ YENİ — BENZER ÜRÜNLER */}
        <YatayListe
          baslik="Benzer Ürünler"
          urunler={benzerler}
          onUrunBas={(u) => navigation.push('UrunDetay', { urunId: u.id })}
        />

        {/* ⭐ YENİ — BUNU ALANLAR BUNU DA ALDI
            ⚠️ Kombinden AYRI bölüm: burada indirim yok, sadece
            sipariş verisinden çıkan bir öneri. */}
        <YatayListe
          baslik="Bunu alanlar bunu da aldı"
          urunler={birlikte}
          onUrunBas={(u) => navigation.push('UrunDetay', { urunId: u.id })}
        />

        {/* ⭐ YENİ — KOMBİNLER (indirimli setler) */}
        <View style={styles.kombinYeri}>
          <KombinSeridi
            kombinler={kombinler}
            onEkle={kombinSepeteEkle}
            onUrunBas={(u) => navigation.push('UrunDetay', { urunId: u.id })}
          />
        </View>

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

      {/* ⭐ DEĞİŞTİ (GV/Faz 5.3) — ALT BAR ARTIK SADECE EYLEM.

          Fiyat yukarı, içeriğe taşındı. Çubuk üç şey taşımaya
          çalışırken sıkışıktı; şimdi iki butonun ikisi de rahat.

          ⚠️ Tasarım "Sepete Ekle"yi SOLA, "Şimdi Al"ı sağa koyuyor;
          biz tersini koruduk. Sebep 5.2'de yazılı: asıl eylem sağda
          duruyor çünkü baş parmak oraya uzanıyor. Tasarımın
          sıralaması gerekçesiz, bizimki gerekçeli. */}
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

  /* ⭐ YENİ (GV/Faz 5.6) — başlık + chevron satırı.

     ⚠️ justifyContent 'space-between': chevron sağ kenara yapışıyor,
     böylece dokunma hedefi kartın TAM genişliği oluyor. Başlığa
     flex: 1 verip oku yanına koysaydık, uzun bir başlıkta ok
     ortalarda bir yerde kalırdı.

     ⚠️ paddingBottom var, paddingTop yok. Kartın kendi dolgusu
     zaten üstte duruyor; ikisini toplasaydık başlık aşağı kayar ve
     kartın üstünde ölü bir şerit kalırdı. Dokunma yüksekliği
     18px yazı + 12dp alt dolgu + kartın 16dp üst dolgusu ile
     40dp'yi geçiyor. */
  aciklamaBaslikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: bosluk.orta,
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 5.6) — 16/'600' yerine ölçek: 18/kalin.
     Bir alttaki "Değerlendirmeler" başlığıyla (YorumBolumu →
     bolumBaslik) AYNI değerler. İki bölüm başlığı yan yana iki
     farklı punto ile duruyordu; hangisinin daha önemli olduğu
     yanlışlıkla söyleniyordu — ikisi de eşit. */
  aciklamaBaslik: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 5.6) — elle yazılı 14/22 yerine token.
     Değerler AYNI (yazi.normal = 14, satir.orta = 22); görünüm
     değişmedi, kaynak değişti.

     ⚠️ satir.orta bilerek: satir.normal (20) paragraf metni için
     sıkışık. Yorum metni 20 kullanıyor ama orası birkaç cümle,
     burası tam sayfa açıklama olabiliyor. */
  aciklamaMetin: {
    fontSize: yazi.normal,
    lineHeight: satir.orta,
    color: renkler.yaziOrta,
  },
  /* ⭐ DEĞİŞTİ (GV/Faz 5.3) — elle yazılı 22 yerine ölçek basamağı.
     Değer AYNI (yazi.baslik = 22), yani görünüm değişmedi; ama artık
     ölçek değişirse başlık da onunla değişiyor. Fiyatı bir basamak
     yukarı aldığım için hiyerarşinin iki ucu da token'a bağlı olmalı:
     biri sabit sayı kalsaydı ikisi zamanla ayrışırdı. */
  urunAd: {
    fontSize: yazi.baslik,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.kucuk,
  },
  ortalamaSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ortalamaYazi: { fontSize: 15, fontWeight: '700', fontFamily: font.kalin, color: renkler.yaziKoyu, marginLeft: 6 },

  metaSatir: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  metaOge: { flexDirection: 'row', alignItems: 'center' },
  metaYazi: { fontSize: 13, color: renkler.yaziGri, marginLeft: 5 },
  metaNokta: { width: 3, height: 3, borderRadius: 2, backgroundColor: renkler.yaziGri, marginHorizontal: 10 },

  /* ⭐ DEĞİŞTİ (GV/Faz 5.3) — stokVar / stokAz / stokYok stilleri
     SİLİNDİ. Renk ve punto artık Rozet bileşeninin içinde; burada
     yalnızca rozetin nereye oturacağı kaldı.

     ⚠️ alignSelf: 'flex-start' sarmalayıcıda: Rozet kendi
     genişliğinde ama satırı kaplayan bir View içinde otursaydı
     altındaki fiyat bloğuyla arasındaki boşluk rozetin değil
     kabın boşluğu olurdu. */
  stokRozetYeri: {
    alignSelf: 'flex-start',
    marginBottom: bosluk.orta,
  },

  /* ⭐ YENİ (GV/Faz 5.3) — içerikteki fiyat bloğu.

     ⚠️ alignItems: 'baseline' — 'center' DEĞİL.
     22px fiyat ile 12px eski fiyat yan yana; ortalasaydık küçük
     yazı büyüğün ortasında asılı kalırdı. Taban çizgisine
     hizalanınca iki sayı aynı satırda yazılmış gibi okunuyor.

     ⚠️ flexWrap: dar ekranda uzun fiyat + eski fiyat + rozet
     sığmazsa alta kayıyor; sıkıştırıp kırpmıyor (G9). */
  fiyatBlok: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: bosluk.kucuk,
  },

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

  /* ⭐ DEĞİŞTİ — sabit alt çubuk değil, sayfa içinde bir blok.
     Kenarlık ve zemin kalktı: artık beyaz yaprağın içinde. */
  eylemBloku: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: bosluk.normal,
  },

  kombinYeri: {
    marginTop: bosluk.genis,
  },

  /* ⭐ SİLİNDİ (GV/Faz 5.3) — fiyatKutu.
     Alt çubukta artık fiyat yok; kutu da yok. Yerinde bırakmak,
     kimsenin kullanmadığı bir stili ilerideki okuyucuya "burada
     bir fiyat var" diye göstermek olurdu. */

  /* ⭐ DEĞİŞTİ (GV/Faz 5.3) — FİYAT İÇERİĞE TAŞINDI VE BÜYÜDÜ.

     22 → 30 (yazi.dev): fiyat artık alt çubukta bir yan bilgi
     değil, içeriğin en büyük rakamı. Tasarımda da başlıktan
     büyük — sayfadaki ilk cevap "kaça?" sorusuna.

     ⚠️ TURUNCU DEĞİL. Turuncu bu uygulamada EYLEM demek; alt
     çubukta "Şimdi Al" ve "Sepete Ekle" zaten turuncu. Fiyat da
     turuncu olsaydı hangisine basılacağı renkten okunamazdı. Bu
     kural bir kez ihlal edilmişti ve palet değişince görünür oldu.

     ⚠️ "Fiyat" etiketi yok: sayı zaten ₺ ile bitiyor. */
  fiyat: {
    fontSize: yazi.dev,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    lineHeight: satir.baslik,
    color: renkler.yaziKoyu,
  },

  /* Soluk + üstü çizili — ürün kartındaki dilin aynısı.
     Renk tek bilgi kanalı değil: çizgi renkten bağımsız olarak
     "bu tutar artık geçerli değil" diyor.

     ⚠️ Punto kucuk değil ORTA (15): kartta 12'ydi çünkü orada kart
     181dp ve fiyat 18px. Burada fiyat 30px; 12'lik bir eski fiyat
     onun yanında okunmayacak kadar küçük kalırdı. Ölçek aynı,
     basamak farklı. */
  eskiFiyat: {
    fontSize: yazi.orta,
    color: renkler.yaziGri,
    lineHeight: satir.orta,
    textDecorationLine: 'line-through',
  },

  /* ⚠️ İndirimli fiyat YEŞİL, turuncu değil — ürün kartıyla aynı
     kural, aynı token. */
  fiyatIndirimli: {
    color: renkler.basari,
  },
});