import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, ScrollView,
  TouchableOpacity, Switch, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';
import {
  bosFiltre, puanEsikleri, filtreSorgusuKur, sinirdakiniBosalt, aktifFiltreSayisi,
} from '../services/urunFiltresi';
import { kategoriIkonu } from '../services/kategoriIkon';
import SecimKarosu from './SecimKarosu';
import Yildizlar from './Yildizlar';
import FiyatAraligi from './FiyatAraligi';
import Chip from './Chip';   // ⭐ YENİ — hazır fiyat aralıkları için

/* ⭐ YENİ (2026-08-12) — HAZIR FİYAT ARALIKLARI (B3'ün yerine)
 *
 * B3 bir histogram öneriyordu ("hangi fiyatta kaç ürün var"). Onun
 * yerine bu kondu çünkü müşterinin derdi veri görmek değil,
 * kaydırıcıyı elle tutturmaktan kurtulmaktı: 89–4.500 arası bir rayda
 * parmakla 1.000'i yakalamak neredeyse imkânsız.
 *
 * ⚠️ MERDİVEN SABİT, MAĞAZAYA GÖRE TÜRETİLMİYOR.
 * "Sınırları altıya böl" gibi bir hesap 1.317 ₺ gibi çirkin ve
 * hatırlanmaz eşikler üretirdi. İnsanlar fiyatı yuvarlak sayılarla
 * düşünüyor.
 *
 * ⚠️ ÜST SINIRI OLMAYAN SON BASAMAK (`ust: null`) mağazanın en pahalı
 * ürününe kadar açılıyor.
 *
 * ⚠️ Mağazanın fiyat aralığının TAMAMEN dışında kalan basamak
 * ÇİZİLMİYOR (aşağıda süzülüyor): basınca sıfır sonuç veren bir
 * düğme, müşteriye "burada ürün yok" demenin en zahmetli yolu.
 */
const HAZIR_ARALIKLAR = [
  { etiket: '0 – 100 ₺', alt: 0, ust: 100 },
  { etiket: '100 – 250 ₺', alt: 100, ust: 250 },
  { etiket: '250 – 500 ₺', alt: 250, ust: 500 },
  { etiket: '500 – 1.000 ₺', alt: 500, ust: 1000 },
  { etiket: '1.000 – 2.500 ₺', alt: 1000, ust: 2500 },
  { etiket: '2.500 ₺ ve üzeri', alt: 2500, ust: null },
];

