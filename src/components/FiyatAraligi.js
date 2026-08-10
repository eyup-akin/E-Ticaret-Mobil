import React, { useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir } from '../theme/olculer';

// ============================================================
//  FİYAT ARALIĞI — çift uçlu kaydırıcı
//
//  enDusuk / enYuksek : kaydırıcının uçları (sunucudan geliyor)
//  alt / ust          : şu anki seçim
//  onDegisti(a, u)    : sürüklerken her adımda
//  onBitti(a, u)      : parmak kalkınca — ağ isteği BURADA atılır
//
//  ⚠️ NEDEN HAZIR PAKET KURULMADI?
//
//  @react-native-community/slider TEK tutamaklı; aralık seçimi
//  yapamıyor. Çift uçlu paketler ise react-native-gesture-handler
//  gerektiriyor ve o, projeye yeni bir NATİF bağımlılık ekler:
//  Expo Go ile denemek zorlaşır, sürüm yükseltmelerinde kırılma
//  riski doğar. PanResponder React Native ÇEKİRDEĞİNDE — sıfır
//  bağımlılık, tam kontrol.
//
//  ⚠️ NEDEN onDegisti VE onBitti AYRI?
//
//  Sürükleme saniyede onlarca olay üretiyor. Her birinde
//  "kaç ürün çıkacak" isteği atsaydık sunucuya gereksiz yük
//  binerdi ve cevaplar sırasız dönüp sayacın zıplamasına yol
//  açardı. Rakamlar anında güncelleniyor (onDegisti), ağ isteği
//  parmak kalkınca gidiyor (onBitti).
// ============================================================

const TUTAMAK = 24;   // tutamağın çapı

