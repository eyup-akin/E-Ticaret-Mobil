import React, { useState, useCallback } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { useFavorite } from '../context/FavoriteContext';
import { useAuth } from '../context/AuthContext';
import GirisGerekliEkrani from '../components/GirisGerekliEkrani';
import AramaCubugu from '../components/AramaCubugu';
import BosDurum from '../components/BosDurum';
import Chip from '../components/Chip';   // ⭐ YENİ — sekmeler
import UrunKarti from '../components/UrunKarti';   // ⭐ ana sayfadaki kartın aynısı
import { UrunIzgarasiIskeleti } from '../components/Iskelet';
import { indirimBilgisi } from '../utils/indirim';   // ⭐ YENİ

/* ⭐ YENİ — FavoriteDto → UrunKarti'nın beklediği "urun" şekli.
 *
 * ⚠️ Bileşenin DIŞINA alındı: hem kart çizerken hem de indirim
 * süzgecinde lazım. İçeride kalsaydı süzgeç `item.eskiFiyat`'ı
 * kendi eliyle okur ve iki yerde iki farklı alan adı kullanılırdı —
 * DTO'da bir ad değiştiğinde biri sessizce çalışmaz hale gelirdi. */
function urunSekli(item) {
  return {
    id: item.productId,
    name: item.productName,
    price: item.productPrice,

    // ⭐ YENİ — indirim rozetinin çıkabilmesi için şart.
    // Bu alan FavoriteDto'da yoktu; ana sayfada rozet çıkarken
    // favorilerde çıkmıyordu.
    eskiFiyat: item.eskiFiyat,

    // ⭐ DEĞİŞTİ — ham stok yerine türetilmiş alanlar.
    // Sunucu FavoriteDto'da da ProductDto ile AYNI iki alanı
    // gönderiyor; böylece favori listesindeki kart ile ana
    // sayfadaki kart aynı bilgiyi aynı biçimde alıyor.
    stokDurumu: item.stokDurumu,
    kalanAdet: item.kalanAdet,

    mainImageUrl: item.productImageUrl,
  };
}

