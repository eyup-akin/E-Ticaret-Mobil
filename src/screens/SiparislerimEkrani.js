import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Platform, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { useAuth } from '../context/AuthContext';
import GirisGerekliEkrani from '../components/GirisGerekliEkrani';
import AramaCubugu from '../components/AramaCubugu';
import BosDurum from '../components/BosDurum';
import { SatirListesiIskeleti } from '../components/Iskelet';
import Chip from '../components/Chip';
import Rozet from '../components/Rozet';
import { useSiparisTekrarla } from '../hooks/useSiparisTekrarla';
import { durumYazisi, odemeYazisi, odemeRengi, odemeTamamlanabilirMi } from '../utils/durum';
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

// DURUM ŞERİDİNİN SIRASI VE ETİKETLERİ
//
// ⚠️ Sipariş yaşam döngüsü sırasında: hazırlanıyor → kargoda →
// teslim edildi, sonra iptal. Alfabetik veya sayıya göre sıralamak
// müşterinin zihnindeki akışı bozardı.
//
// ⚠️ Anahtarlar sunucunun döndürdüğü alan adları; Order.Status
// kodlarıyla (durum.js) birebir aynı olmak ZORUNDA değil çünkü
// sunucu camelCase'e çeviriyor (teslim_edildi → teslimEdildi).
// O yüzden ikisini burada AÇIKÇA eşleştiriyoruz — birini değiştirip
// diğerini unutmak, sayacın hep 0 görünmesine yol açardı.
const DURUMLAR = [
  // ⭐ YENİ — ödeme akışının ilk durumu, hazırlanıyordan ÖNCE gelir.
  { ozetAnahtari: 'odemeBekliyor', durumKodu: 'odeme_bekliyor', etiket: 'Ödeme Bekliyor' },
  { ozetAnahtari: 'hazirlaniyor', durumKodu: 'hazirlaniyor', etiket: 'Hazırlanıyor' },
  { ozetAnahtari: 'kargoda', durumKodu: 'kargoda', etiket: 'Kargoda' },
  { ozetAnahtari: 'teslimEdildi', durumKodu: 'teslim_edildi', etiket: 'Teslim Edildi' },
  { ozetAnahtari: 'iptal', durumKodu: 'iptal', etiket: 'İptal' },
];

/* ⭐ YENİ (GV/Faz 7.3) — durum kodu → Rozet tipi.
 *
 * ⚠️ Renk artık `durumRengi()` ile elle verilmiyor, `Rozet`'in
 * tipine bırakılıyor. Sipariş kartı, ürün kartı ve ürün detayı aynı
 * rozet dilini konuşsun diye: üç ekranda üç farklı hap görünümü
 * vardı ve biri değişince diğerleri geride kalıyordu. */
function durumTipi(durum) {
  if (durum === 'teslim_edildi') return 'basari';
  if (durum === 'kargoda') return 'vurgu';
  if (durum === 'iptal') return 'hata';
  return 'uyari';   // hazirlaniyor
}