export default function FiyatAraligi({
  enDusuk,
  enYuksek,
  alt,
  ust,
  onDegisti,
  onBitti,
}) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [genislik, setGenislik] = useState(0);

  // ⚠️ NEDEN REF, NEDEN DOĞRUDAN PROP?
  //
  // PanResponder bir KEZ kuruluyor (useMemo, bağımlılıksız).
  // İçindeki fonksiyonlar ilk render'ın değerlerini kapatır ve
  // sürüklerken hep o bayat sayıları okurdu — tutamak ilk
  // konumuna geri zıplardı. Ref'in .current'i her render'da
  // tazeleniyor, jest sırasında okunan değer güncel oluyor.
  const durum = useRef({ alt, ust, genislik, enDusuk, enYuksek });
  durum.current = { alt, ust, genislik, enDusuk, enYuksek };

  // ⚠️ GERİ ÇAĞRILAR DA REF'TE — ve bu, testte YAKALANAN GERÇEK BİR
  // HATANIN düzeltmesi.
  //
  // Önce doğrudan prop'lar (onDegisti/onBitti) çağrılıyordu. Değerler
  // ref'ten okunduğu için sürükleme doğru görünüyordu; ama jest
  // BİTİNCE çağrılan onBitti, ilk render'da yaratılmış olan
  // fonksiyondu ve o fonksiyon panelin İLK haldeki alt/üst
  // state'lerini (0 ve 0) kapatmıştı. Sonuç: kaydırıcıda "89 –
  // 2.051 TL" yazarken sorguya minFiyat=0&maxFiyat=0 gidiyor ve
  // panel "0 ürünü göster" diyordu. Sunucu aynı filtreye 17
  // diyordu — yani hata tamamen istemcideydi.
  //
  // Kural: bir jest/abonelik bir kez kuruluyorsa, İÇİNDEN
  // çağrılan her şey ref üzerinden okunmalı. Değerleri ref'e alıp
  // fonksiyonları unutmak, hatanın yarısını düzeltmek oluyor.
  const geriCagri = useRef({ onDegisti, onBitti });
  geriCagri.current = { onDegisti, onBitti };

  // Jest başlarken tutamağın nerede olduğunu saklıyoruz.
  // gestureState.dx "başlangıçtan beri ne kadar gitti" diyor;
  // başlangıcı bilmezsek sürükleme her karede sıfırdan sayardı.
  const jestBaslangici = useRef(0);

  // Sürükleme boyunca en son ÜRETİLEN değerler.
  //
  // ⚠️ onBitti bunları argüman olarak alıyor, panelin state'inden
  // okumuyor. Sebep bir yarış: son onPanResponderMove'un setState'i
  // henüz ekrana işlenmeden onPanResponderRelease çalışabilir; o
  // anda panelin state'i bir adım geride olurdu ve sorguya
  // sürüklemenin SON DEĞİL SONDAN BİR ÖNCEKİ değeri giderdi.
  // Değeri üreten yer, değeri taşımalı.
  const sonDeger = useRef({ alt, ust });

  // ---- DEĞER ↔ PİKSEL ----
  //
  // ⚠️ Kullanılabilir genişlik, tutamağın çapı kadar KISA.
  // Tutamak merkezden değil sol kenarından konumlanıyor; bunu
  // hesaba katmasaydık en sağdaki tutamağın yarısı raydan taşardı.
  function kullanilabilir(g) {
    return Math.max(g - TUTAMAK, 1);
  }

  function degerdenX(deger, d) {
    const aralik = d.enYuksek - d.enDusuk;
    if (aralik <= 0) return 0;
    return ((deger - d.enDusuk) / aralik) * kullanilabilir(d.genislik);
  }

  function xtenDeger(x, d) {
    const aralik = d.enYuksek - d.enDusuk;
    const oran = x / kullanilabilir(d.genislik);

    // ⚠️ TAM SAYIYA YUVARLANIYOR. Kuruşlu bir kaydırıcı
    // ("1.847,33 TL") kullanıcıya hiçbir şey söylemez; üstelik
    // her piksel farklı bir kuruş üretip ekranı titretirdi.
    return Math.round(d.enDusuk + oran * aralik);
  }

  function sinirla(deger, altSinir, ustSinir) {
    return Math.min(Math.max(deger, altSinir), ustSinir);
  }

  // ---- TUTAMAK JESTİ ----
  //
  // hangi: 'alt' | 'ust'
  //
  // ⚠️ İKİ TUTAMAK BİRBİRİNİ GEÇEMEZ. Alt tutamak en fazla üstün
  // bulunduğu yere kadar gidiyor. Geçmesine izin verseydik
  // "min 2000 – max 500" gibi hiçbir ürünün geçemeyeceği bir
  // aralık kurulabilirdi ve ekranda sebepsiz "ürün bulunamadı"
  // çıkardı.
  function jestKur(hangi) {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        const d = durum.current;
        jestBaslangici.current = degerdenX(hangi === 'alt' ? d.alt : d.ust, d);

        // Parmak konsa ve hiç kaydırmadan kalksa bile onBitti'ye
        // geçerli bir değer gitsin.
        sonDeger.current = { alt: d.alt, ust: d.ust };
      },

      onPanResponderMove: (_, jest) => {
        const d = durum.current;
        if (d.genislik <= 0) return;

        const x = sinirla(jestBaslangici.current + jest.dx, 0, kullanilabilir(d.genislik));
        const deger = xtenDeger(x, d);

        const yeni = hangi === 'alt'
          ? { alt: sinirla(deger, d.enDusuk, d.ust), ust: d.ust }
          : { alt: d.alt, ust: sinirla(deger, d.alt, d.enYuksek) };

        sonDeger.current = yeni;
        geriCagri.current.onDegisti(yeni.alt, yeni.ust);
      },

      onPanResponderRelease: () =>
        geriCagri.current.onBitti(sonDeger.current.alt, sonDeger.current.ust),

      // Gelen bir çağrı ya da başka bir jest ekranı ele geçirirse
      // parmak "kalkmış" sayılır; yoksa panelde sayaç, bırakılmış
      // bir sürüklemenin son değerinde takılı kalırdı.
      onPanResponderTerminate: () =>
        geriCagri.current.onBitti(sonDeger.current.alt, sonDeger.current.ust),
    });
  }

  // ⚠️ Bağımlılık listesi BOŞ — jest nesneleri bir kez kuruluyor.
  // Her render'da yenisini yaratsaydık, sürükleme ortasında
  // responder değişir ve parmak "düşerdi".
  const jestAlt = useMemo(() => jestKur('alt'), []);
  const jestUst = useMemo(() => jestKur('ust'), []);

  const d = { alt, ust, genislik, enDusuk, enYuksek };
  const altX = degerdenX(alt, d);
  const ustX = degerdenX(ust, d);

  return (
    <View>
      <View style={styles.degerSatiri}>
        <Text style={styles.deger}>{alt.toLocaleString('tr-TR')} TL</Text>
        <Text style={styles.deger}>{ust.toLocaleString('tr-TR')} TL</Text>
      </View>

      <View
        style={styles.rayAlani}
        onLayout={(olay) => setGenislik(olay.nativeEvent.layout.width)}
      >
        <View style={styles.ray} />

        {/* Seçili aralık — iki tutamağın arası */}
        <View
          style={[
            styles.seciliRay,
            { left: altX + TUTAMAK / 2, width: Math.max(ustX - altX, 0) },
          ]}
        />

        <View
          {...jestAlt.panHandlers}
          style={[styles.tutamak, { left: altX }]}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        />

        {/*
          ⚠️ Üst tutamak SONRA çiziliyor — yani alttakinin ÜSTÜNDE.
          İkisi aynı noktada üst üste geldiğinde parmağın yakaladığı
          bu oluyor. Sıra ters olsaydı, iki tutamak da en sağa
          dayandığında hiçbiri geri çekilemezdi: alttaki üstü
          geçemediği için yerinden kıpırdamazdı.
        */}
        <View
          {...jestUst.panHandlers}
          style={[styles.tutamak, { left: ustX }]}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        />
      </View>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  degerSatiri: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: bosluk.kucuk,
  },

  deger: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    lineHeight: satir.normal,
    color: renkler.yaziKoyu,
  },

  rayAlani: {
    height: TUTAMAK + bosluk.kucuk,
    justifyContent: 'center',
  },

  ray: {
    height: 4,
    borderRadius: kose.tam,
    backgroundColor: renkler.acikGri,
    marginHorizontal: TUTAMAK / 2,
  },

  seciliRay: {
    position: 'absolute',
    height: 4,
    borderRadius: kose.tam,
    backgroundColor: renkler.anaRenk,
  },

  tutamak: {
    position: 'absolute',
    width: TUTAMAK,
    height: TUTAMAK,
    borderRadius: kose.tam,
    backgroundColor: renkler.kartArka,
    borderWidth: 2,
    borderColor: renkler.anaRenk,

    // ⚠️ elevation TEK BAŞINA yetmez (sadece Android). Tema
    // gölgesi iOS'un shadow* özelliklerini de birlikte veriyor.
    ...renkler.golgeSm,
  },
});
