import React, { useState, useCallback } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';

import { useAuth } from '../context/AuthContext';
import GirisGerekliEkrani from '../components/GirisGerekliEkrani';

import AramaCubugu from '../components/AramaCubugu';
import SepetSatiri from '../components/SepetSatiri';
import OnayPenceresi from '../components/OnayPenceresi';
import BosDurum from '../components/BosDurum';
import { paraBicimle } from '../utils/bicimlendir';

export default function SepetEkrani({ navigation }) {

  const { token } = useAuth();

  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const {
    sepet,
    yukleniyor,
    pasifUrunSayisi,
    sepetiYukle,
    adetGuncelle,
    sepettenCikar,

    // kupon
    kupon,
    kuponYukleniyor,
    kuponUyari,
    indirimTutari,
    kuponUygula,
    kuponuKaldir,
    kuponUyariyiTemizle,

    // kargo dahil özet (sunucudan geliyor)
    ozet,
  } = useSepet();

  const [aramaMetni, setAramaMetni] = useState('');

  // kupon giriş kutusundaki metin
  const [kuponGirdi, setKuponGirdi] = useState('');

  // deneme sonucu mesajı: { tip: 'basari' | 'hata', metin }
  //
  // Bunu context'te DEĞİL burada tutuyoruz çünkü bu bir EKRAN olayı:
  // "az önceki denemenin sonucu". Başka ekranı ilgilendirmiyor ve
  // ekrandan çıkıp dönünce sıfırlanması doğru davranış.
  const [kuponMesaj, setKuponMesaj] = useState(null);

  // Ekran her odağa geldiğinde sepeti yenile
  useFocusEffect(
    useCallback(() => {
      // Misafirse veri çekme — 401 hatası basmasın
      if (!token) return;
      sepetiYukle();
    }, [token])
  );

  // ⚠️ Silinecek kalem STATE'TE tutuluyor, pencereye argüman olarak
  // geçilmiyor: pencere kapanırken hangi ürünün silineceğini hâlâ
  // bilmesi gerekiyor. null = pencere kapalı.
  const [silinecek, setSilinecek] = useState(null);

  async function kuponuDene() {
    const sonuc = await kuponUygula(kuponGirdi);

    setKuponMesaj({
      tip: sonuc.basarili ? 'basari' : 'hata',
      metin: sonuc.mesaj,
    });

    if (sonuc.basarili) {
      // Başarılıysa kutuyu boşalt — kupon artık aşağıda kartta görünüyor,
      // kutuda da durması gereksiz tekrar olurdu.
      setKuponGirdi('');
    }
  }

  function kuponuCikar() {
    kuponuKaldir();
    setKuponMesaj(null);
    setKuponGirdi('');
  }

  // Arama sadece GÖRÜNÜMÜ süzer, toplamı etkilemez
  const filtreliSepet = aramaMetni
    ? sepet.filter((s) => s.productName.toLowerCase().includes(aramaMetni.toLowerCase()))
    : sepet;


  // ÜCRETSİZ KARGO İLERLEMESİ
  //
  // ⚠️ EŞİĞİ AYRI BİR İSTEKLE SORMUYORUZ.
  //
  // Sunucu "kaç TL kaldı"yı zaten söylüyor ve "şu an ne kadarlık
  // sepetin var"ı da biliyoruz. İkisinin toplamı eşiğin ta kendisi:
  //     kalan = eşik − mevcut   →   eşik = kalan + mevcut
  //
  // Eşiği ayrıca sormak, ilerleme çubuğunun paydası ile payının
  // FARKLI ANLARIN verisi olması riskini getirirdi. Aynı cevaptan
  // türettiğimiz için çubuk her zaman kendi içinde tutarlı.
  //
  // ⚠️ Mevcut tutar olarak İNDİRİMLİ tutarı alıyoruz, ara toplamı
  // değil — sunucudaki eşik kuralı da indirimli tutara bakıyor
  // (bkz. SepetHesaplayici). Ara toplamı kullansaydık çubuk dolu
  // görünürken kargo ücretli çıkardı.
  const indirimliTutar = ozet ? ozet.araToplam - indirimTutari : 0;
  const kargoEsigi = ozet ? ozet.ucretsizKargoyaKalan + indirimliTutar : 0;

  // Math.min(1, ...): eşik aşıldığında çubuk taşmasın. Bu durumda
  // zaten "kazanıldı" rozeti çiziliyor ama savunmacı olmak bedava.
  const kargoOrani = kargoEsigi > 0
    ? Math.min(1, indirimliTutar / kargoEsigi)
    : 0;

  // ⭐ YENİ (GV/Faz 6.6) — sipariş akışı başlayabilir mi?
  //
  // Türetilmiş; ayrı state yok. Alt çubuk hem butonun kilidini hem de
  // kendi şeklini buna göre kuruyor.
  const siparisEngelli = pasifUrunSayisi > 0;


  // 🔒 MİSAFİR KAPISI — tüm hook'lardan SONRA, ilk return'den ÖNCE
  if (!token) {
    return (
      <GirisGerekliEkrani
        ikon="cart-outline"
        baslik="Sepetini görmek için giriş yap"
        aciklama="Sepetine ürün ekleyip kolayca sipariş verebilirsin."
      />
    );
  }

  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  /* ⭐ YENİ (GV/Faz 6.2) — ÜCRETSİZ KARGO ŞERİDİ, LİSTENİN ÜSTÜNDE.
     Eskiden alt panelin içindeydi ve toplamla birlikte ekranın
     dibinde duruyordu. Tasarımda listenin başında: müşteri ürünlere
     bakarken "biraz daha eklersem kargo bedava" bilgisini alıyor —
     karardan önce, karardan sonra değil. */
  function kargoSeridi() {
    if (!ozet) return null;

    if (ozet.ucretsizKargoyaKalan > 0) {
      return (
        <View style={styles.kart}>
          <View style={styles.kargoUst}>
            <Ionicons name="car-outline" size={16} color={renkler.yaziOrta} />
            <Text style={styles.kargoYazi}>
              Ücretsiz kargoya{' '}
              <Text style={styles.kargoTutar}>
                {paraBicimle(ozet.ucretsizKargoyaKalan)}
              </Text>{' '}
              kaldı
            </Text>
          </View>

          {/* İlerleme çubuğu: dıştaki View ray, içteki dolgu.
              Yüzdeyi string olarak veriyoruz — RN'de genişliğin
              yüzde olarak verilmesinin yolu bu; sayı verseydik
              piksel sayardı. */}
          <View style={styles.kargoRay}>
            <View
              style={[styles.kargoDolgu, { width: `${Math.round(kargoOrani * 100)}%` }]}
            />
          </View>
        </View>
      );
    }

    if (ozet.ucretsizKargoKazanildi) {
      /* Kazanıldı hali: çubuk YOK, çünkü ilerleme kavramı bitti.
         Dolu bir çubuk göstermek "hâlâ bir hedef var" izlenimi
         verirdi. */
      return (
        <View style={[styles.kart, styles.kargoKazanildi]}>
          <Ionicons name="gift-outline" size={16} color={renkler.basari} />
          <Text style={styles.kargoKazanildiYazi}>Kargo bedava kazandın</Text>
        </View>
      );
    }

    return null;
  }

  /* ⭐ YENİ (GV/Faz 6.4 + 6.5) — KUPON KARTI VE SİPARİŞ ÖZETİ
     LİSTENİN ALTINDA, KAYAN İÇERİĞİN İÇİNDE.

     ⚠️ Bu fazın en büyük yapısal değişikliği. Eskiden uyarılar,
     kupon, kargo şeridi, özet ve buton tek bir sabit alt panelde
     duruyordu; panel ekranın yarısını yiyor ve listeye üç ürünlük
     yer kalıyordu. Tasarım hepsini kayan içeriğe alıp altta yalnızca
     toplam + onay butonu bırakıyor. */
  function altIcerik() {
    return (
      <View style={styles.altIcerik}>
        {/* SATIŞTAN KALDIRILMIŞ ÜRÜN UYARISI

            Kupon uyarısının ÜSTÜNDE duruyor çünkü daha acil: kupon
            uyarısı bir fırsatın kaçtığını söyler, bu ise siparişin
            hiç verilemeyeceğini.

            Kapatma (X) düğmesi BİLEREK yok: kupon uyarısı
            bilgilendirmedir, kapatılabilir. Bu ise çözülene kadar
            duran bir engeldir; kapatılabilir olsaydı müşteri
            kapatır, sonra kilitli butonun sebebini anlamazdı. */}
        {siparisEngelli && (
          <View style={[styles.uyariKutu, { borderLeftColor: renkler.hata }]}>
            <Ionicons name="close-circle" size={18} color={renkler.hata} />
            <Text style={styles.uyariYazi}>
              Sepetinde satıştan kaldırılmış {pasifUrunSayisi} ürün var.
              Sipariş verebilmek için çöp kutusuna basıp çıkarman gerekiyor.
            </Text>
          </View>
        )}

        {/* OTOMATİK KALDIRMA UYARISI
            Sepet değişince kupon geçersizleştiyse burada çıkar.
            Sessizce kaldırsaydık müşteri indirimin nereye gittiğini
            anlamazdı. */}
        {kuponUyari !== '' && (
          <View style={[styles.uyariKutu, { borderLeftColor: renkler.uyari }]}>
            <Ionicons name="alert-circle" size={18} color={renkler.uyari} />
            <Text style={styles.uyariYazi}>{kuponUyari}</Text>
            <TouchableOpacity onPress={kuponUyariyiTemizle} hitSlop={8}>
              <Ionicons name="close" size={18} color={renkler.yaziGri} />
            </TouchableOpacity>
          </View>
        )}

        {/* ---- KUPON ----
            Türetilmiş görünüm: kupon varsa kart, yoksa giriş kutusu.
            Ayrı bir "kuponKutusuAcik" state'i tutmuyoruz — gerçek
            durum zaten kupon nesnesinin kendisi. */}
        {kupon === null ? (
          /* ⭐ DEĞİŞTİ (GV/Faz 6.4) — KUTU VE BUTON TEK KARTIN İÇİNDE.

             Eskiden çerçeveli bir input ile dolu turuncu bir buton
             yan yana duruyordu. Tasarımda ikisi tek bir kartın içinde
             ve aralarını dikey bir ayraç bölüyor; "Uygula" dolu buton
             değil, yazı düğmesi.

             ⚠️ Turuncu dolu buton bilerek bırakıldı: sepette asıl
             eylem "Sepeti Onayla" ve o alt çubukta dolu turuncu.
             İkinci bir dolu turuncu buton, hangisinin ana eylem
             olduğunu belirsizleştiriyordu. */
          <View style={styles.kuponKart}>
            <Ionicons name="pricetag-outline" size={18} color={renkler.yaziGri} />

            <TextInput
              style={styles.kuponInput}
              value={kuponGirdi}
              onChangeText={(metin) => {
                setKuponGirdi(metin);
                // Kullanıcı yazmaya başlayınca eski hata mesajını sil —
                // düzeltmeye çalışırken hâlâ kırmızı yazı görmesin.
                if (kuponMesaj) setKuponMesaj(null);
              }}
              placeholder="Kupon kodu"
              placeholderTextColor={renkler.yaziGri}
              /* Kupon kodları hep büyük harf — klavyeyi de öyle aç.
                 autoCorrect kapalı çünkü kodlar sözlükte yok,
                 telefon "düzeltmeye" kalkarsa kod bozulur. */
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={kuponuDene}
              editable={!kuponYukleniyor}
            />

            <View style={styles.kuponAyrac} />

            <TouchableOpacity
              style={styles.kuponButon}
              onPress={kuponuDene}
              disabled={kuponGirdi.trim() === '' || kuponYukleniyor}
            >
              {kuponYukleniyor ? (
                <ActivityIndicator size="small" color={renkler.anaRenk} />
              ) : (
                <Text
                  style={[
                    styles.kuponButonYazi,
                    kuponGirdi.trim() === '' && styles.kuponButonYaziPasif,
                  ]}
                >
                  Uygula
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.kart, styles.kuponUygulandi]}>
            <Ionicons name="checkmark-circle" size={20} color={renkler.basari} />

            <View style={styles.kuponOrta}>
              <Text style={styles.kuponKod}>{kupon.kod}</Text>
              <Text style={styles.kuponAciklama} numberOfLines={1}>
                {kupon.aciklama}
              </Text>
            </View>

            <TouchableOpacity onPress={kuponuCikar} style={styles.kuponKaldir} hitSlop={8}>
              <Text style={styles.kuponKaldirYazi}>Kaldır</Text>
            </TouchableOpacity>
          </View>
        )}

        {kuponMesaj !== null && (
          <Text
            style={[
              styles.kuponMesaj,
              { color: kuponMesaj.tip === 'basari' ? renkler.basari : renkler.hata },
            ]}
          >
            {kuponMesaj.metin}
          </Text>
        )}

        {/* ---- SİPARİŞ ÖZETİ ----
            ⚠️ Tutarlar sunucudan gelen özetten. Eskiden ara toplam
            sepetten reduce ile, ödenecek de "toplam − indirim" ile
            HESAPLANIYORDU. Kargo eşiği girince o formül yetmez oldu:
            sipariş anında tahsil edilecek tutarı üreten kod sunucuda,
            biz onun sonucunu gösteriyoruz.

            Hesap sırası: ara toplam → indirim → kargo → toplam.
            Kargo indirimden SONRA çünkü kupon kargoya inmiyor. */}
        <View style={styles.kart}>
          <Text style={styles.ozetBaslik}>Sipariş Özeti</Text>

          <View style={styles.ozetSatir}>
            <Text style={styles.ozetEtiket}>Ara toplam</Text>
            <Text style={styles.ozetDeger}>{paraBicimle(ozet?.araToplam ?? 0)}</Text>
          </View>

          {/* İndirim satırı SADECE indirim varsa görünür.
              "İndirim: 0,00 ₺" yazmak gereksiz gürültü olurdu.

              ⚠️ G6 — İNDİRİM YEŞİL, TURUNCU DEĞİL. Tasarım sipariş
              detayında turuncu çizmiş ama sepette yeşil; kendi içinde
              tutarsız. Turuncu bu uygulamada eylem demek. */}
          {indirimTutari > 0 && (
            <View style={styles.ozetSatir}>
              <Text style={styles.ozetEtiket}>İndirim</Text>
              <Text style={[styles.ozetDeger, { color: renkler.basari }]}>
                −{paraBicimle(indirimTutari)}
              </Text>
            </View>
          )}

          {/* KARGO SATIRI — indirim satırının aksine KOŞULSUZ.
              Kargo 0 olduğunda satırı gizlemek cazip ama yanlış:
              "kargo yazmıyor, demek ki sonradan eklenecek" endişesi
              yaratır. "Ücretsiz" yazmak bir bilgidir, hiç yazmamak
              boşluktur. */}
          <View style={styles.ozetSatir}>
            <Text style={styles.ozetEtiket}>Kargo</Text>

            {ozet && ozet.kargoUcreti > 0 ? (
              <Text style={styles.ozetDeger}>{paraBicimle(ozet.kargoUcreti)}</Text>
            ) : (
              <Text style={[styles.ozetDeger, { color: renkler.basari }]}>Ücretsiz</Text>
            )}
          </View>

          <View style={styles.ayirac} />

          <View style={styles.ozetSatir}>
            <Text style={styles.toplamEtiket}>Toplam</Text>
            <Text style={styles.toplamTutar}>{paraBicimle(ozet?.toplam ?? 0)}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      {/* KeyboardAvoidingView: kupon kutusu klavyenin altında
          kalmasın.
          iOS'ta 'padding' davranışı gerekir; Android'de sistem zaten
          pencereyi yeniden boyutlandırdığı için undefined bırakıyoruz —
          ikisini birden verirsek Android'de çift kaydırma olur. */}
      <KeyboardAvoidingView
        style={styles.kapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ⭐ DEĞİŞTİ (GV/Faz 6.1) — BAŞLIK SATIRI.

            ⚠️ G2 — GERİ OKU YOK. Tasarımda üstte bir geri oku
            çizilmiş ama Sepetim bir SEKME KÖKÜ; geri gidilecek yer
            yok.

            ⚠️ G4 — BAŞLIKTA SEPET ROZETİ YOK. Tasarımda sağ üstte
            sayaçlı bir sepet ikonu var. Zaten sepetteyiz; kaç ürün
            olduğunu listenin kendisi söylüyor.

            İkisi de tasarımdan bilinçli sapma, ikisi de genel
            düzeltmeler listesinde yazılı. */}
        <Text style={styles.baslik}>Sepetim</Text>

        {sepet.length === 0 ? (
          /* ⭐ DEĞİŞTİ (GV/Faz 6.7) — BOŞ SEPET ARTIK ORTAK BİLEŞEN.
             Eskiden yerinde çizilmiş bir ikon + tek satır yazı vardı
             ve müşteriye gidecek bir yer önermiyordu. */
          <BosDurum
            ikon="bag-handle-outline"
            baslik="Sepetin boş"
            aciklama="Hemen alışverişe başla ve beğendiğin ürünleri sepetine ekle."
            eylemYazisi="Alışverişe Başla"
            onEylem={() => navigation.navigate('AnaSayfa', { screen: 'AnaSayfaMain' })}
          />
        ) : (
          <>
            <FlatList
              data={filtreliSepet}
              keyExtractor={(item) => item.id.toString()}

              /* ⭐ DEĞİŞTİ (GV/Faz 6.3) — SATIRLAR TEK KARTIN İÇİNDE.

                 Kartı ve satır aralarındaki ayracı LİSTE çiziyor,
                 satır değil: gruplama listenin sorunu. İlk ve son
                 satır köşeleri yuvarlatılıyor, aradakiler düz —
                 böylece beş ayrı kart yerine beş satırlık tek bir
                 kart görünüyor.

                 ⚠️ FlatList korundu, ScrollView'a çevrilmedi.
                 Sepette satır sayısının üst sınırı yok (adet sınırı
                 var, kalem sınırı yok); sanallaştırmayı bırakmak
                 uzun sepetlerde kaydırmayı bozardı. */
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.satirKap,
                    index === 0 && styles.ilkSatir,
                    index === filtreliSepet.length - 1 && styles.sonSatir,
                    index < filtreliSepet.length - 1 && styles.satirAyrac,
                  ]}
                >
                  <SepetSatiri
                    item={item}
                    onAdetDegistir={adetGuncelle}
                    onSil={setSilinecek}
                    onBas={(it) =>
                      navigation.navigate('AnaSayfa', {
                        screen: 'UrunDetay',
                        params: { urunId: it.productId },
                      })
                    }
                  />
                </View>
              )}

              ListHeaderComponent={
                <View style={styles.listeBasi}>
                  <AramaCubugu
                    value={aramaMetni}
                    onChangeText={setAramaMetni}
                    onSubmit={() => {}}
                    placeholder="Sepette ara..."
                  />
                  {kargoSeridi()}
                </View>
              }

              /* ⚠️ Alt içerik ListFooterComponent'te, ayrı bir View'da
                 DEĞİL. Ayrı koysaydık liste kendi yüksekliğiyle
                 sınırlı kalır, özet kartı ekrana sabitlenir ve kısa
                 sepetlerde ortada asılı dururdu. */
              ListFooterComponent={filtreliSepet.length > 0 ? altIcerik() : null}

              ListEmptyComponent={
                /* Arama hiçbir şey bulamadı. Sepetin kendisi boş
                   değil — o durum yukarıda, BosDurum ile. */
                <Text style={styles.aramaBos}>Sepetinde eşleşen ürün yok.</Text>
              }

              contentContainerStyle={styles.liste}
              keyboardShouldPersistTaps="handled"
            />

            {/* ⭐ YENİ (GV/Faz 6.6) — YAPIŞKAN ALT ÇUBUK:
                SOLDA TOPLAM, SAĞDA "SEPETİ ONAYLA".

                ⚠️ Engel varken çubuk TEK BUTONA düşüyor ve fiyat
                kutusu gitmiyor — buton yerine metni değişiyor.
                Soluk bir "Sepeti Onayla", neden çalışmadığını
                söylemez; müşteri basıp durur. Aynı desen ürün
                detayında tükenmiş üründe de var (5.10).

                ⚠️ Engeli burada da kontrol ediyoruz, sunucunun
                reddetmesini beklemiyoruz. Sunucu zaten reddediyor —
                asıl güvenlik orada. Ama müşteriyi adres seç, kart
                seç, onayla adımlarından geçirip EN SONDA hata vermek
                kötü bir deneyim. Engel, sorunun görüldüğü yerde
                durmalı. */}
            <View style={styles.altCubuk}>
              {siparisEngelli ? (
                <View style={styles.engelButon}>
                  <Ionicons name="lock-closed" size={16} color={renkler.yaziGri} />
                  <Text style={styles.engelYazi}>
                    Önce satıştan kalkan ürünleri çıkar
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.toplamKutu}>
                    <Text style={styles.toplamEtiketKucuk}>Toplam</Text>
                    <Text style={styles.toplamTutar}>
                      {paraBicimle(ozet?.toplam ?? 0)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.onayButon}
                    onPress={() => navigation.navigate('AdresSec', { siparisAkisi: true })}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.onayYazi}>Sepeti Onayla</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Sepetten çıkarma onayı.
          Yıkıcı: onay butonu kırmızı. Sepete ekleme turuncu, sepetten
          çıkarma kırmızı — biri kazanç, diğeri kayıp. */}
      <OnayPenceresi
        acik={silinecek !== null}
        ikon="trash-outline"
        yikici
        baslik="Sepetten çıkarılsın mı?"
        mesaj={silinecek ? `"${silinecek.productName}" sepetinden kaldırılacak.` : ''}
        onayYazisi="Çıkar"
        onVazgec={() => setSilinecek(null)}
        onOnayla={() => {
          const kalem = silinecek;
          setSilinecek(null);
          if (kalem) sepettenCikar(kalem);
        }}
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

  /* ⭐ DEĞİŞTİ (GV/Faz 6.1) — elle yazılı 24 yerine ölçek basamağı.
     yazi.baslik (22) ürün detayındaki ürün adıyla aynı: ikisi de
     ekranın en üst başlığı, farklı puntoda olmaları için sebep yok. */
  baslik: {
    fontSize: yazi.baslik,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    paddingHorizontal: sayfaKenari,
    paddingTop: bosluk.orta,
    paddingBottom: bosluk.kucuk,
  },

  liste: {
    paddingHorizontal: sayfaKenari,
    paddingBottom: bosluk.genis,
  },

  listeBasi: {
    gap: bosluk.orta,
    marginBottom: bosluk.orta,
  },

  aramaBos: {
    fontSize: yazi.normal,
    color: renkler.yaziGri,
    textAlign: 'center',
    marginTop: bosluk.genis,
  },


  /* ---------- SATIRLARI SARAN TEK KART ---------- */

  satirKap: {
    backgroundColor: renkler.kartArka,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: renkler.kenarlik,

    /* ⚠️ overflow: satır pasifken sol kenarına kırmızı şerit
       çiziliyor; kartın yuvarlak köşelerinden taşmasın. */
    overflow: 'hidden',
  },

  ilkSatir: {
    borderTopWidth: 1,
    borderTopLeftRadius: kose.buyuk,
    borderTopRightRadius: kose.buyuk,
  },

  sonSatir: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: kose.buyuk,
    borderBottomRightRadius: kose.buyuk,
  },

  /* Satır arası ince çizgi. Kartın kenarlığıyla aynı renk ama ayrı
     bir stil: biri kabın sınırı, diğeri içerideki bölme. */
  satirAyrac: {
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },


  /* ---------- ORTAK KART KABUĞU ---------- */

  /* Kargo şeridi, uygulanmış kupon ve özet aynı kabı paylaşıyor.
     Üç ayrı kart görünümü olsaydı ekran parçalanırdı. */
  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.orta,
  },

  altIcerik: {
    gap: bosluk.orta,
    marginTop: bosluk.orta,
  },


  /* ---------- UYARI KUTULARI ---------- */

  /* Sol kenar çizgisinin RENGİ çağrı yerinden geliyor (engel kırmızı,
     bilgi sarı); burada yalnızca renkten bağımsız ölçüler duruyor.
     İki ayrı stil objesi tutsaydık biri değişince diğeri geride
     kalırdı. */
  uyariKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    backgroundColor: renkler.acikKart,
    borderRadius: kose.kucuk,
    borderLeftWidth: 3,
    paddingVertical: bosluk.kucuk,
    paddingHorizontal: bosluk.orta,
  },

  uyariYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
  },


  /* ---------- KARGO ŞERİDİ ---------- */

  kargoUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    marginBottom: bosluk.kucuk,
  },

  kargoYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
  },

  /* Kalan tutar cümlenin içinde koyu ve kalın: müşterinin aradığı
     sayı o, cümlenin kalanı bağlam. */
  kargoTutar: {
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  /* İlerleme rayı. overflow hidden olmasa dolgu köşelerden taşardı. */
  kargoRay: {
    height: 6,
    borderRadius: kose.tam,
    backgroundColor: renkler.acikKart,
    overflow: 'hidden',
  },

  kargoDolgu: {
    height: '100%',
    borderRadius: kose.tam,
    backgroundColor: renkler.anaRenk,
  },

  kargoKazanildi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    borderColor: renkler.basari,
  },

  kargoKazanildiYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.basari,
  },


  /* ---------- KUPON ---------- */

  kuponKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    paddingLeft: bosluk.orta,
    height: 52,
  },

  kuponInput: {
    flex: 1,
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
    /* Android'de TextInput varsayılan iç boşluk ekler,
       sıfırlamazsak metin dikeyde ortalanmaz */
    padding: 0,
  },

  /* Dikey ayraç: kutu ile düğmeyi ayırıyor. Düğmeye kendi çerçevesini
     vermek yerine bunu seçtik — tasarımın yaptığı da bu ve iki
     çerçeve iç içe görünmüyor. */
  kuponAyrac: {
    width: 1,
    height: '60%',
    backgroundColor: renkler.kenarlik,
  },

  kuponButon: {
    paddingHorizontal: bosluk.normal,
    height: '100%',
    justifyContent: 'center',
  },

  kuponButonYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.anaRenk,
  },

  /* ⚠️ Pasif hâl için opacity değil AYRI RENK. Yazı düğmesinde
     opacity 0.5 turuncuyu soluk turuncuya çevirir ve "yarı basılmış"
     gibi durur; gri açıkça "şu an değil" diyor. */
  kuponButonYaziPasif: {
    color: renkler.pasif,
  },

  kuponUygulandi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    borderColor: renkler.basari,
  },

  kuponOrta: {
    flex: 1,
    minWidth: 0,
  },

  kuponKod: {
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
    /* Kodlar karakter karakter okunur — eşit genişlikli font
       "1" ile "l", "0" ile "O" ayrımını kolaylaştırır */
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    letterSpacing: 0.5,
  },

  kuponAciklama: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },

  kuponKaldir: {
    paddingVertical: bosluk.mikro,
    paddingHorizontal: bosluk.kucuk,
  },

  kuponKaldirYazi: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.hata,
  },

  kuponMesaj: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    paddingHorizontal: bosluk.mikro,
  },


  /* ---------- SİPARİŞ ÖZETİ ---------- */

  ozetBaslik: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    paddingBottom: bosluk.kucuk,
    marginBottom: bosluk.kucuk,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },

  ozetSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: bosluk.kucuk,
  },

  ozetEtiket: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
  },

  ozetDeger: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  ayirac: {
    height: 1,
    backgroundColor: renkler.kenarlik,
    marginBottom: bosluk.kucuk,
  },

  toplamEtiket: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },


  /* ---------- YAPIŞKAN ALT ÇUBUK ---------- */

  altCubuk: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.orta,
    paddingHorizontal: sayfaKenari,
    paddingVertical: bosluk.orta,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  toplamKutu: {
    flexShrink: 1,
  },

  toplamEtiketKucuk: {
    fontSize: yazi.mikro,
    color: renkler.yaziGri,
  },

  /* ⚠️ TOPLAM TURUNCU DEĞİL.
     Hemen yanında turuncu "Sepeti Onayla" butonu var; ikisi aynı
     renkte olunca hangisinin basılabilir olduğu renkten okunamıyordu.
     Dikkati punto ve kalınlık çekiyor, renk değil. Aynı ihlal ürün
     kartında ve ürün detayında da düzeltilmişti. */
  toplamTutar: {
    fontSize: yazi.baslik,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  onayButon: {
    backgroundColor: renkler.anaRenk,
    paddingVertical: bosluk.orta,
    paddingHorizontal: bosluk.genis,
    borderRadius: kose.orta,
    alignItems: 'center',
    justifyContent: 'center',
  },

  onayYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  /* Engel hâli: çubuk tek parçaya düşüyor. Buton DEĞİL — basılacak
     bir şey yok, o yüzden TouchableOpacity da değil. Kilit ikonu ve
     metin ne yapılması gerektiğini söylüyor. */
  engelButon: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.kucuk,
    backgroundColor: renkler.acikKart,
    borderRadius: kose.orta,
    paddingVertical: bosluk.orta,
  },

  engelYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziGri,
  },
});