export default function FavorilerimEkrani({ navigation }) {
  const { token } = useAuth();
  const { renkler } = useTema();
  const { favoriMi, favoriIdler } = useFavorite();
  const styles = stilOlustur(renkler);

  const [favoriler, setFavoriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  /* ⭐ YENİ — SEKME: 'tumu' | 'indirim'
   *
   * ⚠️ SÜZGEÇ CİHAZDA, SUNUCUDA DEĞİL — bilerek.
   *
   * Favori listesi zaten tamamı tek istekte geliyor (sayfalama yok)
   * ve indirim bilgisi her satırda mevcut. Sunucuya ikinci bir uç
   * açsaydık, "indirimde mi" kuralı dördüncü kez yazılırdı ve iki
   * sekme arasında geçiş her seferinde ağ isteği isterdi.
   *
   * ⚠️ Kural yine de ELLE YAZILMIYOR: `indirimBilgisi` çağrılıyor —
   * rozeti çizen fonksiyonun ta kendisi. Böylece "rozet var ama
   * sekmede yok" ya da tersi bir tutarsızlık imkânsız. */
  const [sekme, setSekme] = useState('tumu');

  // ⭐ YENİ (GV/Faz 9.4)
  const [agHatasi, setAgHatasi] = useState(false);

  async function favorileriGetir() {
    try {
      const veri = await apiGet('/favorites');
      setFavoriler(veri);
      setAgHatasi(false);
    } catch (hata) {
      // ⭐ DEĞİŞTİ (GV/Faz 9.4) — sessiz yutma bitti. Eskiden ekran
      // "Henüz favorin yok" diyordu; favorileri duruyor, ulaşamayan
      // biziz. Yanlış bilgi, eksik bilgiden tehlikelidir.
      console.log('Favoriler alınamadı:', hata.message);
      setFavoriler([]);
      setAgHatasi(true);
    } finally {
      setYukleniyor(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      favorileriGetir();
    }, [token])
  );

  // Karttan kalbe basıp çıkarılanları anında gizle + arama süzgeci.
  const gorunenler = favoriler
    .filter((f) => favoriMi(f.productId))
    .filter((f) =>
      aramaMetni ? f.productName.toLowerCase().includes(aramaMetni.toLowerCase()) : true
    );

  /* ⭐ YENİ — indirimdeki favori sayısı.
   *
   * ⚠️ Sayı ARAMADAN ÖNCEKİ listeden değil, aramadan SONRAKİ
   * listeden hesaplanıyor: sekme etiketi ekranda o an görülecek
   * kart sayısını söylemeli. "İndirimdekiler (7)" yazıp 2 kart
   * göstermek, sayının yalan söylemesi olurdu. */
  const indirimdekiler = gorunenler.filter((f) => indirimBilgisi(urunSekli(f)).indirimliMi);

  const listelenecek = sekme === 'indirim' ? indirimdekiler : gorunenler;

  function kartCiz({ item }) {
    return (
      <UrunKarti
        urun={urunSekli(item)}
        onPress={() =>
          navigation.navigate('AnaSayfa', {
            screen: 'UrunDetay',
            params: { urunId: item.productId },
          })
        }
      />
    );
  }

  if (!token) {
    return (
      <GirisGerekliEkrani
        ikon="heart-outline"
        baslik="Favorilerini görmek için giriş yap"
        aciklama="Beğendiğin ürünleri kaydedip istediğin zaman kolayca bulabilirsin."
      />
    );
  }

  /* ⭐ DEĞİŞTİ (GV/Faz 9.1) — çark yerine ızgara iskeleti.
     Bu ekranın içeriği iki sütunluk kart ızgarası; iskelet de onu
     taklit ediyor ki yükleme bitince yerleşim zıplamasın. */
  if (yukleniyor) {
    return (
      <SafeAreaView style={styles.kapsayici} edges={['top']}>
        <View style={styles.ustBar}>
          <Text style={styles.ustBaslik}>Favorilerim</Text>
        </View>
        <UrunIzgarasiIskeleti adet={4} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
            <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
          </TouchableOpacity>
        )}
        <Text style={styles.ustBaslik}>Favorilerim</Text>
      </View>

      {favoriler.length > 0 && (
        <>
          <View style={styles.aramaYeri}>
            <AramaCubugu
              value={aramaMetni}
              onChangeText={setAramaMetni}
              onSubmit={() => {}}
              placeholder="Favorilerimde ara..."
            />
          </View>

          {/* ⭐ YENİ — SEKMELER
              ⚠️ `Rozet` DEĞİL `Chip`: Rozet tıklanamaz bir durum
              etiketi, bu ise seçim. Tasarım sisteminde bu ayrım
              açıkça yazılı. Siparişlerim'deki durum şeridi de aynı
              bileşeni kullanıyor.

              ⚠️ İndirim sekmesi SAYI GÖSTERİYOR ama sıfırken de
              çiziliyor ve basılabiliyor: "İndirimdekiler (0)"
              müşteriye "favorilerinde indirimde ürün yok" der,
              sekmenin hiç olmaması ise "böyle bir şey var mı?"
              sorusunu doğurur. (Siparişlerim'de alınan kararın
              aynısı — orada 0 olan çip pasif çiziliyor.) */}
          <View style={styles.sekmeSeridi}>
            <Chip
              etiket={`Tümü (${gorunenler.length})`}
              secili={sekme === 'tumu'}
              onBas={() => setSekme('tumu')}
            />

            <Chip
              etiket={`İndirimdekiler (${indirimdekiler.length})`}
              secili={sekme === 'indirim'}
              pasif={indirimdekiler.length === 0}
              onBas={() => setSekme('indirim')}
            />
          </View>
        </>
      )}

      <FlatList
        data={listelenecek}
        keyExtractor={(item) => item.id.toString()}
        renderItem={kartCiz}
        numColumns={2}
        columnWrapperStyle={styles.satir}
        contentContainerStyle={styles.liste}
        extraData={favoriIdler}
        ListEmptyComponent={
          /* ⭐ DEĞİŞTİ (GV/Faz 7.8) — boş durum ortak bileşene geçti.

             ⚠️ İKİ FARKLI BOŞLUK, İKİ FARKLI CEVAP. Hiç favori yoksa
             müşteriyi ürünlere yolluyoruz; arama sonuç vermediyse
             gidilecek bir yer yok, sadece aramayı değiştirmesi gerek —
             o yüzden orada eylem butonu çizilmiyor. Tek bir metin
             göstermek ikisini aynı şey sanmak olurdu.

             ⭐ EKLENDİ (GV/Faz 9.4) — ÜÇÜNCÜ boşluk: bağlanamadık.
             O da ayrı bir cevap istiyor (tekrar dene). */
          agHatasi ? (
            <BosDurum
              ikon="cloud-offline-outline"
              baslik="Bağlanamadık"
              aciklama="Favorilerin yüklenemedi. İnternet bağlantını kontrol edip tekrar dene."
              eylemYazisi="Tekrar Dene"
              onEylem={() => { setYukleniyor(true); favorileriGetir(); }}
            />
          ) : favoriler.length === 0 ? (
            <BosDurum
              ikon="heart-outline"
              baslik="Henüz favorin yok"
              aciklama="Beğendiğin ürünlerin kalbine dokun, hepsi burada toplansın."
              eylemYazisi="Ürünlere Göz At"
              onEylem={() => navigation.navigate('AnaSayfa', { screen: 'AnaSayfaMain' })}
            />
          ) : sekme === 'indirim' ? (
            /* ⭐ YENİ — DÖRDÜNCÜ boşluk: favorin var ama indirimde
               olan yok. Bu bir hata da, boş bir liste de değil —
               beklenen ve geçici bir durum. Gidilecek bir yer
               önermiyoruz çünkü müşterinin yapabileceği bir şey
               yok; indirimi mağaza başlatır. */
            <BosDurum
              ikon="pricetag-outline"
              baslik="Favorilerinde indirimde ürün yok"
              aciklama="Beğendiğin bir ürün indirime girdiğinde burada görünecek."
            />
          ) : (
            <BosDurum
              ikon="search-outline"
              baslik="Eşleşen ürün bulunamadı"
              aciklama="Farklı bir kelimeyle aramayı deneyebilirsin."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },

  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: renkler.arkaPlan,
  },

  /* ⭐ DEĞİŞTİ (2026-08-12) — ÜST BAR ARTIK BEYAZ BİR ŞERİT DEĞİL.
     Kart zemini + alt çizgi, sayfanın kırık-beyaz zemininin üstünde
     yabancı duran bir "araç çubuğu" gibi görünüyordu; uygulamanın
     geri kalanında (Sepetim, Hesabım) başlık doğrudan sayfa zemininde
     duruyor. Şerit kalktı, başlık sayfaya oturdu.

     ⚠️ Geri oku YALNIZCA stack içinden gelindiğinde çiziliyor
     (canGoBack). Favorilerim hem bir sekme kökü hem de Hesabım
     menüsünden açılan bir alt ekran — G2 sekme kökünde geri oku
     istemiyor, alt ekranda ise gerekiyor. Koşul ikisini de doğru
     yapıyor. */
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sayfaKenari,
    paddingTop: bosluk.kucuk,
    paddingBottom: bosluk.mikro,
  },

  /* ⚠️ Geri oku MUTLAK KONUMDA: akışta olsaydı başlığı sağa iter ve
     "ortalı başlık" oku olan/olmayan ekranda iki farklı yerde
     dururdu. Ortalama, okun varlığından bağımsız olmalı. */
  geriButon: {
    position: 'absolute',
    left: sayfaKenari,
    zIndex: 1,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  ustBaslik: {
    flex: 1,
    textAlign: 'center',
    fontSize: yazi.baslik,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  /* ⭐ DEĞİŞTİ (2026-08-12) — üst dolgu KALDIRILDI.
     ⚠️ Arama çubuğu kendi içinde 8dp dikey dolgu taşıyor; buradaki
     12 onun üstüne binince başlık ile kutu arasında 20dp'lik ölü bir
     şerit oluşuyordu. Sepet ekranında da aynı sebeple aynı düzeltme
     yapıldı — iki ekran aynı bileşeni aynı yanlış varsayımla
     kullanıyordu. */
  aramaYeri: {
    paddingHorizontal: sayfaKenari,
  },

  /* ⭐ YENİ — sekme şeridi.
     ⚠️ Yatay ScrollView DEĞİL, düz View: yalnızca iki çip var ve
     ikisi de her ekrana sığıyor. Kaydırılabilir şerit yapmak,
     kaydırılacak bir şey olmadığı halde dikey akışta esneme
     tuzağını (Siparişlerim'de yaşanan) davet ederdi. */
  sekmeSeridi: {
    flexDirection: 'row',
    gap: bosluk.kucuk,
    paddingHorizontal: sayfaKenari,
    paddingTop: bosluk.kucuk,
  },

  liste: {
    padding: sayfaKenari,
    flexGrow: 1,
  },

  satir: {
    justifyContent: 'space-between',
  },
});
