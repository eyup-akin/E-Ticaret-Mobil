import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, FlatList, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { bosluk, sayfaKenari } from '../theme/olculer';
import {
  bosFiltre, varsayilanSiralama, filtreSorgusuKur, aktifFiltreSayisi,
} from '../services/urunFiltresi';
import { sonGezilenleriOku } from '../services/sonGezilenler';
import AramaCubugu from '../components/AramaCubugu';
import UrunKarti from '../components/UrunKarti';
import UrunKartiKompakt from '../components/UrunKartiKompakt';
import SiralamaSeridi from '../components/SiralamaSeridi';
import FiltrePaneli from '../components/FiltrePaneli';
import BannerSeridi from '../components/BannerSeridi';
import KategoriSeridi from '../components/KategoriSeridi';
import BolumBasligi from '../components/BolumBasligi';
import BosDurum from '../components/BosDurum';
import SanaOzelSerit from '../components/SanaOzelSerit';   // ⭐ YENİ (B12)
import { UrunIzgarasiIskeleti } from '../components/Iskelet';

// ============================================================
//  ANA SAYFA — vitrin
//
//  Sıra: arama → banner → kategoriler → son gezdiklerin →
//        tüm ürünler (sıralama şeridi + ızgara)
//
//  ⚠️ HAMBURGER MENÜSÜ KALDIRILDI.
//  Kategorilere erişim artık kategori şeridinin sonundaki "Tümü"
//  karosundan. Hamburger, içinde tek bir şey olan bir menüyü
//  açıyordu; şerit hem daha hızlı hem kategorileri GÖRÜNÜR
//  kılıyor.
//
//  ⚠️ ÜST BÖLÜMLER FlatList'İN "ListHeaderComponent"İNDE.
//
//  Izgara bir FlatList (numColumns=2) ve onu bir ScrollView'in
//  içine koysaydık React Native uyarı verirdi: iç içe aynı yönde
//  iki kaydırıcı, sanallaştırmayı bozar ve tüm kartlar bir anda
//  çizilir. Bölümleri başlık bileşenine koymak, tek bir
//  kaydırıcıyla çalışmak demek.
//
//  ⚠️ ARAMA ÇUBUĞU BAŞLIĞIN İÇİNDE DEĞİL, DIŞINDA.
//  İçinde olsaydı liste her yenilendiğinde başlık yeniden
//  render olur ve yazarken KLAVYE ODAĞI DÜŞERDİ. Ayrıca
//  yukarıda sabit kalması zaten doğru davranış.
// ============================================================
export default function AnaSayfaEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // ⭐ YENİ (GV/Faz 9.4) — istek patladı mı?
  //
  // "Boş liste" ile "bağlanamadık" AYRI durumlar ve ayrı cevapları
  // var: birinde filtreyi gevşetmek, diğerinde tekrar denemek
  // gerekiyor. Tek bir boş listeyle ikisini birden anlatmak,
  // müşteriye çözemeyeceği bir yol göstermek olurdu.
  const [agHatasi, setAgHatasi] = useState(false);
  const [aramaMetni, setAramaMetni] = useState('');
  const [uygulananArama, setUygulananArama] = useState('');

  const [filtre, setFiltre] = useState(bosFiltre);
  const [siralama, setSiralama] = useState(varsayilanSiralama);
  const [panelAcik, setPanelAcik] = useState(false);

  // ⭐ YENİ (GV/Faz 4)
  const [kategoriler, setKategoriler] = useState([]);
  const [sonGezilenler, setSonGezilenler] = useState([]);

  // ---- FİLTRELEYİNCE ÜRÜNLERE KAYDIRMA ----
  //
  // ⚠️ Filtre bir SORU değil, bir CEVAP isteği. Müşteri filtreyi
  // uyguladıktan sonra ekranda hâlâ banner, kategoriler ve son
  // gezilenler duruyordu; sonucu görmek için kendi eliyle aşağı
  // kaydırması gerekiyordu. Filtreleme yaptığı an "Tüm Ürünler"
  // bölümü ekranın tepesine alınıyor.
  //
  // ⚠️⚠️ HEDEF KONUM SAKLANMIYOR, KAYDIRMA ANINDA ÖLÇÜLÜYOR.
  //
  // Üç yol denendi, üçü de yanlış yere götürdü — hepsinin kusuru
  // aynı: ölçü ÖNCEDEN alınıyordu ve kaydırma anında bayattı.
  //   1) Bölümün `onLayout.y`'si — react-native-web'de onLayout bir
  //      ResizeObserver; eleman YER DEĞİŞTİRİNCE tetiklenmiyor,
  //      yalnızca BOYUTU değişince. Banner ölçülüp yüksekliği
  //      oluşunca kayıtlı y bayat kaldı (hedef 638 iken 113'e kaydı).
  //   2) "Başlık yüksekliği eksi bölüm yüksekliği" — ilk filtrede
  //      başlık yüksekliği henüz oturmamıştı; ikinci filtrede doğru
  //      çalışan kaydırma birincisinde 16px'te kaldı.
  //   3) `scrollToIndex` — listenin kendi hücre ölçümlerine
  //      dayanıyor; web'de o ölçümler hazır olmadığı için kaydırma
  //      hiç olmadı, üstelik sessizce.
  //
  // Şimdiki yol ölçüyü SAKLAMIYOR: `measureInWindow` iki elemanın da
  // o andaki ekran konumunu veriyor ve aradaki fark, listenin ne
  // kadar kaydırılması gerektiğini doğrudan söylüyor. İki platformda
  // da aynı anlama gelen tek ölçüm API'si bu.
  const listeRef = useRef(null);
  const listeKabiRef = useRef(null);
  const urunBolumuRef = useRef(null);

  // Kaydırmanın o anki konumu. Fark hesabı buna eklenecek.
  const kaydirmaY = useRef(0);

  // İlk açılışta kaydırma YOK — filtre boşken efekt yine de bir kez
  // çalışıyor ve o an kaydırmak, uygulamayı vitrini atlayarak açmak
  // olurdu.
  const ilkFiltreMi = useRef(true);

  // Kaydırma isteği burada bekliyor: liste hâlâ yükleniyorken
  // kaydırsaydık içerik kısa olduğu için hedef konum kırpılır
  // (scrollToOffset sınırı aşamaz) ve ürünler geldiğinde ekran
  // yanlış yerde kalırdı.
  const kaydirmaBekliyor = useRef(false);

  useEffect(() => {
    if (ilkFiltreMi.current) {
      ilkFiltreMi.current = false;
      return;
    }
    kaydirmaBekliyor.current = true;
  }, [filtre]);

  useEffect(() => {
    if (yukleniyor || !kaydirmaBekliyor.current) return;

    kaydirmaBekliyor.current = false;
    urunlereKaydir();
  }, [yukleniyor]);

  /* Ürün bölümünü ekranın tepesine getir.
   *
   * ⚠️ İç içe iki ölçüm: `measureInWindow` geri çağrımlı çalışıyor
   * (ölçüm yerel iş parçacığında değil). Dışta listenin kabı, içte
   * ürün bölümü ölçülüyor; aradaki fark bölümün listenin görünen
   * alanına göre nerede durduğunu veriyor ve mevcut kaydırmaya
   * eklenince mutlak hedef çıkıyor.
   *
   * ⚠️ Hedef kırpılırsa (aşağıda o kadar içerik yoksa) liste sona
   * kadar gidiyor; ayrıca sınırlamaya gerek yok, scrollToOffset
   * zaten kendisi kırpıyor. */
  function urunlereKaydir() {
    const kap = listeKabiRef.current;
    const bolum = urunBolumuRef.current;
    if (!kap || !bolum) return;

    kap.measureInWindow((kx, kapY) => {
      bolum.measureInWindow((bx, bolumY) => {
        const hedef = Math.max(0, kaydirmaY.current + (bolumY - kapY));
        listeRef.current?.scrollToOffset({ offset: hedef, animated: true });
      });
    });
  }

  // ---- ÜRÜN IZGARASI ----
  async function urunleriGetir(arama, aktifFiltre, aktifSiralama) {
    try {
      setYukleniyor(true);
      setAgHatasi(false);

      const yol = '/products' + filtreSorgusuKur(aktifFiltre, {
        arama,
        siralama: aktifSiralama,
      });

      const veri = await apiGet(yol);
      setUrunler(veri);
    } catch (hata) {
      // ⚠️⚠️ BURASI ESKİDEN SESSİZCE YUTUYORDU (⭐ DEĞİŞTİ 9.4)
      //
      // İstek patladığında `urunler` eski hâlinde ya da boş kalıyor,
      // ekran da "Ürün bulunamadı" yazıyordu. Bu YALAN: sunucuya
      // ulaşamamakla mağazada ürün olmaması aynı şey değil ve
      // müşteri, bizim hatamızı "burada bir şey yok" diye okuyordu.
      // Kural nettir: yanlış bilgi, eksik bilgiden tehlikelidir.
      console.log('Ürünler alınamadı:', hata.message);
      setUrunler([]);
      setAgHatasi(true);
    } finally {
      setYukleniyor(false);
    }
  }

  // ⚠️ TEK EFEKT, ÜÇ TETİKLEYİCİ. Arama, filtre ve sıralama için
  // ayrı efektler yazsaydık ikisi aynı anda değiştiğinde iki
  // istek birden giderdi ve hangisinin cevabı sonra dönerse ekran
  // ona göre kalırdı.
  useEffect(() => {
    urunleriGetir(uygulananArama, filtre, siralama);
  }, [uygulananArama, filtre, siralama]);

  // ---- KATEGORİLER — bir kez ----
  useEffect(() => {
    let iptal = false;

    (async () => {
      try {
        const veri = await apiGet('/categories');
        if (!iptal) setKategoriler(veri);
      } catch (hata) {
        // ⚠️ Kategori şeridi çizilemezse ana sayfa yine çalışıyor:
        // bölüm hiç görünmüyor, ürün ızgarası yerinde duruyor.
        console.log('Kategoriler alınamadı:', hata.message);
      }
    })();

    return () => { iptal = true; };
  }, []);

  // ---- SON GEZİLENLER ----
  //
  // ⚠️ useFocusEffect — useEffect DEĞİL.
  //
  // Müşteri ürün detayına gidip geri döndüğünde şerit güncel
  // olmalı. useEffect yalnızca ekran ilk kurulduğunda çalışır;
  // sekmeler arası dönüşte ana sayfa bileşeni bellekte duruyor ve
  // efekt bir daha tetiklenmiyor. Sonuç: az önce baktığın ürün
  // şeritte görünmüyordu.
  //
  // ⚠️ İD SIRASI SUNUCUDAN GELMİYOR — burada geri kuruluyor.
  // Sunucuya "şu id'leri getir" diyoruz, o da veritabanı sırasında
  // döndürüyor. "En son bakılan başta" sırası cihazdaki listede;
  // gelen ürünleri o listeye göre diziyoruz. Sunucudan sıra
  // istemek (SQL'de CASE WHEN zinciri) hem çirkin hem gereksizdi.
  useFocusEffect(
    useCallback(() => {
      let iptal = false;

      (async () => {
        const idler = await sonGezilenleriOku();

        if (idler.length === 0) {
          if (!iptal) setSonGezilenler([]);
          return;
        }

        try {
          const veri = await apiGet('/products?idler=' + idler.join(','));
          if (iptal) return;

          // Cihazdaki sıraya diz. Silinmiş/pasifleşmiş ürünler
          // sunucudan hiç gelmiyor ve listeden kendiliğinden
          // düşüyor — ayrıca temizlemeye gerek yok.
          const sirali = idler
            .map((id) => veri.find((u) => u.id === id))
            .filter(Boolean);

          setSonGezilenler(sirali);
        } catch (hata) {
          if (!iptal) setSonGezilenler([]);
          console.log('Son gezilenler alınamadı:', hata.message);
        }
      })();

      return () => { iptal = true; };
    }, [])
  );

  /* ---- SANA ÖZEL (B12) ----  ⭐ YENİ (2026-08-12)
   *
   * ⚠️ ÖNERİ MOTORU YOK VE UYDURULMUYOR. Mantık tek cümleyle
   * anlatılabilir olmalı, çünkü ekranda da öyle yazıyor ("Son
   * baktıklarına benzeyen ürünler"):
   *
   *   son gezilen ürünlerin KATEGORİLERİ → aynı kategorideki,
   *   henüz bakılmamış ürünler
   *
   * B12 aylarca çizilmemişti çünkü alternatifi sahte bir liste
   * göstermekti ("yanlış sayı, eksik sayıdan tehlikelidir"). Bu
   * mantık sahte değil: müşterinin kendi davranışından çıkıyor.
   *
   * ⚠️ EK İSTEK ATILMIYOR. Öneriler zaten yüklü olan `urunler`
   * listesinden süzülüyor; ayrı bir uç açsaydık yol haritası
   * 7.4'teki "bölüm başına ayrı istek yok" kuralı kırılırdı.
   *
   * ⚠️ FİLTRE VEYA ARAMA AKTİFKEN BÖLÜM YOK. O durumda `urunler`
   * müşterinin sorduğu sorunun cevabı; içinden öneri süzmek
   * "aradığın şeyin içinden sana özel" gibi tuhaf bir sonuç verir
   * ve zaten çoğu zaman boş çıkar.
   *
   * ⚠️ Son gezilenlerin KENDİSİ öneriye girmiyor: müşteri onları
   * bir üstteki şeritte zaten görüyor. */
  const sanaOzel = useMemo(() => {
    if (aktifFiltreSayisi(filtre) > 0 || uygulananArama) return [];
    if (sonGezilenler.length === 0 || urunler.length === 0) return [];

    const gezilenIdler = new Set(sonGezilenler.map((u) => u.id));

    const ilgiliKategoriler = new Set(
      sonGezilenler.map((u) => u.categoryId).filter((k) => k != null)
    );

    if (ilgiliKategoriler.size === 0) return [];

    return urunler
      .filter((u) => ilgiliKategoriler.has(u.categoryId) && !gezilenIdler.has(u.id))
      .slice(0, 10);
  }, [urunler, sonGezilenler, filtre, uygulananArama]);

  // ---- KATEGORİYE BASILINCA ----
  //
  // ⚠️ Panelden farklı olarak ANINDA uygulanıyor. Panelde birden
  // çok ayar yapılıyor ve "göster"e basılıyor; burada tek dokunuş
  // var ve beklenti "tak diye o kategori gelsin".
  //
  // ⚠️⚠️ ŞERİT TEK SEÇİM, PANEL ÇOKLU SEÇİM. (⭐ DEĞİŞTİ 2026-08-12)
  //
  // Önce buradaki dokunuş da panelinki gibi seçime EKLİYORDU:
  // Elektronik'e sonra Giyim'e basınca ikisi birden görünüyordu.
  // Şeritte bu yanlış çünkü dokunuş bir kısayol — "şimdi bunu
  // göster" demek. Müşteri ikinci kategoriye bastığında niyeti
  // "ikisini birlikte gör" değil, "fikrimi değiştirdim".
  //
  // Birden çok kategoriyi bilinçli olarak birleştirmek isteyen
  // filtre panelini açıyor; orada seçim taslakta birikiyor ve ne
  // yaptığı ekranda yazıyor. İki farklı niyet, iki farklı yer.
  //
  // ⚠️ Panel birden çok kategori seçtiyse şerit onların hepsini
  // seçili gösterir — ekran duruma yalan söylemez. Şeritten bir
  // dokunuş o birleşimi tek kategoriye indirir.
  //
  // ⚠️ Seçili olana tekrar basmak seçimi KALDIRIYOR: aynı karoya
  // basıp filtreden çıkmak, panele girmeden geri dönmenin tek yolu.
  //
  // ⚠️ Fiyat/puan/stok filtrelerine DOKUNULMUYOR. Bu karo bir
  // kategori seçici, "her şeyi sıfırla" düğmesi değil; müşterinin
  // az önce kurduğu fiyat aralığını habersiz silmek olurdu.
  const kategoriSec = useCallback((id) => {
    setFiltre((onceki) => {
      const tekSeciliBuMu =
        onceki.kategoriler.length === 1 && onceki.kategoriler[0] === id;

      return {
        ...onceki,
        kategoriler: tekSeciliBuMu ? [] : [id],
      };
    });
  }, []);

  const kartCiz = useCallback(
    ({ item }) => (
      <UrunKarti
        urun={item}
        onPress={() => navigation.navigate('UrunDetay', { urunId: item.id })}
      />
    ),
    [navigation]
  );

  // ---- ÜST BÖLÜMLER ----
  const basliklar = (
    <View>
      <BannerSeridi
        onKampanyaBas={(k) =>
          navigation.navigate('KampanyaDetay', { kampanyaId: k.id })
        }
      />

      <View style={styles.bolum}>
        <BolumBasligi
          baslik="Kategoriler"
          onTumunuBas={() => navigation.navigate('Kategoriler')}
        />
        <KategoriSeridi
          kategoriler={kategoriler}
          seciliIdler={filtre.kategoriler}
          onSec={kategoriSec}
          onTumuBas={() => navigation.navigate('Kategoriler')}
        />
      </View>

      {/* ⚠️ Geçmiş yoksa bölüm TAMAMEN yok — boş yer tutucu ya da
          "henüz ürün gezmedin" yazısı değil. İlk kez açan
          müşteriye söylenecek bir şey yok; boş bir bölüm sadece
          ekranı uzatırdı. */}
      {sonGezilenler.length > 0 && (
        <View style={styles.bolum}>
          <BolumBasligi baslik="Son gezdiğin ürünler" />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kompaktSerit}
            style={styles.kompaktSeritKap}
            directionalLockEnabled
          >
            {sonGezilenler.map((u) => (
              <UrunKartiKompakt
                key={u.id}
                urun={u}
                onPress={() => navigation.navigate('UrunDetay', { urunId: u.id })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ⭐ YENİ (B12) — SANA ÖZEL.
          Yeri bilinçli: son gezdiklerinin HEMEN ARDINDAN, çünkü
          içeriği doğrudan ondan türüyor. "Tüm Ürünler"den sonra
          olsaydı sonsuz ızgaranın altında kaybolurdu. */}
      {sanaOzel.length > 0 && (
        <View style={styles.bolum}>
          <SanaOzelSerit
            urunler={sanaOzel}
            onUrunBas={(u) => navigation.navigate('UrunDetay', { urunId: u.id })}
          />
        </View>
      )}

      {/* ⚠️ collapsable={false} — Android'de yalnızca yerleşim için
          duran View'lar yerel ağaçtan SİLİNİYOR; silinen View
          ölçülemez ve `measureInWindow` sessizce hiç dönmez. */}
      <View style={styles.bolum} ref={urunBolumuRef} collapsable={false}>
        <BolumBasligi baslik="Tüm Ürünler" />
        <SiralamaSeridi secili={siralama} onSec={setSiralama} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <AramaCubugu
        value={aramaMetni}
        onChangeText={setAramaMetni}
        onSubmit={(metin) => setUygulananArama(metin)}
        onFiltreBas={() => setPanelAcik(true)}
        aktifFiltre={aktifFiltreSayisi(filtre)}
      />

      {/* ⚠️ Liste bir View'ın içinde: `measureInWindow` bir HOST
          bileşeni istiyor, FlatList ise değil. Kabın kendisi
          ölçülüyor ve listenin görünen alanının nerede başladığını
          söylüyor. collapsable={false} yine Android için. */}
      <View style={styles.listeKap} ref={listeKabiRef} collapsable={false}>
      <FlatList
        ref={listeRef}
        data={yukleniyor ? [] : urunler}
        keyExtractor={(item) => item.id.toString()}
        renderItem={kartCiz}
        numColumns={2}
        columnWrapperStyle={styles.satir}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={basliklar}
        showsVerticalScrollIndicator={false}

        /* ⚠️ Tek işi kaydırma konumunu bir ref'e yazmak — state'e
           yazsaydık her karede yeniden render olurdu ve ekranda
           konuma bağlı değişen hiçbir şey yok. */
        onScroll={(olay) => { kaydirmaY.current = olay.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
        /* ⭐ DEĞİŞTİ (GV/Faz 9) — ÜÇ AYRI DURUM, ÜÇ AYRI CEVAP.

           Eskiden ikisi vardı: dönen çark ve tek satırlık bir yazı.
           Çark ne geleceğini söylemiyordu, yazı ise ağ hatasını da
           "ürün yok" diye gösteriyordu.

           · yükleniyor  → ızgara iskeleti (ne geleceğini gösterir)
           · ağ hatası   → "Bağlanamadık" + Tekrar Dene
           · gerçekten boş → filtre varsa "gevşet", yoksa "ürün yok" */
        ListEmptyComponent={
          yukleniyor ? (
            <UrunIzgarasiIskeleti />
          ) : agHatasi ? (
            <BosDurum
              ikon="cloud-offline-outline"
              baslik="Bağlanamadık"
              aciklama="Ürünler yüklenemedi. İnternet bağlantını kontrol edip tekrar dene."
              eylemYazisi="Tekrar Dene"
              onEylem={() => urunleriGetir(uygulananArama, filtre, siralama)}
            />
          ) : aktifFiltreSayisi(filtre) > 0 ? (
            /* ⚠️ Burada eylem butonu VAR çünkü gidilecek bir yer var:
               filtreyi temizlemek. Aramada sonuç yoksa (aşağıdaki
               dal) buton yok — 7.8'de favorilerde verilen karar. */
            <BosDurum
              ikon="funnel-outline"
              baslik="Sonuç bulunamadı"
              aciklama="Seçtiğin filtrelere uyan ürün yok. Filtreleri gevşetmeyi dene."
              eylemYazisi="Filtreleri Temizle"
              onEylem={() => setFiltre(bosFiltre)}
            />
          ) : (
            <BosDurum
              ikon="search-outline"
              baslik="Ürün bulunamadı"
              aciklama={
                uygulananArama
                  ? 'Aramana uyan bir ürün yok. Farklı kelimelerle tekrar dene.'
                  : 'Şu an gösterilecek bir ürün yok.'
              }
            />
          )
        }
      />
      </View>

      <FiltrePaneli
        acik={panelAcik}
        filtre={filtre}
        arama={uygulananArama}
        onKapat={() => setPanelAcik(false)}
        onUygula={(yeni) => { setFiltre(yeni); setPanelAcik(false); }}
      />
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },

  /* ⭐ DEĞİŞTİ — bölüm arası 24 → 16.
     ⚠️ Ayırıcı çizgi hâlâ YOK; çizgi çekseydik vitrin bir ayar
     ekranı gibi okunurdu. Ama 24dp cihazda fazla geldi: banner ile
     "Kategoriler", kategoriler ile "Tüm Ürünler" arasında ekranın
     boşa giden bir bölümü oluşuyordu.

     ⚠️ Görünen boşluk 16'dan FAZLA çünkü bölümlerin kendi dikey
     dolguları da var (kategori şeridinde onay rozetinin taşması
     için 8, başlıkta 12). Toplam ~32-36dp — nefes almaya yeter. */
  bolum: {
    marginTop: bosluk.normal,
  },

  /* Liste kabı: ölçüm için var, görünümü değiştirmiyor. flex:1
     olmadan liste ekranın altına kadar uzamaz. */
  listeKap: {
    flex: 1,
  },

  kompaktSeritKap: {
    flexGrow: 0,
    flexShrink: 0,
  },

  kompaktSerit: {
    paddingHorizontal: sayfaKenari,
    gap: bosluk.orta,
  },

  // ⚠️ sayfaKenari — banner, arama ve kategori şeridiyle aynı
  // dikey çizgi. Önce bosluk.kucuk yazılıydı ve tesadüfen aynı
  // değerdeydi; token'a bağlamak, kenar boşluğu değişince hizanın
  // kendiliğinden korunmasını sağlıyor.
  liste: {
    paddingHorizontal: sayfaKenari,
    paddingBottom: bosluk.normal,
  },

  satir: {
    justifyContent: 'space-between',
  },
});
