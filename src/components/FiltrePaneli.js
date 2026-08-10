import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, ScrollView,
  TouchableOpacity, Switch, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir } from '../theme/olculer';
import { bosFiltre, puanEsikleri, filtreSorgusuKur, sinirdakiniBosalt } from '../services/urunFiltresi';
import Chip from './Chip';
import FiyatAraligi from './FiyatAraligi';

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
            <View style={styles.bolum}>
              <Text style={styles.bolumBaslik}>Kategori</Text>

              <View style={styles.chipSatiri}>
                {kategoriler.map((k) => (
                  <Chip
                    key={k.id}
                    etiket={k.name}
                    secili={taslak.kategoriler.includes(k.id)}
                    onBas={() => kategoriDegistir(k.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ---------- FİYAT ---------- */}
          {sinirlar && sinirlar.enYuksek > sinirlar.enDusuk && (
            <View style={styles.bolum}>
              <Text style={styles.bolumBaslik}>Fiyat aralığı</Text>

              <FiyatAraligi
                enDusuk={Math.floor(sinirlar.enDusuk)}
                enYuksek={Math.ceil(sinirlar.enYuksek)}
                alt={altFiyat}
                ust={ustFiyat}
                onDegisti={(a, u) => { setAltFiyat(a); setUstFiyat(u); }}
                onBitti={fiyatiIsle}
              />
            </View>
          )}

          {/* ---------- PUAN ---------- */}
          <View style={styles.bolum}>
            <Text style={styles.bolumBaslik}>Puan</Text>

            <View style={styles.chipSatiri}>
              {puanEsikleri.map((esik) => (
                <Chip
                  key={esik}
                  etiket={esik + ' yıldız ve üzeri'}
                  secili={taslak.minPuan === esik}
                  onBas={() => puanDegistir(esik)}
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
          <View style={styles.bolum}>
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
    lineHeight: satir.buyuk,
    color: renkler.yaziKoyu,
  },

  icerik: {
    paddingHorizontal: bosluk.normal,
  },

  icerikDolgu: {
    paddingBottom: bosluk.normal,
  },

  bolum: {
    paddingTop: bosluk.normal,
  },

  bolumBaslik: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.yari,
    lineHeight: satir.kucuk,
    color: renkler.yaziGri,
    textTransform: 'uppercase',
    marginBottom: bosluk.orta,
  },

  chipSatiri: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: bosluk.kucuk,
  },

  aciklama: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziGri,
    marginTop: bosluk.kucuk,
  },

  anahtarSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  anahtarYazi: {
    fontSize: yazi.orta,
    fontWeight: agirlik.orta,
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
    lineHeight: satir.orta,
    color: renkler.anaRenkUstuYazi,
  },
});
