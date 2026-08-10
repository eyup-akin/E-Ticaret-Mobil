import React, { useState, useEffect } from 'react';
import { font } from '../theme/olculer';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost, apiDelete } from '../services/api';
import { useFavorite } from '../context/FavoriteContext';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';
import { useAuth } from '../context/AuthContext';
import { paraBicimle } from '../utils/bicimlendir';
// ⭐ YENİ (5.1) — ortak adet kontrolü
import AdetKontrolu from '../components/AdetKontrolu';
import UrunGaleri from '../components/UrunGaleri';
import YorumBolumu from '../components/YorumBolumu';
import Yildizlar from '../components/Yildizlar';

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

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      {/* ÜST BAR */}
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik} numberOfLines={1}>Ürün Detayı</Text>
      </View>

      <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
        {/* GALERİ + FAVORİ KALBİ */}
        <UrunGaleri
          resimler={urun.images || []}
          urunAdi={urun.name}
          favori={favori}
          onKalp={favoriBasildi}
          favoriRenk={renkler.favoriRenk}
        />

        {/* BİLGİ KARTI */}
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

      {/* ALT BAR: FİYAT + SEPETE EKLE */}
      <View style={styles.altBar}>
        <View style={styles.fiyatKutu}>
          <Text style={styles.fiyatEtiket}>Fiyat</Text>
          <Text style={styles.fiyat}>{paraBicimle(urun.price)}</Text>
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
  ustBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: renkler.kenarlik },
  geriButon: { marginRight: 12 },
  ustBaslik: { fontSize: 18, fontWeight: '600', fontFamily: font.yari, color: renkler.yaziKoyu },
  icerik: { paddingBottom: 24 },

  bilgiKart: {
    backgroundColor: renkler.kartArka,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },

  // ⭐ YENİ — açıklama bölümü
  //
  // bilgiKart ile AYNI görsel kabuk (arka plan, kenarlık, yuvarlaklık,
  // kenar boşlukları). Aynı ekranda iki farklı kart görünümü olmasın —
  // "asimetrik boşluk bozuk, simetrik boşluk kasıtlı okunur."
  aciklamaKart: {
    backgroundColor: renkler.kartArka,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },

  aciklamaBaslik: {
    fontSize: 16,
    fontWeight: '600', fontFamily: font.yari,
    fontFamily: font.yari,
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
    fontFamily: font.yari,
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
    fontFamily: font.kalin,
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
    fontFamily: font.kalin,
  },

  yorumKart: {
    backgroundColor: renkler.kartArka,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },

  altBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },
  fiyatKutu: { marginRight: 14 },
  fiyatEtiket: { fontSize: 12, color: renkler.yaziGri },
  fiyat: { fontSize: 20, fontWeight: 'bold', fontFamily: font.kalin, color: renkler.anaRenk },
});