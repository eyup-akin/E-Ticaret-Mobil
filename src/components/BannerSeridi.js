import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useTema } from '../context/TemaContext';
import { bosluk, kose } from '../theme/olculer';
import { kampanyalariGetir } from '../services/kampanyalar';

// Otomatik geçiş aralığı.
// ⚠️ 4 sn bilinçli: 2-3 sn'de müşteri afişteki cümleyi bitiremiyor,
// 6 sn'de şerit durmuş gibi görünüyor ve ikinci afişin varlığı fark
// edilmiyor.
const OTOMATIK_MS = 4000;

// ============================================================
//  BANNER ŞERİDİ — yatay kaydırmalı kampanya görselleri
//
//  onKampanyaBas(kampanya) : bir banner'a basılınca çağrılır
//
//  ⭐⭐ DEĞİŞTİ — "BANNER ORTALI DURMUYOR, SOLDA FAZLA BOŞLUK VAR"
//     HATASININ GERÇEK SEBEBİ BURADAYDI.
//
//  Şerit, ana sayfada FlatList'in ListHeaderComponent'i olarak
//  çiziliyor ve o listenin contentContainer'ında ZATEN
//  `paddingHorizontal: sayfaKenari` var. Yani bu bileşene düşen
//  genişlik EKRAN DEĞİL, ekran eksi iki kenar boşluğu.
//
//  Eski kod kart genişliğini `ekran - 2*sayfaKenari` diye hesaplayıp
//  bir de kendi içine `paddingHorizontal: sayfaKenari` koyuyordu.
//  Sonuç: kart, içinde bulunduğu kaptan tam 16dp geniş kalıyordu.
//  Solda iki kenar boşluğu üst üste binip 16dp'ye çıkıyor, sağda
//  ise kart kabın dışına taşıp kırpılıyordu. Ölçüldü: solda 10px,
//  sağda 6px (tarayıcıda, 1920 genişlikte).
//
//  Çözüm ekrandan değil KAPTAN ölçmek. `onLayout` bu bileşene
//  gerçekte ne kadar yer verildiğini söylüyor; sayfa genişliği o.
//  Kenar boşluğunu kap zaten veriyor, burada İKİNCİ KEZ dolgu
//  YOK — banner artık arama çubuğu ve ürün ızgarasıyla birebir
//  aynı dikey çizgide.
//
//  ⚠️ Bir sayfa = kabın tamamı, iki afiş arasında boşluk yok.
//  Boşluk bırakmak için karta yatay dolgu verseydik banner
//  ızgaradan içeride kalırdı — Faz 4.8.1'de düzeltilen hizasızlığın
//  aynısı. Aradaki çizgi zaten yalnızca parmak kaydırırken bir an
//  görünüyor.
//
//  ⚠️ GENİŞLİK ÖLÇÜLÜYOR, SABİT DEĞİL: cihaz döndürülünce onLayout
//  tekrar tetikleniyor. Sabit bir sayı yazsaydık yatay modda banner
//  ya taşar ya ortada dururdu.
//
//  ⚠️ `pagingEnabled` sayfa genişliğine göre duruyor; snapToInterval
//  ile durma noktası HESAPLANMIYOR. Ortalama, yerleşimin kendisinden
//  geliyor — bir ölçünün doğru tutturulmasından değil.
//
//  ⚠️ AKTİF NOKTA "onMomentumScrollEnd" İLE TAKİP EDİLİYOR.
//  onScroll saniyede ~30 kez tetikleniyordu ve nokta göstergesi
//  için o sıklığa gerek yok; kaydırma bitince bir kez ölçmek
//  yeterli. UrunGaleri de aynı yöntemi kullanıyor.
//
//  ⚠️⚠️ BİLİNEN SORUN — WEB ÖNİZLEMESİNDE BANNER TIKLANMIYOR.
//
//  Expo'nun web çıktısında bu Pressable'ın onPress'i hiç
//  tetiklenmiyor: içine konulan log bir kez bile düşmedi.
//  Denenen ve SONUÇ VERMEYENLER:
//    • onScroll → onMomentumScrollEnd
//    • Image'a style.pointerEvents: 'none'
//    • snapToInterval / decelerationRate kaldırma
//    • TouchableOpacity → Pressable
//    • hem koordinatla hem erişilebilirlik referansıyla tıklama
//
//  Aynı ekranda kategori karoları ve "Tümünü gör" bağlantısı
//  koordinatla tıklandığında ÇALIŞIYOR — yani navigasyon ve
//  ekranın kendisi sağlam (KampanyaDetay o yolla açılıp
//  doğrulandı). Sorun bu bileşene özgü ve büyük olasılıkla
//  react-native-web'in geniş, resim dolu bir dokunma hedefini
//  kaydırma jesti sanmasından kaynaklanıyor.
//
//  ⚠️ GERÇEK CİHAZDA DENENMEDİ. Dokunma olayları cihazda bambaşka
//  bir yoldan işleniyor; orada çalışması kuvvetle muhtemel ama
//  DOĞRULANMADI. Cihazda da çalışmıyorsa ilk denenecek şey
//  şeridi ScrollView yerine FlatList'e çevirmek.
// ============================================================
export default function BannerSeridi({ onKampanyaBas }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [bannerlar, setBannerlar] = useState([]);
  const [aktif, setAktif] = useState(0);

  // Kaba verilen gerçek genişlik. 0 = henüz ölçülmedi.
  const [genislik, setGenislik] = useState(0);

  // Aktif nokta değişmediyse setState çağırmıyoruz.
  const sonAktif = useRef(0);

  const kaydirici = useRef(null);

  // ⚠️ ELİN ŞERİTTE OLDUĞU AN VE SON BIRAKMA ZAMANI.
  //
  // Otomatik geçiş, müşteri parmağını ekrandan çekmeden çalışmamalı
  // (kaydırdığı şey elinden alınır) ve bıraktığı anda da hemen
  // devreye girmemeli — baktığı afiş kayıp gider. Zaman damgası
  // sayaç yerine state'te tutulsaydı her dokunuşta bileşen yeniden
  // render olurdu; nokta göstergesi dışında ekranda değişen bir şey
  // yok, o render boşa giderdi.
  const elDe = useRef(false);
  const sonDokunus = useRef(0);

  useEffect(() => {
    let iptal = false;

    (async () => {
      const veri = await kampanyalariGetir();
      if (!iptal) setBannerlar(veri);
    })();

    return () => { iptal = true; };
  }, []);

  // ---- OTOMATİK GEÇİŞ ----
  //
  // ⚠️ SONDAN BAŞA DÖNÜŞ ANİMASYONLU. Sonsuz şerit (baştaki ve
  // sondaki elemanın kopyasını iki uca eklemek) daha akıcı görünürdü
  // ama nokta göstergesi, tıklama hedefi ve erişilebilirlik
  // etiketleri klon elemanlarla birlikte yalan söylemeye başlıyor.
  // Üç afişlik bir şeritte geri sarma bedeli o karmaşıklığa değmez.
  //
  // ⚠️ Tek banner varsa sayaç HİÇ kurulmuyor — geçilecek yer yok.
  useEffect(() => {
    if (bannerlar.length < 2 || genislik === 0) return undefined;

    const sayac = setInterval(() => {
      if (elDe.current) return;
      if (Date.now() - sonDokunus.current < OTOMATIK_MS) return;

      const sonraki = (sonAktif.current + 1) % bannerlar.length;

      kaydirici.current?.scrollTo({ x: sonraki * genislik, animated: true });
      sonAktif.current = sonraki;
      setAktif(sonraki);
    }, OTOMATIK_MS);

    return () => clearInterval(sayac);
  }, [bannerlar.length, genislik]);

  // ⚠️ Banner yoksa bölüm HİÇ çizilmiyor — boş bir kutu ya da
  // "kampanya yok" yazısı değil. Kampanya olmaması bir haber
  // değil; müşteriye söylenecek bir şey yok.
  //
  // ⚠️ Bu erken çıkış TÜM hook'lardan SONRA: koşullu hook çağrısı
  // React'in kural ihlali ve banner listesi geç geldiği için tam da
  // burada patlardı.
  if (bannerlar.length === 0) {
    return null;
  }

  function kaydirildi(olay) {
    const x = olay.nativeEvent.contentOffset.x;
    const sira = genislik > 0 ? Math.round(x / genislik) : 0;

    elDe.current = false;
    sonDokunus.current = Date.now();

    if (sira !== sonAktif.current) {
      sonAktif.current = sira;
      setAktif(sira);
    }
  }

  return (
    /* ⚠️ Ölçüm bu View'da: kabın verdiği genişliği ancak çizildikten
       sonra öğrenebiliyoruz. Ölçülmeden şerit çizilmiyor — sıfır
       genişlikli sayfalar bir kare boyunca hepsini üst üste
       yığardı. */
    <View
      onLayout={(olay) => {
        const w = Math.round(olay.nativeEvent.layout.width);
        if (w > 0 && w !== genislik) setGenislik(w);
      }}
    >
      {genislik > 0 && (
      <ScrollView
        ref={kaydirici}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onScrollBeginDrag={() => {
          elDe.current = true;
          sonDokunus.current = Date.now();
        }}
        onScrollEndDrag={() => {
          elDe.current = false;
          sonDokunus.current = Date.now();
        }}
        onMomentumScrollEnd={kaydirildi}
        style={styles.seritKap}
        directionalLockEnabled
      >
        {bannerlar.map((b) => (
          /* ⚠️ SAYFA ile KART ayrı: kaydırma adımı sayfanın,
             yuvarlak köşe ve dokunma hedefi kartın işi. Sayfa
             genişliği kaydırma adımıyla BİREBİR aynı olmak zorunda;
             ikisi ayrışırsa banner her geçişte biraz daha kayar. */
          <View key={b.id} style={{ width: genislik }}>
            <Pressable
              onPress={() => onKampanyaBas && onKampanyaBas(b)}
              style={styles.kart}

              // Görsel bir şey söylemiyor; ekran okuyucuya kampanyanın
              // adını söylemek gerekiyor.
              accessibilityRole="button"
              accessibilityLabel={b.baslik}
            >
              {/* ⚠️ resizeMode="cover": görselin oranı 2:1 değilse
                  bile kutuyu tam dolduruyor. "contain" olsaydı
                  kenarlarda boş şeritler kalırdı. */}
              {/* ⚠️ GÖRSEL DOKUNMAYI YUTMASIN diye style.pointerEvents 'none'.

                  Dürüst not: bu, yukarıdaki web sorununu ÇÖZMEDİ.
                  Yine de duruyor, çünkü kendi başına doğru: dokunma
                  hedefi sarmalayıcı Pressable, resmin kendisi değil.

                  ⚠️ "pointerEvents" PROP OLARAK DEĞİL STİL İÇİNDE
                  veriliyor — konsol açıkça uyarıyor: "props.pointerEvents
                  is deprecated. Use style.pointerEvents". Prop olarak
                  verilen sessizce yok sayılıyor. */}
              <Image
                source={b.gorsel}
                style={[styles.gorsel, { pointerEvents: 'none' }]}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        ))}
      </ScrollView>
      )}

      {/* ⭐ DEĞİŞTİ — NOKTALAR ARTIK GÖRSELİN İÇİNDE.

          Önce şeridin altındaydı ve altında ~14dp'lik ölü bir şerit
          bırakıyordu; ekranda banner ile "Kategoriler" başlığı
          arasındaki boşluğun bir kısmı buydu.

          ⚠️ Görselin üstüne koymanın bir bedeli var: fotoğrafın o
          bölgesi açık renkliyse noktalar kaybolur. Bu yüzden
          noktalar YARI SAYDAM KOYU BİR HAPIN içinde duruyor — hangi
          fotoğraf olursa olsun okunuyor. İlk yazımda tam da bu
          riskten kaçınmak için dışarı alınmıştı; hap onu çözüyor.

          ⚠️ Kapsayıcı pointerEvents="none": hapın üstüne basmak
          banner'a basmayı engellememeli.

          ⚠️ Tek banner varsa hiç çizilmiyor — bir noktanın
          gösterecek bir şeyi yok. */}
      {bannerlar.length > 1 && (
        <View style={[styles.noktaKatmani, { pointerEvents: 'none' }]}>
          <View style={styles.noktaHap}>
            {bannerlar.map((b, i) => (
              <View
                key={b.id}
                style={[styles.nokta, i === aktif && styles.noktaAktif]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  // ⚠️ flexGrow/flexShrink 0 — yatay ScrollView'in dikey akışta
  // kalan alanı yutma huyu. (SiralamaSeridi'nde yaşandı.)
  seritKap: {
    flexGrow: 0,
    flexShrink: 0,
  },

  kart: {
    // 2:1 — tasarımdaki oran. Görsel bundan farklı oranda olsa
    // bile kutu sabit kalıyor, kırpma resizeMode'un işi.
    aspectRatio: 2,
    borderRadius: kose.dev,
    overflow: 'hidden',
    backgroundColor: renkler.acikKart,
  },

  gorsel: {
    width: '100%',
    height: '100%',
  },

  /* Noktalar görselin ALT-ORTASINDA yüzüyor.
     ⚠️ Mutlak konum + left/right 0 + alignItems:'center' üçlüsü
     genişlik hesabı yapmadan ortalıyor. Sabit bir genişlik
     verseydik nokta sayısı değişince orta kayardı. */
  noktaKatmani: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: bosluk.orta,
    alignItems: 'center',
  },

  /* Yarı saydam koyu hap — noktaların okunmasını fotoğraftan
     bağımsız hale getiriyor.
     ⚠️ Bu rgba ELLE yazılmış ve bilerek: iki temada da SİYAH
     olmalı. Koyu temada açık bir hap, üstündeki fotoğrafı
     aydınlatırdı. Karartma perdesiyle aynı gerekçe. */
  noktaHap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.mikro,
    paddingHorizontal: bosluk.kucuk,
    paddingVertical: 5,
    borderRadius: kose.tam,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },

  nokta: {
    width: 6,
    height: 6,
    borderRadius: kose.tam,

    // ⚠️ Pasif nokta da ELLE beyaz: hapın içindeki zemin siyah,
    // tema nötrleri orada okunmuyor.
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },

  // Aktif nokta yuvarlak değil KISA BİR HAP: renk körü bir
  // kullanıcı için de "hangisi aktif" biçimden okunuyor.
  noktaAktif: {
    width: 18,
    backgroundColor: renkler.anaRenk,
  },
});