export default function SiparislerimEkrani({ navigation }) {
  const { token } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  /* ⭐ YENİ — "Siparişi Tekrarla" akışının tamamı ortak hook'ta:
     onay penceresi, sepete ekleme, sonuç ve hata adımları.

     ⚠️ Burada üçüncü tüketici olduk (sipariş detayı ve hızlı
     siparişler). Akış kopyalanmadığı için onay metni, sepet
     tazeleme ve "hiçbiri eklenemedi" dalı üç ekranda da aynı.

     ⚠️ `islemde` TEK BAYRAK, kart başına değil: bir siparişi
     tekrarlarken diğer kartların butonları da kilitleniyor. Kart
     başına tutmak için hook'un durumu id'ye göre saklaması
     gerekirdi; istek yarım saniye sürüyor ve aynı anda iki farklı
     siparişi tekrarlamak diye bir kullanım yok. */
  const {
    sor: tekrarlaSor,
    islemde: tekrarIslemde,
    pencere: tekrarPenceresi,
  } = useSiparisTekrarla();

  const [siparisler, setSiparisler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  // Durum sayaçları (sunucudan) ve seçili filtre.
  //
  // ⚠️ SAYILAR SUNUCUDAN GELİYOR, LİSTEDEN SAYILMIYOR.
  // Sipariş listesi ileride sayfalanacak; elimizdeki diziyi
  // gruplayıp saysaydık yalnızca YÜKLENMİŞ sayfayı sayardık ve
  // "Teslim Edildi (5)" yazarken gerçekte 40 tane olurdu. Rakam
  // patlamaz, sessizce yanlış çıkardı.
  const [ozet, setOzet] = useState(null);

  // null = "Tümü". Durum kodu tutuluyor (teslim_edildi gibi).
  const [seciliDurum, setSeciliDurum] = useState(null);

  // ⭐ YENİ (GV/Faz 9.4) — liste isteği patladı mı?
  // Özet isteğinin hatası buraya YANSIMAZ: o bir süs, listenin
  // kendisi asıl içerik (yukarıdaki allSettled gerekçesi).
  const [agHatasi, setAgHatasi] = useState(false);

  async function siparisleriGetir() {
    try {
      // ⚠️ İki istek PARALEL, arka arkaya değil — aralarında
      // bağımlılık yok.
      //
      // ⚠️ allSettled, all DEĞİL.
      //
      // Promise.all kullansaydık özet ucu patladığında SİPARİŞ
      // LİSTESİ DE düşerdi — müşteri, tamamen çalışan siparişlerini
      // sırf sayaç şeridi yüzünden göremezdi. Özet bir SÜStür, liste
      // asıl içeriktir; süsün hatası içeriği götürmemeli.
      const [listeSonuc, ozetSonuc] = await Promise.allSettled([
        apiGet('/orders'),
        apiGet('/orders/durum-ozeti'),
      ]);

      if (listeSonuc.status === 'fulfilled') {
        setSiparisler(listeSonuc.value);
        setAgHatasi(false);
      } else {
        // ⭐ DEĞİŞTİ (GV/Faz 9.4) — hata artık ekrana çıkıyor.
        // Eskiden yalnızca konsola yazılıyordu ve müşteri "Henüz
        // siparişin yok" görüyordu; oysa siparişleri duruyor,
        // ulaşamayan biziz.
        console.log('Siparişler alınamadı:', listeSonuc.reason?.message);
        setSiparisler([]);
        setAgHatasi(true);
      }

      if (ozetSonuc.status === 'fulfilled') {
        setOzet(ozetSonuc.value);
      } else {
        console.log('Durum özeti alınamadı:', ozetSonuc.reason?.message);
      }
    } finally {
      setYukleniyor(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      siparisleriGetir();
    }, [token])
  );

  // Önce durum filtresi, sonra arama.
  //
  // İkisi BİRLİKTE çalışıyor: "Kargoda" seçiliyken arama yapmak
  // yalnızca kargodakiler içinde arar. Arama seçili durumu sıfırlasaydı
  // müşteri neden farklı sonuç gördüğünü anlamazdı.
  const durumFiltreli = seciliDurum
    ? siparisler.filter((s) => s.status === seciliDurum)
    : siparisler;

  const filtreliSiparisler = aramaMetni
    ? durumFiltreli.filter((s) => {
        const kelime = aramaMetni.toLowerCase();
        // Numara harf içeriyor (SP-260724-4821), o yüzden karşılaştırmadan
        // önce küçük harfe çeviriyoruz.
        const noEslesme = (s.orderNumber || '').toLowerCase().includes(kelime);
        const urunEslesme = s.items.some((u) => u.productName.toLowerCase().includes(kelime));
        return noEslesme || urunEslesme;
      })
    : durumFiltreli;

  /* ⭐ DEĞİŞTİ (GV/Faz 7.3) — SİPARİŞ KARTI YENİDEN KURULDU.
   *
   * Sıra: üstte durum rozeti + tarih, altında sipariş no, sonra ürün
   * özeti, en altta ödeme bilgisi + tutar.
   *
   * ⚠️ Eskiden numara ve tutar aynı satırdaydı; müşterinin bu ekranda
   * aradığı ilk şey "nerede kaldı" yani DURUM. Numara arama yaparken
   * lazım oluyor, ilk bakışta değil. */
  function siparisKarti({ item }) {
    const odemeR = odemeRengi(item.paymentStatus, renkler);

    const urunOzet = item.items.map((u) => u.productName + ' × ' + u.quantity).join(', ');

    const odemeIkon =
      item.paymentStatus === 'odendi' ? 'checkmark-circle'
      : item.paymentStatus === 'iade_edildi' ? 'arrow-undo-outline'
      // ⭐ YENİ — ödeme alınamadıysa uyarı ikonu; "bekliyor" ile
      // "reddedildi" aynı saat ikonunu paylaşmamalı.
      : item.paymentStatus === 'odeme_basarisiz' ? 'close-circle-outline'
      : 'time-outline';

    // ⭐ YENİ — ödemesi yarım kalmış sipariş. Kural utils/durum.js'te
    // tek yerde: "doğrulanıyor" olanlar HARİÇ (para çekilmiş olabilir,
    // ikinci deneme çift ödeme demek).
    const odemeBekliyor = odemeTamamlanabilirMi({
      durum: item.status,
      odemeDurumu: item.paymentStatus,
    });

    return (
      <TouchableOpacity
        style={styles.kart}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('SiparisDetay', { siparisId: item.id })}
      >
        <View style={styles.kartUst}>
          <Rozet tip={durumTipi(item.status)} yazi={durumYazisi(item.status)} />
          <Text style={styles.tarih}>{tarihBicimle(item.createdAt)}</Text>
        </View>

        <Text style={styles.siparisNo}>{item.orderNumber}</Text>

        <Text style={styles.urunOzet} numberOfLines={2}>{urunOzet}</Text>

        <View style={styles.kartAlt}>
          <View style={styles.odeme}>
            <Ionicons name={odemeIkon} size={14} color={odemeR} />
            <Text style={[styles.odemeYazi, { color: odemeR }]}>
              {odemeYazisi(item.paymentStatus)}
            </Text>

            {/* ⭐ DEĞİŞTİ — kart son 4 hanesi ödeme onaylanınca
                yazılıyor. Boşken "•••• " yazmak, olmayan bir kartı
                varmış gibi göstermek olurdu. */}
            {item.cardLast4 ? (
              <Text style={styles.kartBilgi}>•••• {item.cardLast4}</Text>
            ) : null}
          </View>

          {/* ⚠️ Tutar turuncu DEĞİL: bu ekranda tıklanabilir olan
              kartın kendisi ve turuncu bu uygulamada eylem demek.
              Aynı düzeltme sepette, onay ve başarı ekranlarında da
              yapıldı. */}
          <Text style={styles.tutar}>{paraBicimle(item.total)}</Text>

        </View>

        {/* ⭐⭐ DEĞİŞTİ — BUTON KENDİ SATIRINDA, TAM GENİŞLİKTE.
            ⚠️ Ödeme bilgisi, tutar ve buton AYNI SATIRDAYDI ve üçü
            birbirinin üstüne biniyordu: kart numarası tutarın altında
            kalıyor, "₺43.970,13" gibi uzun bir tutarda ikisi iç içe
            geçiyordu (cihazda görüldü). Dar ekranda üç öğeyi bir
            satıra sığdırmak mümkün değil.
            ⚠️ Artık DOLU turuncu: kendi satırında tek başına
            durduğuna göre kartın asıl dokunuşuyla yarışmıyor ve
            tasarım referansı da böyle. */}
        {/* ⭐ YENİ — ÖDEMESİ YARIM KALAN SİPARİŞ.
            ⚠️ "Siparişi Tekrarla" YERİNE, yanına değil: o buton sepeti
            dolduruyor ve müşteri ödenmemiş siparişi tekrarlarsa
            backend eskisini iptal eder (K7) — yani parasını ödemek
            isterken siparişini iptal etmiş olurdu. */}
        {odemeBekliyor ? (
          <TouchableOpacity
            style={styles.tekrarButon}
            onPress={() => navigation.navigate('OdemeEkrani', {
              siparisId: item.id,
              siparisNo: item.orderNumber,
              toplam: item.total,
            })}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={item.orderNumber + ' siparişinin ödemesini tamamla'}
          >
            <Text style={styles.tekrarYazi}>Ödemeyi Tamamla</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.tekrarButon, tekrarIslemde && styles.tekrarButonPasif]}
            onPress={() => tekrarlaSor(item.id)}
            disabled={tekrarIslemde}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={item.orderNumber + ' siparişini tekrarla'}
          >
            {tekrarIslemde ? (
              <ActivityIndicator size="small" color={renkler.anaRenkUstuYazi} />
            ) : (
              <Text style={styles.tekrarYazi}>Siparişi Tekrarla</Text>
            )}
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  if (!token) {
    return (
      <GirisGerekliEkrani
        ikon="receipt-outline"
        baslik="Siparişlerini görmek için giriş yap"
        aciklama="Verdiğin siparişleri ve kargo durumlarını buradan takip edebilirsin."
      />
    );
  }

  /* ⭐ DEĞİŞTİ (GV/Faz 9.2) — çark yerine satır iskeleti.
     Başlık da iskeletin üstünde duruyor: eskiden yükleme boyunca
     ekran tamamen boştu ve "Siparişlerim" yazısı içerikle birlikte
     birden beliriyordu. */
  if (yukleniyor) {
    return (
      <SafeAreaView style={styles.kapsayici} edges={['top']}>
        <Text style={styles.baslik}>Siparişlerim</Text>
        <SatirListesiIskeleti />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <Text style={styles.baslik}>Siparişlerim</Text>

      {agHatasi ? (
        /* ⚠️ Ağ hatası "sipariş yok" DEĞİL. Ayrı bir ikon, ayrı bir
           cümle ve gerçekten yapılabilecek bir eylem: tekrar dene. */
        <BosDurum
          ikon="cloud-offline-outline"
          baslik="Bağlanamadık"
          aciklama="Siparişlerin yüklenemedi. İnternet bağlantını kontrol edip tekrar dene."
          eylemYazisi="Tekrar Dene"
          onEylem={() => { setYukleniyor(true); siparisleriGetir(); }}
        />
      ) : siparisler.length === 0 ? (
        /* ⭐ DEĞİŞTİ (GV/Faz 7.3) — boş durum ortak bileşene geçti.
           Eskiden yerinde çizilmiş bir ikon + tek satır yazıydı ve
           müşteriye gidecek bir yer önermiyordu. */
        <BosDurum
          ikon="receipt-outline"
          baslik="Henüz siparişin yok"
          aciklama="Beğendiğin ürünleri sepete ekleyip ilk siparişini verebilirsin."
          eylemYazisi="Alışverişe Başla"
          onEylem={() => navigation.navigate('AnaSayfa', { screen: 'AnaSayfaMain' })}
        />
      ) : (
        <>
          {/* DURUM ŞERİDİ

              ⚠️ Yol haritasında bu "her durum bir satır" olarak
              tasarlanmıştı. Dikey liste, asıl içeriği (siparişleri)
              ekranın altına iterdi. Yatay şerit aynı sayıları
              gösteriyor ve üstüne FİLTRE işlevi kazandırıyor.

              ⚠️ SAYISI 0 OLAN DURUM DA ÇİZİLİYOR ama basılamıyor.
              "İptal (0)" görmek müşteriye "iptalim yok" der; satırın
              hiç olmaması "burada iptal diye bir şey yok mu?" sorusunu
              doğurur.

              ⭐ DEĞİŞTİ (GV/Faz 7.3) — çipler artık ortak `Chip`
              bileşeni. Bu dosyada elle yazılmış bir kopyası vardı ve
              yorumunda "ikinci tüketici çıkınca ortak yere taşınır"
              yazıyordu; Chip Faz 2.3'te yazıldı, taşıma bugün yapıldı.
              Pasif hâl için Chip'e `pasif` prop'u eklendi. */}
          {ozet && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.durumSeritKap}
              contentContainerStyle={styles.durumSerit}
              directionalLockEnabled
            >
              {/* "Tümü" çipi — seçili durumdan çıkış yolu. Olmasaydı
                  müşteri tüm listeye dönmek için aynı çipe tekrar
                  basmayı tahmin etmek zorunda kalırdı. */}
              <Chip
                etiket={`Tümü (${ozet.toplam ?? 0})`}
                secili={seciliDurum === null}
                onBas={() => setSeciliDurum(null)}
              />

              {DURUMLAR.map((d) => {
                const adet = ozet[d.ozetAnahtari] ?? 0;

                return (
                  <Chip
                    key={d.durumKodu}
                    etiket={`${d.etiket} (${adet})`}
                    secili={seciliDurum === d.durumKodu}
                    pasif={adet === 0}
                    onBas={() => setSeciliDurum(d.durumKodu)}
                  />
                );
              })}
            </ScrollView>
          )}

          <View style={styles.aramaYeri}>
            <AramaCubugu
              value={aramaMetni}
              onChangeText={setAramaMetni}
              onSubmit={() => {}}
              placeholder="Sipariş no veya ürün ara..."
            />
          </View>

          <FlatList
            data={filtreliSiparisler}
            keyExtractor={(item) => item.id.toString()}
            renderItem={siparisKarti}
            contentContainerStyle={styles.liste}
            /* ⚠️ Burada `BosDurum` KULLANILMADI, tek satır yazı kaldı.
               Bu bir "içerik yok" hâli değil, bir arama sonucu: liste
               dolu, sadece bu kelimeye uyan yok. Ekranın yarısını
               kaplayan bir daire, üstteki arama kutusunu ve durum
               şeridini aşağı iterdi — oysa müşterinin bir sonraki
               hamlesi tam da onlar. */
            ListEmptyComponent={
              <Text style={styles.aramaBos}>Eşleşen sipariş bulunamadı.</Text>
            }
          />
        </>
      )}

      {/* ⭐ Tekrarlama akışının penceresi — onay, "sepete eklendi"
          ve hata adımlarının üçü de burada. Hook döndürüyor, ekran
          yalnızca çiziyor.

          ⚠️ Koşullu blokların DIŞINDA: liste boşken de açık
          kalabilmeli. (Pratikte olmaz ama pencereyi bir listenin
          varlığına bağlamak sonradan kırılacak bir bağ olurdu.) */}
      {tekrarPenceresi}
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },


  baslik: {
    fontSize: yazi.baslik,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    textAlign: 'center',
    paddingHorizontal: sayfaKenari,
    paddingTop: bosluk.orta,
    paddingBottom: bosluk.orta,
  },

  /* ⚠️⚠️ Yatay ScrollView'a `style` VERİLMEZSE dikey eksende
     esniyor ve altındaki arama çubuğunun üstüne biniyor — çipler
     de dikey gerilip yazıları kırpılıyordu. Aynı tuzak ana
     sayfadaki şeritte de yaşanmıştı. */
  durumSeritKap: {
    flexGrow: 0,
    flexShrink: 0,
  },

  durumSerit: {
    paddingHorizontal: sayfaKenari,
    paddingBottom: bosluk.orta,
    gap: bosluk.kucuk,
    alignItems: 'center',
  },

  aramaYeri: {
    paddingHorizontal: sayfaKenari,
    paddingBottom: bosluk.kucuk,
  },

  liste: {
    paddingHorizontal: sayfaKenari,
    paddingBottom: bosluk.genis,
    gap: bosluk.orta,
  },

  aramaBos: {
    fontSize: yazi.normal,
    color: renkler.yaziGri,
    textAlign: 'center',
    marginTop: bosluk.genis,
  },


  /* ---------- SİPARİŞ KARTI ---------- */

  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
  },

  kartUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.kucuk,
    marginBottom: bosluk.kucuk,
  },

  tarih: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
  },

  /* ⚠️ DÜZELTME (GV/Faz 7.3): burada `fontFamily` İKİ KEZ yazılıydı —
     önce Platform.select ile eşit genişlikli font, hemen ardından
     font.kalin. İkincisi birincisini eziyordu, yani numaralar hiçbir
     zaman hizalanmıyordu ve yorum yalan söylüyordu.

     Eşit genişlikli font korundu (alt alta gelen numaralar hizalı
     okunsun diye). ⚠️ Bunun bedeli: özel fontla birlikte kalınlık
     çalışmıyor, o yüzden `fontWeight` de kaldırıldı — duran ama
     etkisi olmayan bir satır bırakmak sonraki okuyucuyu yanıltırdı.
     Ayrımı harf aralığı ve renk veriyor. */
  siparisNo: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontSize: yazi.normal,
    letterSpacing: 0.5,
    color: renkler.yaziKoyu,
  },

  urunOzet: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
    marginTop: bosluk.kucuk,
  },

  kartAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.kucuk,
    marginTop: bosluk.orta,
    paddingTop: bosluk.orta,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
  },

  /* ⚠️ Satırda artık İKİ şey var (ödeme · tutar) ve daralınca
     kısalacak olan bu: tutar okunaklı kalmalı. Ödeme bilgisi
     kartın en az kritik parçası. */
  odeme: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.mikro,
    flexShrink: 1,
    minWidth: 0,
  },

  odemeYazi: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },

  kartBilgi: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginLeft: bosluk.mikro,
  },

  tutar: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,

    // ⚠️ Tutar kısalmasın, kısalacaksa soldaki ödeme bilgisi
    // kısalsın. Rakamın ortasından kesilen bir fiyat okunamaz.
    flexShrink: 0,
  },

  /* ---------- SİPARİŞİ TEKRARLA ---------- */

  /* ⭐ DEĞİŞTİ — tam genişlik, dolu turuncu.
     ⚠️ `minWidth` KALKTI: o değer buton bir satırın sağındayken
     "Kopyalandı"ya benzer metin değişimlerinde zıplamasın diye
     vardı. Genişlik artık kartın kendisi tarafından belirleniyor. */
  tekrarButon: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
    marginTop: bosluk.orta,
    borderRadius: kose.orta,
    backgroundColor: renkler.anaRenk,
  },

  tekrarButonPasif: {
    opacity: 0.5,
  },

  tekrarYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.anaRenkUstuYazi,
  },
});