// ============================================================
//  FİLTRE PANELİ — alttan açılan filtre ekranı
//
//  acik        : görünür mü
//  filtre      : ekranda YÜRÜRLÜKTE olan filtre
//  kategoriId  : ekranın kendi kategorisi (kategori ekranında dolu)
//  arama       : yürürlükteki arama metni
//  onKapat()   : panel kapatılsın
//  onUygula(f) : kullanıcı "göster"e bastı
//
//  ⚠️ PANEL KENDİ TASLAK KOPYASINI TUTUYOR.
//
//  Seçimler doğrudan ekranın filtresine yazılsaydı, her dokunuşta
//  arkadaki liste yeniden yüklenirdi: müşteri daha seçimini
//  bitirmeden ekran üç kez değişirdi. Taslak sayesinde ekran
//  yalnızca "göster"e basılınca değişiyor — ve "kapat" gerçekten
//  vazgeçmek anlamına geliyor.
//
//  ⚠️ SIRALAMA BURADA YOK — bilerek. En sık kullanılan şey o;
//  panelin içine gömmek her sıralama değişikliği için iki dokunuş
//  (aç, seç, uygula) gerektirirdi. Sıralama listenin üstünde,
//  tek dokunuşluk şeritte duruyor.
// ============================================================
export default function FiltrePaneli({
  acik,
  filtre,
  kategoriId,
  arama,
  onKapat,
  onUygula,
}) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [taslak, setTaslak] = useState(filtre);
  const [kategoriler, setKategoriler] = useState([]);
  const [sinirlar, setSinirlar] = useState(null);   // { enDusuk, enYuksek }
  const [sayi, setSayi] = useState(null);           // null = henüz bilinmiyor
  const [sayiliyor, setSayiliyor] = useState(false);

  // Kaydırıcının o anki iki ucu. Filtrede null olabilirler
  // ("sınır serbest"), kaydırıcı ise her zaman bir sayı ister.
  const [altFiyat, setAltFiyat] = useState(0);
  const [ustFiyat, setUstFiyat] = useState(0);

  // ⭐ YENİ (GV/Faz 3) — SAYI KUTULARININ METİN HALİ.
  //
  // ⚠️ NEDEN AYRI STATE, NEDEN doğrudan altFiyat'ı yazdırmıyoruz?
  //
  // TextInput'un value'suna sayıyı verseydik kutuyu TEMİZLEMEK
  // imkânsız olurdu: kullanıcı son rakamı silince metin "" olur,
  // Number("") = 0, ve kutuya anında "0" geri yazılırdı. Kullanıcı
  // "1500" yazmak için önce silmek zorunda ve silemiyor.
  //
  // Bu yüzden yazarken METİN serbest, sayıya çevirme yalnızca
  // odak çıkışında (onBlur) yapılıyor.
  const [altMetin, setAltMetin] = useState('');
  const [ustMetin, setUstMetin] = useState('');

  // ⚠️ SIRA NUMARASI — YARIŞ KOŞULU KALKANI.
  //
  // Hızlı seçimlerde birden çok sayaç isteği havada olur ve
  // cevaplar GÖNDERİLDİKLERİ SIRAYLA dönmez. Kalkan olmasaydı
  // eski bir cevap yenisinin üstüne yazabilir, ekranda seçimle
  // ilgisiz bir sayı kalabilirdi. Yalnızca en son isteğin cevabı
  // ekrana yazılıyor.
  const sonIstek = useRef(0);

  // ---- PANEL HER AÇILDIĞINDA TASLAĞI TAZELE ----
  //
  // ⚠️ Bileşen ekranda sürekli duruyor (Modal görünürlüğü prop ile
  // yönetiliyor), yani state kapanınca sıfırlanmıyor. Bu olmadan
  // müşteri filtreyi kapatıp tekrar açtığında vazgeçtiği seçimleri
  // karşısında bulurdu.
  useEffect(() => {
    if (acik) {
      setTaslak(filtre);
    }
  }, [acik]);

  // ---- KATEGORİLER VE FİYAT UÇLARI — BİR KEZ ----
  //
  // ⚠️ Panel ilk açılana kadar hiç istek atılmıyor. Ekran
  // yüklenirken çekseydik, filtreyi hiç açmayacak müşteriler için
  // iki gereksiz istek olurdu.
  useEffect(() => {
    if (!acik || sinirlar !== null) {
      return;
    }

    let iptal = false;

    (async () => {
      try {
        // ⚠️ Promise.all DEĞİL: biri patlarsa diğerinin sonucu da
        // düşerdi. Kategoriler gelmezse fiyat kaydırıcısı yine de
        // çalışsın istiyoruz. (Siparişlerim ekranındaki allSettled
        // kararının aynısı.)
        const [kat, sin] = await Promise.allSettled([
          apiGet('/categories'),
          apiGet('/products/fiyat-araligi'),
        ]);

        if (iptal) return;

        if (kat.status === 'fulfilled') {
          setKategoriler(kat.value);
        }

        if (sin.status === 'fulfilled') {
          setSinirlar(sin.value);
        }
      } catch (hata) {
        console.log('Filtre seçenekleri alınamadı:', hata.message);
      }
    })();

    return () => { iptal = true; };
  }, [acik]);

  // ---- SINIRLAR GELİNCE KAYDIRICIYI YERLEŞTİR ----
  //
  // ⚠️ DEĞERLER "filtre" PROP'UNDAN OKUNUYOR, "taslak" STATE'İNDEN
  // DEĞİL — ve bu, testte yakalanan ikinci gerçek hatanın düzeltmesi.
  //
  // Önce taslak okunuyordu. İki efekt de "acik" değişince
  // tetikleniyor ve ikisi AYNI render'da çalışıyor: yukarıdaki
  // setTaslak(filtre) henüz işlenmemişken buradaki taslak hâlâ
  // ESKİ değeri gösteriyordu. Sonuç: panel kapatılıp yeniden
  // açıldığında sayaç doğru ("40 ürünü göster") ama kaydırıcı
  // yanlış (89 – 4.500 TL) duruyordu — ekranda birbiriyle çelişen
  // iki bilgi.
  //
  // "filtre" prop'u panelin dışından geliyor ve açılış anında
  // zaten doğru; bir state güncellemesinin sırasını beklemiyor.
  // Kural: aynı olaya bağlı iki efekt birbirinin state'ini
  // okumamalı, ikisi de KAYNAĞI okumalı.
  useEffect(() => {
    if (!sinirlar) return;

    setAltFiyat(filtre.minFiyat ?? Math.floor(sinirlar.enDusuk));
    setUstFiyat(filtre.maxFiyat ?? Math.ceil(sinirlar.enYuksek));
  }, [sinirlar, acik]);

  // ---- KAYDIRICI OYNAYINCA KUTULARI TAZELE ----
  //
  // ⚠️ Tek yönlü: sayı → metin. Ters yön (metin → sayı) yalnızca
  // odak çıkışında çalışıyor. İki yönü de anlık bağlasaydık
  // kullanıcı "15" yazarken kutu "15" → sayı 15 → metin "15" diye
  // dönüp durur, araya kaydırıcının sınırlaması girince yazdığı
  // rakam elinden alınırdı.
  useEffect(() => {
    setAltMetin(String(altFiyat));
    setUstMetin(String(ustFiyat));
  }, [altFiyat, ustFiyat]);

  // ---- TASLAK DEĞİŞİNCE SAYACI TAZELE ----
  useEffect(() => {
    if (!acik) return;

    const numara = ++sonIstek.current;
    setSayiliyor(true);

    (async () => {
      try {
        const yol = '/products/sayi' + filtreSorgusuKur(taslak, { kategoriId, arama });
        const veri = await apiGet(yol);

        // Bu cevap en son isteğe mi ait? Değilse sessizce at.
        if (numara !== sonIstek.current) return;

        setSayi(veri.toplam);
      } catch (hata) {
        if (numara !== sonIstek.current) return;

        // ⚠️ Sayı UYDURULMUYOR. İstek patlarsa null bırakılıyor ve
        // buton "Ürünleri göster" diyor. "0 ürünü göster" yazmak,
        // aslında dolu olan bir listeyi boş göstermek olurdu.
        setSayi(null);
        console.log('Ürün sayısı alınamadı:', hata.message);
      } finally {
        if (numara === sonIstek.current) {
          setSayiliyor(false);
        }
      }
    })();
  }, [taslak, acik]);

  function kategoriDegistir(id) {
    setTaslak((onceki) => ({
      ...onceki,
      kategoriler: onceki.kategoriler.includes(id)
        ? onceki.kategoriler.filter((x) => x !== id)
        : [...onceki.kategoriler, id],
    }));
  }

  function puanDegistir(esik) {
    // Seçili olana tekrar basmak seçimi kaldırıyor — ayrı bir
    // "hepsi" seçeneği koymaya gerek kalmıyor.
    setTaslak((onceki) => ({
      ...onceki,
      minPuan: onceki.minPuan === esik ? null : esik,
    }));
  }

  // Kaydırıcı bırakılınca taslağa yaz — sayaç o zaman tazeleniyor.
  //
  // ⚠️ Değerler ARGÜMANDAN geliyor, altFiyat/ustFiyat state'inden
  // değil. Kaydırıcı, bırakma anındaki son değeri kendisi taşıyor;
  // state'ten okusaydık son sürükleme adımı henüz işlenmemiş
  // olabilirdi. (Ayrıntı: FiyatAraligi.js içindeki sonDeger notu.)
  function fiyatiIsle(a, u) {
    if (!sinirlar) return;

    setTaslak((onceki) => ({
      ...onceki,
      minFiyat: sinirdakiniBosalt(a, Math.floor(sinirlar.enDusuk)),
      maxFiyat: sinirdakiniBosalt(u, Math.ceil(sinirlar.enYuksek)),
    }));
  }

  /* ⭐ YENİ (2026-08-12) — hazır aralığa basılınca.
   *
   * ⚠️ Kaydırıcı ve kutular da GÜNCELLENİYOR. Yalnızca taslağı
   * yazsaydık müşteri "500 – 1.000"e basar ama kaydırıcı eski yerinde
   * dururdu: ekranda iki farklı cevap olurdu.
   *
   * ⚠️ Seçiliye tekrar basmak seçimi KALDIRIYOR — kategori ve puan
   * karolarındaki davranışın aynısı; ayrı bir "hepsi" düğmesine gerek
   * kalmıyor. */
  function hazirAralikSec(aralik) {
    if (!sinirlar) return;

    const enDusuk = Math.floor(sinirlar.enDusuk);
    const enYuksek = Math.ceil(sinirlar.enYuksek);

    if (seciliAralikMi(aralik)) {
      setAltFiyat(enDusuk);
      setUstFiyat(enYuksek);
      fiyatiIsle(enDusuk, enYuksek);
      return;
    }

    // ⚠️ Mağazanın sınırlarına kırpılıyor: 0–100 basamağı, en ucuz
    // ürünü 89 ₺ olan bir mağazada 89'dan başlamalı. Kırpmasaydık
    // kaydırıcı kendi sınırının dışına düşer ve tutamağı kaybolurdu.
    const a = Math.max(aralik.alt, enDusuk);
    const u = Math.min(aralik.ust ?? enYuksek, enYuksek);

    setAltFiyat(a);
    setUstFiyat(u);
    fiyatiIsle(a, u);
  }

  /* Bir basamak şu an seçili mi?
     ⚠️ Karşılaştırma TASLAKTAKİ değerlerle değil ekrandaki kaydırıcı
     değerleriyle yapılıyor: taslakta sınırdaki değerler null'a
     çekiliyor (`sinirdakiniBosalt`) ve "2.500 ve üzeri" seçiliyken
     maxFiyat null oluyor. */
  function seciliAralikMi(aralik) {
    if (!sinirlar) return false;

    const enDusuk = Math.floor(sinirlar.enDusuk);
    const enYuksek = Math.ceil(sinirlar.enYuksek);

    return (
      altFiyat === Math.max(aralik.alt, enDusuk) &&
      ustFiyat === Math.min(aralik.ust ?? enYuksek, enYuksek)
    );
  }

  // ⭐ YENİ (GV/Faz 3) — SAYI KUTUSU ODAKTAN ÇIKINCA
  //
  // hangi: 'alt' | 'ust'
  //
  // ⚠️ ÜÇ AŞAMA: ayrıştır → sınırla → işle.
  //
  // Ayrıştırma başarısızsa (boş kutu, "abc") kullanıcıyı hata
  // mesajıyla karşılamak yerine değeri ESKİ HALİNE döndürüyoruz.
  // Filtre kutusu bir form alanı değil; yanlış yazınca engellenmek
  // değil, sessizce düzeltilmek beklenir.
  //
  // ⚠️ Sınırlama iki taraflı: alt kutu üst değeri geçemez, üst kutu
  // altın altına inemez. Kaydırıcıdaki kuralın aynısı — iki giriş
  // yolu aynı sonucu vermeli, yoksa "kutuyla yaptığımı kaydırıcıyla
  // yapamıyorum" durumu doğar.
  function kutuyuIsle(hangi) {
    if (!sinirlar) return;

    const enDusuk = Math.floor(sinirlar.enDusuk);
    const enYuksek = Math.ceil(sinirlar.enYuksek);

    const metin = hangi === 'alt' ? altMetin : ustMetin;
    const sayi = parseInt(metin.replace(/[^0-9]/g, ''), 10);

    if (Number.isNaN(sayi)) {
      // Bozuk giriş → eski değeri geri yaz
      setAltMetin(String(altFiyat));
      setUstMetin(String(ustFiyat));
      return;
    }

    let a = altFiyat;
    let u = ustFiyat;

    if (hangi === 'alt') {
      a = Math.min(Math.max(sayi, enDusuk), ustFiyat);
    } else {
      u = Math.min(Math.max(sayi, altFiyat), enYuksek);
    }

    setAltFiyat(a);
    setUstFiyat(u);
    fiyatiIsle(a, u);
  }

  function temizle() {
    setTaslak(bosFiltre());

    if (sinirlar) {
      setAltFiyat(Math.floor(sinirlar.enDusuk));
      setUstFiyat(Math.ceil(sinirlar.enYuksek));
    }
  }

  const butonYazisi = sayi === null
    ? 'Ürünleri göster'
    : sayi + ' ürünü göster';

  // ⭐ YENİ (GV/Faz 3) — başlıktaki temizle bağlantısının sayacı.
  // ⚠️ aktifFiltreSayisi TASLAĞA bakıyor, yürürlükteki filtreye
  // değil: kullanıcı panelde ne seçtiyse onu sayması gerekiyor.
  const secimSayisi = aktifFiltreSayisi(taslak);
  const secimVar = secimSayisi > 0;

  return (
    <Modal
      visible={acik}
      transparent
      animationType="slide"
      onRequestClose={onKapat}   // Android geri tuşu
    >
      {/*
        ⚠️ Karartılmış alana basınca kapanıyor. Pressable, dokunma
        olayını yakalayıp aşağıdaki panele geçirmiyor; View
        kullansaydık zemine basmak hiçbir şey yapmazdı.
      */}
      <Pressable style={styles.karartma} onPress={onKapat} />

      <View style={styles.panel}>
        <View style={styles.baslikSatiri}>
          <Text style={styles.baslik}>Filtrele</Text>

          {/* ⭐ YENİ (GV/Faz 3) — "Temizle (3)".

              ⚠️ Sayı ile birlikte gösteriliyor çünkü panel açıldığında
              müşteri kaç filtrenin yürürlükte olduğunu görmeden
              karar veremiyor: kaydırıcı ve karolar ekranın altında
              kalabiliyor, kategori bölümü bazı ekranlarda hiç
              çizilmiyor.

              ⚠️ Hiç seçim yokken PASİF: basılabilir görünen ama
              hiçbir şey yapmayan bir bağlantı, kullanıcıya
              "çalışmıyor" dedirtir. */}
          <TouchableOpacity
            onPress={temizle}
            disabled={!secimVar}
            hitSlop={8}
            style={styles.temizleBaglanti}
          >
            <Text style={[styles.temizleBaglantiYazi, !secimVar && styles.temizlePasif]}>
              {secimVar ? `Temizle (${secimSayisi})` : 'Temizle'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onKapat} hitSlop={12}>
            <Ionicons name="close" size={24} color={renkler.yaziOrta} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.icerik}
          contentContainerStyle={styles.icerikDolgu}
          showsVerticalScrollIndicator={false}
        >
          {/* ---------- KATEGORİ ---------- */}
          {/*
            ⚠️ Kategori ekranında bu bölüm hiç gösterilmiyor: müşteri
            zaten bir kategorinin içinde. İkinci bir kategori seçimi
            sunmak, "Kitap" başlığının altında ayakkabı listelemek
            olurdu.
          */}
          {!kategoriId && kategoriler.length > 0 && (
            <View style={styles.kart}>
              <View style={styles.kartBaslikSatiri}>
                <Text style={styles.kartBaslik}>Kategori</Text>

                {taslak.kategoriler.length > 0 && (
                  <Text style={styles.kartOzet}>
                    {taslak.kategoriler.length} seçili
                  </Text>
                )}
              </View>

              {/* ⚠️ YATAY KAYDIRMA, ALT SATIRA SARMA DEĞİL.

                  Karolar 84dp; sarma bıraksaydık 7 kategori üç satır
                  ederdi ve kart, panelin yarısını yerdi. Fiyat ve
                  puan bölümleri ekranın altında kalırdı.

                  ⚠️ flexGrow:0 — ScrollView'in dikey akışta kalan
                  alanı yutma huyu. (SiralamaSeridi'nde yaşandı.) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.karoSeridi}
                style={styles.karoSeridiKap}
                directionalLockEnabled
              >
                {kategoriler.map((k) => (
                  <SecimKarosu
                    key={k.id}
                    ikon={kategoriIkonu(k.name)}
                    etiket={k.name}
                    secili={taslak.kategoriler.includes(k.id)}
                    onBas={() => kategoriDegistir(k.id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* ---------- FİYAT ---------- */}
          {sinirlar && sinirlar.enYuksek > sinirlar.enDusuk && (
            <View style={styles.kart}>
              <View style={styles.kartBaslikSatiri}>
                <Text style={styles.kartBaslik}>Fiyat</Text>
              </View>

              {/* ⭐ YENİ — hazır aralıklar KAYDIRICININ ÜSTÜNDE.
                  Sıra bilinçli: çoğu müşterinin ihtiyacı hazır bir
                  basamak; kaydırıcı ve kutular ince ayar için altta
                  duruyor. Altta olsalardı müşteri önce zor yolu
                  görürdü. */}
              <View style={styles.hazirSerit}>
                {HAZIR_ARALIKLAR
                  .filter((a) =>
                    a.alt <= Math.ceil(sinirlar.enYuksek) &&
                    (a.ust ?? Infinity) >= Math.floor(sinirlar.enDusuk)
                  )
                  .map((a) => (
                    <Chip
                      key={a.etiket}
                      etiket={a.etiket}
                      secili={seciliAralikMi(a)}
                      onBas={() => hazirAralikSec(a)}
                    />
                  ))}
              </View>

              <FiyatAraligi
                enDusuk={Math.floor(sinirlar.enDusuk)}
                enYuksek={Math.ceil(sinirlar.enYuksek)}
                alt={altFiyat}
                ust={ustFiyat}
                onDegisti={(a, u) => { setAltFiyat(a); setUstFiyat(u); }}
                onBitti={fiyatiIsle}
              />

              {/* ⭐ YENİ (GV/Faz 3) — SAYI KUTULARI.

                  Kaydırıcı kaba ayar, kutular ince ayar. Tasarımda da
                  ikisi birlikte var ve gerekçesi şu: 89–4.500 arası
                  bir raya parmakla 1.500'ü tam tutturmak mümkün değil.

                  ⚠️ Değerler artık kaydırıcının ÜSTÜNDE yazmıyor —
                  okunacak yer burası. İki yerde birden göstermek aynı
                  sayının iki kaynağı olurdu. */}
              <View style={styles.kutuSatiri}>
                <View style={styles.kutu}>
                  <TextInput
                    style={styles.kutuGiris}
                    value={altMetin}
                    onChangeText={setAltMetin}
                    onBlur={() => kutuyuIsle('alt')}
                    onSubmitEditing={() => kutuyuIsle('alt')}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={9}
                    selectTextOnFocus
                  />
                  <Text style={styles.kutuSimge}>₺</Text>
                </View>

                <Text style={styles.kutuAyrac}>—</Text>

                <View style={styles.kutu}>
                  <TextInput
                    style={styles.kutuGiris}
                    value={ustMetin}
                    onChangeText={setUstMetin}
                    onBlur={() => kutuyuIsle('ust')}
                    onSubmitEditing={() => kutuyuIsle('ust')}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={9}
                    selectTextOnFocus
                  />
                  <Text style={styles.kutuSimge}>₺</Text>
                </View>
              </View>
            </View>
          )}

          {/* ---------- PUAN ---------- */}
          <View style={styles.kart}>
            <View style={styles.kartBaslikSatiri}>
              <Text style={styles.kartBaslik}>Puan</Text>
            </View>

            {/* ⚠️ Karoların içinde ikon yerine YILDIZ ŞERİDİ var
                (SecimKarosu'nun "cocuk" prop'u). Müşteri "4 yıldız"
                yazısını okumadan önce dolu yıldızları görüyor —
                filtrenin ne yaptığı bir bakışta anlaşılıyor. */}
            <View style={styles.karoSatiri}>
              {puanEsikleri.map((esik) => (
                <SecimKarosu
                  key={esik}
                  etiket={esik === 5 ? '5 yıldız' : `${esik} & üzeri`}
                  secili={taslak.minPuan === esik}
                  onBas={() => puanDegistir(esik)}
                  cocuk={<Yildizlar deger={esik} boyut={11} />}
                />
              ))}
            </View>

            {/*
              ⚠️ Bu uyarı şart. Puan filtresi, HİÇ YORUMU OLMAYAN
              ürünleri de eliyor (sunucuda böyle) ve müşteri
              bilmezse "ürünler nereye kayboldu" diye düşünür.
            */}
            {taslak.minPuan !== null && (
              <Text style={styles.aciklama}>
                Henüz puanı olmayan ürünler bu filtrede görünmez.
              </Text>
            )}
          </View>

          {/* ---------- STOK ---------- */}
          <View style={styles.kart}>
            <View style={styles.anahtarSatiri}>
              <Text style={styles.anahtarYazi}>Sadece stoktakiler</Text>

              <Switch
                value={taslak.sadeceStokta}
                onValueChange={(deger) =>
                  setTaslak((onceki) => ({ ...onceki, sadeceStokta: deger }))
                }
                trackColor={{ false: renkler.pasif, true: renkler.anaRenk }}
                thumbColor={renkler.kartArka}
              />
            </View>
          </View>
        </ScrollView>

        {/* ---------- ALT ÇUBUK ---------- */}
        <View style={styles.altCubuk}>
          <TouchableOpacity onPress={temizle} style={styles.temizleButon}>
            <Text style={styles.temizleYazi}>Temizle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onUygula(taslak)}
            style={styles.uygulaButon}
            activeOpacity={0.85}
          >
            {sayiliyor ? (
              <ActivityIndicator size="small" color={renkler.anaRenkUstuYazi} />
            ) : (
              <Text style={styles.uygulaYazi}>{butonYazisi}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  karartma: {
    flex: 1,

    // ⚠️ Bu rgba ELLE yazılmış tek renk ve bilerek: karartma
    // perdesi iki temada da SİYAH olmalı. Koyu temada açık bir
    // perde kullanmak, altındaki ekranı karartmak yerine
    // aydınlatırdı. Temaya bağlanacak bir "rol" değil.
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  panel: {
    backgroundColor: renkler.kartArka,
    borderTopLeftRadius: kose.dev,
    borderTopRightRadius: kose.dev,

    // ⚠️ Yüzde ile sınırlıyoruz: içerik uzun olduğunda panel tüm
    // ekranı kaplamasın, arkadaki listenin bir kısmı görünsün ve
    // "bu geçici bir katman" hissi kaybolmasın.
    maxHeight: '80%',
  },

  baslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: bosluk.normal,
    paddingTop: bosluk.normal,
    paddingBottom: bosluk.orta,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },

  baslik: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.buyuk,
    color: renkler.yaziKoyu,

    // Başlık soldan, temizle bağlantısı ve X sağdan — aradaki
    // boşluğu başlık dolduruyor.
    flex: 1,
  },

  temizleBaglanti: {
    marginRight: bosluk.orta,
  },

  temizleBaglantiYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.normal,
    color: renkler.anaRenk,
  },

  temizlePasif: {
    color: renkler.yaziGri,
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 3) — GÖVDE ARTIK SAYFA ZEMİNİNDE.

     Panelin kendisi beyazdı ve bölümler görünmez sınırlarla
     ayrılıyordu; hepsi tek bir uzun liste gibi okunuyordu. Artık
     gövde sayfa zemini rengiyle boyanıyor ve her filtre KENDİ BEYAZ
     KARTINDA duruyor — hangi ayarın hangi başlığa ait olduğu
     bakışta belli.

     ⚠️ Bu, kırık-beyaz sayfa zemini kararının ilk somut karşılığı.
     Zemin beyaz kalsaydı beyaz kartlar görünmez olurdu. */
  icerik: {
    backgroundColor: renkler.arkaPlan,
  },

  icerikDolgu: {
    padding: bosluk.orta,
    gap: bosluk.orta,
  },

  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    padding: bosluk.normal,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },

  /* Sarmalı: altı çip yatay bir şeride sığmıyor ve yatay kaydırma
     panelin kendi dikey kaydırmasıyla çakışıyordu. Sarınca hepsi
     tek bakışta görünüyor. */
  hazirSerit: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: bosluk.kucuk,
    marginBottom: bosluk.normal,
  },

  kartBaslikSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: bosluk.orta,
  },

  /* ⚠️ Başlıkta DİKEY BOŞLUK YOK — boşluğu kartBaslikSatiri veriyor.
     Başlığa marginBottom koysaydık, özet hapının bulunduğu satırda
     başlık aşağı itilir ve hap ile hizası bozulurdu. Her kart
     başlığı aynı sarmalayıcıyı kullanıyor; özet olmayanlarda
     sarmalayıcı tek çocukla çalışıyor. */
  kartBaslik: {
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.orta,
    color: renkler.yaziKoyu,
  },

  /* Özet ("2 seçili") — başlık satırının sağında.
     ⚠️ Yumuşak turuncu zeminli küçük bir hap: kart kapalıyken bile
     "burada bir şey seçili" bilgisini taşıyor. */
  kartOzet: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.kucuk,
    color: renkler.anaRenk,
    backgroundColor: renkler.yumusakVurgu,
    paddingHorizontal: bosluk.kucuk,
    paddingVertical: 3,
    borderRadius: kose.tam,
    overflow: 'hidden',
  },

  karoSeridiKap: {
    flexGrow: 0,
    flexShrink: 0,

    /* ⚠️ Negatif yan boşluk: şerit kartın dolgusunu AŞIYOR.
       Böylece son karo kartın kenarında kırpılıyor ve "devamı var"
       hissi doğuyor. Dolgunun içinde kalsaydı şerit kenardan önce
       biter, kaydırılabilir olduğu anlaşılmazdı. */
    marginHorizontal: -bosluk.normal,
  },

  karoSeridi: {
    paddingHorizontal: bosluk.normal,
    gap: bosluk.kucuk,

    /* Onay rozeti karonun üstünden taşıyor; dikey boşluk olmadan
       üst kenarı kırpılırdı. */
    paddingVertical: bosluk.kucuk,
  },

  karoSatiri: {
    flexDirection: 'row',
    gap: bosluk.kucuk,
    paddingVertical: bosluk.kucuk,
  },

  aciklama: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziGri,
    marginTop: bosluk.kucuk,
  },

  /* ---------- SAYI KUTULARI ---------- */

  kutuSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    marginTop: bosluk.orta,
  },

  kutu: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    paddingHorizontal: bosluk.orta,
    backgroundColor: renkler.kartArka,
  },

  kutuGiris: {
    flex: 1,
    paddingVertical: bosluk.orta,
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,

    /* ⚠️ Android'de TextInput'un varsayılan iç dolgusu var ve
       kutuyu olduğundan uzun gösteriyor. Sıfırlanmazsa kutular
       yanındaki "—" ile hizasız durur. */
    paddingHorizontal: 0,
  },

  /* ⚠️ Simge SONDA — "₺ 89" değil "89 ₺".
     Tasarımda öndeydi ama Türkçe yazımda para simgesi sayıdan
     sonra gelir; uygulamanın geri kalanında (paraBicimle) da öyle. */
  kutuSimge: {
    fontSize: yazi.orta,
    fontFamily: font.orta,
    color: renkler.yaziGri,
    marginLeft: bosluk.mikro,
  },

  kutuAyrac: {
    fontSize: yazi.orta,
    color: renkler.yaziGri,
  },

  anahtarSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  anahtarYazi: {
    fontSize: yazi.orta,
    fontWeight: agirlik.orta,
    fontFamily: font.orta,
    lineHeight: satir.orta,
    color: renkler.yaziKoyu,
  },

  altCubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    padding: bosluk.normal,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
  },

  temizleButon: {
    paddingHorizontal: bosluk.normal,
    paddingVertical: bosluk.orta,
  },

  temizleYazi: {
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.orta,
    color: renkler.yaziOrta,
  },

  uygulaButon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: kose.orta,
    backgroundColor: renkler.anaRenk,
  },

  uygulaYazi: {
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.orta,
    color: renkler.anaRenkUstuYazi,
  },
});
