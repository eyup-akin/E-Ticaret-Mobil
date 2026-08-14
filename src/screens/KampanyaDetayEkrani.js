import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import { kampanyaGetir } from '../services/kampanyalar';
import { paraBicimle } from '../utils/bicimlendir';

// ============================================================
//  KAMPANYA DETAYI
//
//  Banner'a basınca açılıyor. Kampanyanın ne olduğunu, ne zamana
//  kadar sürdüğünü, hangi kuponları içerdiğini ve koşullarını
//  gösteriyor.
//
//  ⚠️ NEDEN AYRI EKRAN, NEDEN "KUPON DETAYI" DEĞİL?
//
//  Bir kampanya BİRDEN ÇOK kupon içerebiliyor (afişlerde ikişer
//  üçer kod var) ve kuponsuz bir kampanya da olabilir — "seçili
//  kategorilerde %40'a varan indirim" gibi. Kupon detay ekranı
//  yapsaydık:
//    • İki kuponlu kampanyada hangisini gösterecektik?
//    • Kuponsuz kampanyanın gidecek yeri olmayacaktı
//
//  Kampanya birinci sınıf kavram, kupon onun bir parçası.
//
//  ⚠️ KUPON BİLGİSİ SUNUCUDAN OKUNUYOR, kampanya metninden değil.
//
//  Kampanya açıklaması yerel ve uydurma; ama "%15 indirim",
//  "en az 1.000 TL" gibi SAYILAR sunucudaki kupon kaydından
//  geliyor. Metne yazsaydık admin kuponu değiştirdiğinde ekran
//  eski sayıyı göstermeye devam ederdi — ve müşteri gördüğü
//  indirimi alamazdı.
//
//  Bu, projenin "yanlış sayı, eksik sayıdan tehlikelidir"
//  kuralının doğrudan uygulaması: kupon çekilemezse kart hiç
//  çizilmiyor, yaklaşık bir değer uydurulmuyor.
// ============================================================
export default function KampanyaDetayEkrani({ route, navigation }) {
  const { kampanyaId } = route.params;

  const { renkler } = useTema();
  const { width: ekranGenisligi } = useWindowDimensions();
  const styles = stilOlustur(renkler);

  const [kampanya, setKampanya] = useState(null);
  const [kuponlar, setKuponlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kopyalanan, setKopyalanan] = useState(null);

  /* ⭐ YENİ — AFİŞİN GERÇEK ORANI.
   *
   * ⚠️ Kutu SABİT 2:1 İDİ ve afiş `cover` ile kırpılıyordu. Kampanya
   * görselleri tasarlanmış birer poster: her pikselinde yazı var ve
   * kırpılan kenar çoğu zaman kupon kodunun kendisi oluyordu.
   * Müşteri "kuponu göremiyorum" diyordu — haklı olarak.
   *
   * Oran artık görselin kendisinden okunuyor, yani hiçbir şey
   * kırpılmıyor. 2 yalnızca ölçülene kadarki başlangıç değeri
   * (panelin önerdiği oran) — sıfır verseydik yükleme anında
   * yerleşim zıplardı. */
  const [gorselOrani, setGorselOrani] = useState(2);

  /* ⭐ YENİ (B2) — kampanya artık SUNUCUDAN geliyor, yani
     alınamama ihtimali var. Veri yerelken bu durum yoktu.

     ⚠️ Mesaj sunucudan geliyor ve iki durumu ayırıyor: kampanya
     silinmiş/yayından kaldırılmışsa "bulunamadı", bağlantı yoksa
     "sunucuya ulaşılamadı". Tek bir "bulunamadı" yazsaydık kopuk
     internetteki müşteri kampanyanın kaldırıldığını sanırdı. */
  const [hata, setHata] = useState('');

  useEffect(() => {
    let iptal = false;

    (async () => {
      let k;

      try {
        k = await kampanyaGetir(kampanyaId);
      } catch (e) {
        if (iptal) return;

        setHata(e.message);
        setYukleniyor(false);
        return;
      }

      if (iptal) return;

      setKampanya(k);

      // ⚠️ Kupon başına ayrı istek atılıyor ama bu kabul edilebilir:
      // bir kampanyada en fazla 2-3 kupon var. Toplu bir uç yazmak
      // (idler=... gibi) üç istek için fazladan bir uç demekti.
      //
      // ⚠️ allSettled: bir kupon silinmişse diğerleri yine gelsin.
      // Promise.all olsaydı tek bir eksik kupon bütün listeyi
      // düşürürdü.
      const sonuclar = await Promise.allSettled(
        k.kuponKodlari.map((kod) => apiGet('/coupons/' + encodeURIComponent(kod)))
      );

      if (iptal) return;

      setKuponlar(
        sonuclar
          .filter((s) => s.status === 'fulfilled' && s.value)
          .map((s) => s.value)
      );

      setYukleniyor(false);
    })();

    return () => { iptal = true; };
  }, [kampanyaId]);

  async function kodKopyala(kod) {
    await Clipboard.setStringAsync(kod);
    setKopyalanan(kod);

    // ⚠️ "Kopyalandı" geri bildirimi geçici: kalıcı olsaydı
    // müşteri ikinci kez kopyalamak isteyince butonun çalışıp
    // çalışmadığını anlayamazdı.
    setTimeout(() => setKopyalanan(null), 1800);
  }

  // İndirim metnini KUPON KAYDINDAN üretiyoruz.
  function indirimMetni(k) {
    return k.discountType === 'yuzde'
      ? `%${k.discountValue.toFixed(0)} indirim`
      : `${paraBicimle(k.discountValue)} indirim`;
  }

  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  if (!kampanya) {
    return (
      <View style={styles.ortala}>
        <Text style={styles.bosYazi}>{hata || 'Kampanya bulunamadı.'}</Text>

        {/* ⚠️ Geri butonu BURADA da lazım: yüzen buton yalnızca
            içerik çizildiğinde görünüyor ve müşteri bu ekranda
            kalırsa çıkacak yeri kalmazdı. */}
        <TouchableOpacity
          style={styles.bosGeri}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.bosGeriYazi}>Geri dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    /* ⭐ DEĞİŞTİ — edges artık ['top'].
     *
     * ⚠️ Eskiden boştu ve görsel ekranın en tepesinden başlıyordu;
     * geri butonu da onun ÜSTÜNDE yüzüyordu. Ürün detayında bu
     * doğru bir karar: orada hero bir ürün fotoğrafı ve köşesi
     * genelde boş. Kampanya afişi ise tasarlanmış bir poster —
     * köşede de yazı var ve buton onu kapatıyordu. */
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      {/* ⭐ YENİ — GERİ BUTONU ARTIK GÖRSELİN ÜSTÜNDE DEĞİL.
          Kendi şeridinde duruyor; afişin hiçbir yeri kapanmıyor. */}
      <View style={styles.ustBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.geriButon}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <Text style={styles.ustBaslik} numberOfLines={1}>Kampanya</Text>
      </View>

      <ScrollView contentContainerStyle={styles.icerik} showsVerticalScrollIndicator={false}>
        {/* ⚠️ Genişlik ekranın TAMAMI: afiş ne kadar geniş olursa
            içindeki kupon o kadar okunur. Kenar boşluğu vermek onu
            daraltmaktan başka bir işe yaramazdı. */}
        <Image
          source={kampanya.gorsel}
          style={{ width: ekranGenisligi, height: ekranGenisligi / gorselOrani }}
          resizeMode="cover"
          onLoad={(olay) => {
            // ⚠️ `source` uzak görsellerde de dolu geliyor; asıl
            // ölçüler burada. Sıfıra bölmeye karşı korumalı.
            const { width, height } = olay.nativeEvent.source ?? {};
            if (width > 0 && height > 0) setGorselOrani(width / height);
          }}
        />

        <View style={styles.yaprak}>
          <Text style={styles.baslik}>{kampanya.baslik}</Text>

          <View style={styles.sureSatiri}>
            <Ionicons name="time-outline" size={15} color={renkler.yaziGri} />
            <Text style={styles.sureYazi}>{kampanya.bitisMetni}</Text>
          </View>

          <Text style={styles.aciklama}>{kampanya.aciklama}</Text>
        </View>

        {/* ---------- KUPONLAR ---------- */}
        {/* ⚠️ Hiç kupon çekilemediyse bölüm HİÇ çizilmiyor.
            "Kupon yüklenemedi" yazmak müşteriye yapabileceği bir
            şey sunmuyor; kampanya metni yine okunabiliyor. */}
        {kuponlar.length > 0 && (
          <View style={styles.bolum}>
            <Text style={styles.bolumBaslik}>Kampanya kuponları</Text>

            {kuponlar.map((k) => (
              <View key={k.id ?? k.code} style={styles.kuponKart}>
                <View style={styles.kuponSol}>
                  <Text style={styles.kuponKod}>{k.code}</Text>
                  <Text style={styles.kuponIndirim}>{indirimMetni(k)}</Text>

                  {/* ⚠️ Alt sınır SUNUCUDAN. Metne yazsaydık admin
                      değiştirdiğinde ekran eski sayıda kalırdı. */}
                  {k.minOrderAmount > 0 && (
                    <Text style={styles.kuponKosul}>
                      En az {paraBicimle(k.minOrderAmount)} sepette geçerli
                    </Text>
                  )}

                  {/* ⭐ B1'in karşılığı: kupon indirimli üründe
                      geçmiyorsa müşteri bunu SEPETE GİRMEDEN önce
                      bilmeli. Sepette öğrenmek "kuponum çalışmadı"
                      hissi yaratırdı. */}
                  {k.indirimliUrunlerdeGecerli === false && (
                    <Text style={styles.kuponUyari}>
                      İndirimli ürünlerde geçerli değildir.
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.kopyaButon, kopyalanan === k.code && styles.kopyaButonAktif]}
                  onPress={() => kodKopyala(k.code)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={kopyalanan === k.code ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={renkler.anaRenkUstuYazi}
                  />
                  <Text style={styles.kopyaYazi}>
                    {kopyalanan === k.code ? 'Kopyalandı' : 'Kopyala'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ---------- KOŞULLAR ---------- */}
        {kampanya.kosullar?.length > 0 && (
          <View style={styles.bolum}>
            <Text style={styles.bolumBaslik}>Kampanya koşulları</Text>

            {kampanya.kosullar.map((madde, i) => (
              <View key={i} style={styles.maddeSatir}>
                <View style={styles.maddeNokta} />
                <Text style={styles.maddeYazi}>{madde}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: { flex: 1, backgroundColor: renkler.arkaPlan },

  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: renkler.arkaPlan,
  },

  bosYazi: {
    fontSize: yazi.orta,
    fontFamily: font.normal,
    color: renkler.yaziGri,
    textAlign: 'center',
    paddingHorizontal: bosluk.genis,
  },

  bosGeri: {
    marginTop: bosluk.normal,
    paddingHorizontal: bosluk.genis,
    paddingVertical: bosluk.kucuk,
    borderRadius: kose.orta,
    borderWidth: 1,
    borderColor: renkler.anaRenk,
  },

  bosGeriYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.anaRenk,
  },

  icerik: { paddingBottom: bosluk.dev },

  /* ⭐ YENİ — üst şerit. Favorilerim ve Hızlı Siparişlerim ile aynı
     desen: ok solda mutlak konumda, başlık ortalı. */
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sayfaKenari,
    paddingTop: bosluk.kucuk,
    paddingBottom: bosluk.kucuk,
  },

  /* ⚠️ Ok MUTLAK KONUMDA: akışta olsaydı başlığı sağa iter ve
     ortalama okun genişliğine bağlı kalırdı. */
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
    fontSize: yazi.orta,
    lineHeight: satir.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  /* ⭐ DEĞİŞTİ — yaprak artık görselin ÜSTÜNE BİNMİYOR.
     ⚠️ Eskiden `marginTop: -bosluk.genis` ile 24dp biniyordu ve
     afişin alt şeridini kapatıyordu. Görsel artık kırpılmadan tam
     gösterildiği için alt kenarını örtmek, kazanılan alanı geri
     vermek olurdu. */
  yaprak: {
    backgroundColor: renkler.kartArka,
    paddingHorizontal: bosluk.normal,
    paddingTop: bosluk.normal,
    paddingBottom: bosluk.normal,
  },

  baslik: {
    fontSize: yazi.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    lineHeight: satir.baslik,
    color: renkler.yaziKoyu,
  },

  sureSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.mikro,
    marginTop: bosluk.kucuk,
  },

  sureYazi: {
    fontSize: yazi.kucuk,
    fontFamily: font.orta,
    lineHeight: satir.kucuk,
    color: renkler.yaziGri,
  },

  aciklama: {
    fontSize: yazi.normal,
    fontFamily: font.normal,
    lineHeight: satir.normal,
    color: renkler.yaziOrta,
    marginTop: bosluk.orta,
  },

  bolum: {
    marginTop: bosluk.normal,
    paddingHorizontal: sayfaKenari,
  },

  bolumBaslik: {
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.orta,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.orta,
  },

  /* ⚠️ Kupon kartı KESİKLİ kenarlıklı değil.
     Tasarımda bilet görünümü için kesik çizgi cazipti ama
     borderStyle:'dashed' Android'de yuvarlak köşelerle birlikte
     çizilmiyor (tasarım sistemi skill'inde yazılı). Ayrımı dolu
     kenarlık ve yumuşak turuncu zemin veriyor. */
  /* ⭐ DEĞİŞTİ — KUPON KARTI ARTIK ALT ALTA, YAN YANA DEĞİL.
   *
   * ⚠️ Eskiden satırdı: solda kod, sağda 118dp'lik "Kopyala"
   * butonu. Kupon kodu (HOSGELDIN300 gibi uzun ve harf aralıklı)
   * kalan dar alana sıkışıyordu — müşterinin bu ekranda okuması
   * gereken TEK şey oydu.
   *
   * Şimdi kod tam genişlikte, buton altında. Dikeyde birkaç piksel
   * daha yer kaplıyor ama bu ekranda aşağı kaydırılacak yer zaten
   * bol; darlık dikeyde değil yataydaydı. */
  kuponKart: {
    backgroundColor: renkler.yumusakVurgu,
    borderWidth: 1,
    borderColor: renkler.anaRenk,
    borderRadius: kose.buyuk,
    padding: bosluk.normal,
    marginBottom: bosluk.orta,
    gap: bosluk.normal,
  },

  kuponSol: { minWidth: 0 },

  kuponKod: {
    // ⭐ DEĞİŞTİ — bir punto büyüdü. Ekranın asıl bilgisi bu ve
    // artık genişlik sıkıntısı yok.
    fontSize: yazi.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    lineHeight: satir.buyuk,
    color: renkler.yaziKoyu,

    // ⚠️ Kod büyük harfli ve aralıklı: müşteri bunu elle de
    // yazabilmeli, harfler birbirine girmemeli.
    letterSpacing: 0.5,
  },

  kuponIndirim: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.normal,
    color: renkler.anaRenk,
    marginTop: 2,
  },

  kuponKosul: {
    fontSize: yazi.kucuk,
    fontFamily: font.normal,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
    marginTop: bosluk.mikro,
  },

  kuponUyari: {
    fontSize: yazi.kucuk,
    fontFamily: font.orta,
    lineHeight: satir.kucuk,
    color: renkler.uyari,
    marginTop: bosluk.mikro,
  },

  /* ⭐ DEĞİŞTİ — buton artık kartın TAM GENİŞLİĞİNDE.
     ⚠️ `minWidth: 118` kalktı: o değer, buton bir satırın sağında
     dururken "Kopyalandı" yazısına geçince zıplamasın diye vardı.
     Genişlik artık kartın kendisi tarafından belirleniyor, yani
     metin değişse de tek piksel oynamıyor. */
  kopyaButon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.mikro,
    backgroundColor: renkler.anaRenk,
    paddingHorizontal: bosluk.orta,
    paddingVertical: bosluk.orta,
    borderRadius: kose.orta,
  },

  kopyaButonAktif: { backgroundColor: renkler.basari },

  kopyaYazi: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.kucuk,
    color: renkler.anaRenkUstuYazi,
  },

  maddeSatir: {
    flexDirection: 'row',
    gap: bosluk.kucuk,
    marginBottom: bosluk.kucuk,
  },

  // ⚠️ Madde işareti olarak "•" karakteri değil bir View:
  // metin karakteri satır yüksekliğine göre kayıyor ve maddeler
  // hizasız duruyordu.
  maddeNokta: {
    width: 5,
    height: 5,
    borderRadius: kose.tam,
    backgroundColor: renkler.yaziGri,
    marginTop: 7,
  },

  maddeYazi: {
    flex: 1,
    fontSize: yazi.normal,
    fontFamily: font.normal,
    lineHeight: satir.normal,
    color: renkler.yaziOrta,
  },
});
