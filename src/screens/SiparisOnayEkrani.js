import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';
import { paraBicimle } from '../utils/bicimlendir';
// ⭐ YENİ (5.4) — tasarım sistemi ölçüleri. Bu dosyanın eski stilleri
// ham sayı kullanıyor; yalnızca yeni eklenenler token'a bağlandı.
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';


// ⭐ YENİ — ÇİFT SİPARİŞ KORUMASI ANAHTARI ÜRETİCİSİ
//
// Neden bileşenin dışında?
// Hiçbir state veya prop kullanmıyor — saf bir fonksiyon. İçeride
// olsaydı her render'da yeniden tanımlanırdı, boşuna.
//
// Neden hazır bir UUID kütüphanesi kurmuyoruz?
// React Native'de crypto.randomUUID her ortamda yok; expo-crypto
// kurmak gerekirdi. Beş satırlık bir ihtiyaç için bağımlılık
// eklemiyoruz.
//
// Bu anahtarın KRİPTOGRAFİK olması gerekmiyor — sır taşımıyor,
// sadece "aynı sipariş denemesi mi" sorusunu cevaplıyor. Ayrıca
// benzersizlik kullanıcı bazında aranıyor (index UserId ile
// bileşik), yani tek kullanıcının kendi anahtarlarıyla çakışması
// gerekiyor ki bu pratikte imkânsız.
//
// Zaman + iki rastgele parça: "m3k9x1-a7f2q8b4-p1n6r0zt" gibi.
function istekAnahtariUret() {
  const zaman = Date.now().toString(36);

  const rastgele =
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10);

  return zaman + '-' + rastgele;
}


export default function SiparisOnayEkrani({ route, navigation }) {
  const { adresId, kartId } = route.params;

  const { renkler } = useTema();

  const {
    sepet,
    sepetiSifirla,

    // ⭐ YENİ — kupon bilgileri
    kupon,
    indirimTutari,
    kuponuKaldir,

    // ⭐ YENİ — kargo dahil özet.
    //
    // Kupon uygulanmışsa bu değerler /coupons/dogrula cevabından
    // geliyor (kargoUcreti + yeniToplam), uygulanmamışsa /cart
    // cevabından. İkisi de sunucu hesabı — bu ekranda hiçbir para
    // aritmetiği yapmıyoruz.
    ozet,
    kuponKargoyuUcretliYapti,

    // ⭐ YENİ (5.4) — sepette fiyatı değişen ürün var mı?
    fiyatDegisenVar,
  } = useSepet();

  const styles = stilOlustur(renkler);

  const [adres, setAdres] = useState(null);
  const [kart, setKart] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // ⭐ YENİ — sipariş notu (isteğe bağlı).
  //
  // Neden SepetContext'te değil de bu ekranda?
  // Not, sepete değil SİPARİŞE ait. Sepet ekranından çıkıp geri
  // gelen kullanıcının notu kaybolmasın diye context'e koymak
  // aklımıza gelebilir ama not zaten bu ekranda yazılıp aynı
  // ekranda gönderiliyor — ömrü tek ekran kadar.
  //
  // Kural: veriyi ihtiyaç duyulan en dar kapsamda tut. Gereksiz
  // yere yukarı taşımak, o veriyi ne zaman temizleyeceğin sorusunu
  // da beraberinde getirir.
  const [not, setNot] = useState('');

  // ⭐ YENİ (5.4) — "yeni fiyatları kabul ediyorum" onayı.
  //
  // ⚠️ NEDEN SUNUCUDA DEĞİL, EKRANDA TUTULUYOR?
  //
  // Bu onay bir VERİ değil, bir GÖRME beyanı: "değişikliği gördüm,
  // yine de devam ediyorum". Sunucuya yazsaydık (örneğin
  // EklenmeFiyati'nı güncel fiyata çekerek) iki sorun çıkardı:
  //
  //   1) Onaydan sonra fiyat TEKRAR değişirse, müşterinin görmediği
  //      yeni fiyat "kabul edilmiş" sayılırdı.
  //   2) Sipariş zaten güncel fiyattan oluşuyor; sunucunun bu onaya
  //      dayanarak alacağı farklı bir karar yok.
  //
  // Ekran ömrü kadar yaşıyor — sipariş verilince ekran zaten yok
  // ediliyor (navigation.replace).
  const [fiyatlariKabul, setFiyatlariKabul] = useState(false);

  // ⚠️ ONAY, UYARI YENİDEN DOĞDUĞUNDA SIFIRLANIYOR.
  //
  // Müşteri onayı verdikten sonra bu ekranda beklerken sepet
  // tazelenip fiyat bir kez daha değişebilir. Onayı taşısaydık,
  // müşterinin HİÇ GÖRMEDİĞİ bir fiyat için verilmiş bir onayla
  // sipariş geçerdi — onayın tek anlamı "gördüm" olduğu için bu
  // onu tamamen değersizleştirirdi.
  useEffect(() => {
    if (fiyatDegisenVar) {
      setFiyatlariKabul(false);
    }
  }, [fiyatDegisenVar]);

  // ⭐ YENİ — bu sipariş denemesinin kimliği.
  //
  // NEDEN useRef, NEDEN useState DEĞİL?
  // Bu değer ekranda hiçbir yerde gösterilmiyor. useState kullansaydık
  // her değişimde gereksiz bir render tetiklenirdi. Kural: useRef
  // görsel olmayan veri için, useState görsel veri için.
  //
  // NEDEN useRef(istekAnahtariUret()) DEĞİL?
  // O yazımda fonksiyon HER render'da çağrılır — React sadece ilk
  // değeri saklar ama üretim boşuna tekrarlanır. Aşağıdaki tembel
  // ilkleme deseni fonksiyonu tam bir kez çalıştırır.
  //
  // ÖMRÜ: Ekran mount olunca doğar, unmount olunca ölür. Sipariş
  // başarılı olunca navigation.replace ile bu ekran yok ediliyor,
  // dolayısıyla anahtar da gidiyor. Müşteri yeni bir sipariş
  // vermeye kalkarsa yeni ekran yeni anahtar üretir — eski sipariş
  // yanlışlıkla "tekrar" sayılmaz.
  const istekAnahtariRef = useRef(null);

  if (istekAnahtariRef.current === null) {
    istekAnahtariRef.current = istekAnahtariUret();
  }


  // Seçilen adres ve kartın detaylarını getir (özet göstermek için)
  useEffect(() => {
    async function ozetiGetir() {
      try {
        const [adresler, kartlar] = await Promise.all([
          apiGet('/addresses'),
          apiGet('/cards'),
        ]);
        setAdres(adresler.find((a) => a.id === adresId));
        setKart(kartlar.find((k) => k.id === kartId));
      } catch (hata) {
        console.log('Özet alınamadı:', hata.message);
      } finally {
        setYukleniyor(false);
      }
    }
    ozetiGetir();
  }, []);


  // SİPARİŞİ TAMAMLA — backend transaction'ı burada tetikleniyor
  //
  // kuponsuzDene parametresi neden var?
  //   Kupon reddedilirse kullanıcıya "kuponsuz devam edelim mi?" diye
  //   soruyoruz. Evet derse aynı fonksiyonu true ile tekrar çağırıyoruz.
  //
  //   Neden kuponuKaldir() çağırıp state'e güvenmiyoruz?
  //   React'te setState ANINDA etki etmez — bir sonraki render'da geçerli
  //   olur. kuponuKaldir() çağırıp hemen siparisiTamamla() dersek, fonksiyon
  //   hâlâ ESKİ kupon değerini görür ve aynı hatayı tekrar alırız.
  //   Parametre ile açıkça söylemek bu zamanlama tuzağını tamamen atlatır.
  async function siparisiTamamla(kuponsuzDene = false) {
    // ⭐ YENİ — hızlı çift dokunuşa karşı ilk savunma.
    //
    // Buton zaten disabled ama setState anında etkimez: iki dokunuş
    // 50 ms arayla gelirse ikinci dokunuş henüz eski render'ı görür.
    //
    // ⚠️ Bu koruma YETMEZ, sadece ucuz durumu ucuza halleder.
    // Gerçek garanti backend'deki unique index. Ön yüz doğrulaması
    // atlanabilir (Postman), sunucu doğrulaması atlanamaz.
    if (gonderiliyor) {
      return;
    }

    // ⭐ YENİ (5.4) — onay verilmeden sipariş geçmesin.
    //
    // Buton zaten disabled; bu ikinci savunma yukarıdaki çift
    // dokunuş korumasıyla aynı sebeple var. Onay, sepet tazelenip
    // fiyat yeniden değiştiğinde sıfırlanıyor — o sıfırlamanın
    // render'ı ile müşterinin dokunuşu aynı ana denk gelirse
    // dokunuş hâlâ eski (etkin) butonu görür.
    //
    // ⚠️ Sessizce dönmüyoruz: buton basılmış ama hiçbir şey olmamış
    // gibi görünürse müşteri uygulamanın donduğunu sanar.
    if (fiyatDegisenVar && !fiyatlariKabul) {
      Alert.alert(
        'Onay gerekli',
        'Sepetinizdeki bazı ürünlerin fiyatı değişti. Devam etmek için yeni fiyatları kabul etmeniz gerekiyor.'
      );
      return;
    }

    try {
      setGonderiliyor(true);

      // ⭐ SADECE KOD gönderiyoruz, indirim tutarını DEĞİL.
      //    Sunucu indirimi kendi hesaplıyor. Ön yüzden gelen para
      //    bilgisine güvenilmez — kullanıcı uygulamayı değiştirip
      //    "indirim: 999999" gönderebilir.
      //
      //    ?? null → kupon yoksa alan null gider, backend'deki
      //    string? CouponCode bunu "kupon kullanılmıyor" olarak anlar.
      const sonuc = await apiPost('/orders', {
        addressId: adresId,
        cardId: kartId,
        couponCode: kuponsuzDene ? null : (kupon?.kod ?? null),

        // ⭐ YENİ — sipariş notu.
        //
        // Boşsa null gönderiyoruz, boş string değil. Backend "değer yok"
        // durumunu NULL ile temsil ediyor; boş string gönderirsek
        // veritabanında iki farklı "boşluk" temsili oluşur ve ileride
        // "notu olan siparişler" filtresi boş notları da yakalar.
        //
        // trim() burada da yapılıyor ama backend'de de var — bu tekrar
        // değil, savunma derinliği. Ön yüz doğrulaması atlanabilir
        // (Postman), sunucu doğrulaması atlanamaz.
        customerNote: not.trim() === '' ? null : not.trim(),
        // ⭐ YENİ — çift sipariş koruması.
        //
        // ⚠️ .current okunuyor: ref'in kendisi bir kutu, değer
        // içinde. Kutuyu göndersek backend'e "[object Object]" giderdi.
        //
        // Bu değer, kupon reddedilip fonksiyon ikinci kez çağrıldığında
        // da AYNI kalır — ve bu doğru davranış: kullanıcı hâlâ aynı
        // siparişi vermeye çalışıyor, ikinci bir sipariş değil.
        idempotencyKey: istekAnahtariRef.current,
      });

      sepetiSifirla(); // backend sepeti temizledi, ekranı da senkronla (kuponu da bırakır)

      // Başarı ekranına git (geri tuşuyla buraya dönemesin)
      navigation.replace('SiparisBasarili', {
        siparisId: sonuc.siparisId,   // detaya gitmek için gerekli (URL anahtarı)
        siparisNo: sonuc.siparisNo,   // ⭐ ekranda gösterilecek numara
        toplam: sonuc.toplam,

        // ⭐ YENİ — indirim dökümü.
        //    Sunucunun döndürdüğü değerleri taşıyoruz, kendi
        //    hesabımızı değil. Ekranda gösterilen sayı ile
        //    veritabanına yazılan sayı birebir aynı olsun.
        araToplam: sonuc.araToplam,
        indirim: sonuc.indirim,
        kuponKodu: sonuc.kuponKodu,

        // ⭐ YENİ — kargo ücreti.
        //
        // Olmadan başarı ekranındaki döküm TUTMUYOR: ara toplam
        // eksi indirim, ödenen tutarı vermiyor. Müşteri sipariş
        // verdikten sonra hesabın tutmadığını görürse, doğru olsa
        // bile güveni sarsılır.
        kargoUcreti: sonuc.kargoUcreti,
      });
    } catch (hata) {
      setGonderiliyor(false);

      // ⭐ HATA KODUNA GÖRE DAVRAN
      //
      // hata.kod'u api.js dolduruyor: backend cevabındaki "kod" alanını
      // Error nesnesine iliştiriyor. Metne bakarak karar vermiyoruz —
      // mesaj metni değişebilir, kod değişmez.
      if (hata.kod === 'KUPON_GECERSIZ') {
        Alert.alert(
          'Kupon uygulanamadı',
          hata.message + '\n\nSiparişi kuponsuz tamamlamak ister misin?',
          [
            { text: 'Vazgeç', style: 'cancel' },
            {
              text: 'Kuponsuz devam et',
              onPress: () => {
                kuponuKaldir();           // ekrandaki kuponu temizle
                siparisiTamamla(true);    // state'i beklemeden tekrar dene
              },
            },
          ]
        );
        return;
      }

      // Stok yetersizliği gibi diğer hatalar burada yakalanır
      Alert.alert('Sipariş verilemedi', hata.message);
    }
  }


  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>Sipariş Özeti</Text>
      </View>

      <Text style={styles.adimYazi}>3 / 3 — Onayla</Text>

      {/* ⭐ automaticallyAdjustKeyboardInsets: iOS'ta klavye açılınca
          ScrollView'un alt boşluğunu otomatik büyütür, böylece not
          alanı klavyenin altında kalmaz. Android'de sistem zaten
          pencereyi yeniden boyutlandırıyor.
          
          Sepet ekranındaki KeyboardAvoidingView yaklaşımından farklı
          bir çözüm kullandık çünkü orada klavyeden kaçması gereken
          şey ALT PANEL (ScrollView'un dışında) idi. Burada kaçması
          gereken alan ScrollView'un İÇİNDE — bu özellik tam o durum
          için var ve daha az kod istiyor.
          
          keyboardShouldPersistTaps="handled": klavye açıkken
          "Siparişi Tamamla"ya basınca ilk dokunuş klavyeyi kapatıp
          yutulmasın, buton doğrudan çalışsın. */}
      <ScrollView
        contentContainerStyle={styles.icerik}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
      >
        {/* Teslimat adresi */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Teslimat Adresi</Text>
          <View style={styles.kutu}>
            <Text style={styles.kutuBaslik}>{adres?.title}</Text>
            <Text style={styles.kutuMetin}>{adres?.fullAddress}</Text>
            <Text style={styles.kutuAlt}>{adres?.city}</Text>
          </View>
        </View>

        {/* Ödeme */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ödeme</Text>
          <View style={styles.kutu}>
            <Text style={styles.kutuBaslik}>**** **** **** {kart?.last4Digits}</Text>
            <Text style={styles.kutuMetin}>{kart?.cardHolderName}</Text>
            <Text style={styles.kutuAlt}>{kart?.cardType}</Text>
          </View>
        </View>

        {/* Ürünler */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ürünler ({sepet.length})</Text>
          <View style={styles.kutu}>
            {sepet.map((s) => (
              <View key={s.id} style={styles.urunSatir}>
                <Text style={styles.urunAd} numberOfLines={1}>
                  {s.productName} × {s.quantity}
                </Text>
                <Text style={styles.urunFiyat}>
                  {paraBicimle(s.productPrice * s.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ⭐ YENİ — KUPON BÖLÜMÜ
            Sadece kupon uygulanmışsa görünür. Türetilmiş koşul:
            kupon nesnesinin varlığı zaten bilginin kendisi,
            ayrı bir "kuponVarMi" state'ine gerek yok. */}
        {kupon !== null && (
          <View style={styles.bolum}>
            <Text style={styles.bolumBaslik}>Kupon</Text>
            <View style={[styles.kutu, styles.kuponKutu]}>
              <Ionicons name="pricetag" size={20} color={renkler.basari} />
              <View style={styles.kuponOrta}>
                <Text style={styles.kuponKod}>{kupon.kod}</Text>
                <Text style={styles.kuponAciklama} numberOfLines={1}>
                  {kupon.aciklama}
                </Text>
              </View>
              <Text style={styles.kuponIndirim}>−{paraBicimle(indirimTutari)}</Text>
            </View>
          </View>
        )}

        {/* ⭐ YENİ — SİPARİŞ NOTU
            
            Neden EN ALTTA, kuponun bile altında?
            İsteğe bağlı bir alan. Üstte olsaydı, notu olmayan
            kullanıcıların (çoğunluk) her seferinde üstünden atlaması
            gerekirdi. Zorunlu bilgiler üstte, isteğe bağlılar altta —
            akış hızı çoğunluğa göre ayarlanır. */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Sipariş Notu (isteğe bağlı)</Text>

          <View style={styles.kutu}>
            <TextInput
              style={styles.notGirdi}
              value={not}
              onChangeText={setNot}
              placeholder="Örn: Kapıya bırakın, zili çalmayın."
              placeholderTextColor={renkler.yaziGri}

              /* multiline: not birkaç satır olabilir.
                 numberOfLines Android'de başlangıç yüksekliği verir;
                 iOS'ta etkisiz olduğu için stilde minHeight de var. */
              multiline
              numberOfLines={3}

              /* Sunucudaki [MaxLength(500)] ile aynı sayı.
                 Burada engellemek, kullanıcının 600 karakter yazıp
                 gönderdikten sonra hata almasından iyidir. */
              maxLength={500}

              /* Çok satırlı alanda metin üstten başlasın.
                 Android'de varsayılan dikey ortalama, kutu yüksek
                 olunca metin havada duruyor gibi görünür. */
              textAlignVertical="top"

              editable={!gonderiliyor}
            />

            <Text style={styles.notSayac}>{not.length} / 500</Text>
          </View>

          <Text style={styles.notIpucu}>
            Bu not kargo etiketine basılır ve paketi hazırlayan kişi görür.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.altBar}>
        {/* ⭐ YENİ — KUPON KARGOYU ÜCRETLİ YAPTIYSA BİLGİ

            ⚠️ UYARI DEĞİL, BİLGİ. Renk olarak "uyari" değil "yaziOrta"
            kullanıyoruz ve ünlem ikonu yok — müşteri yanlış bir şey
            yapmadı, kupon geçerli ve hâlâ kârlı. Turuncu bir uyarı
            kutusu "bir sorun var, kuponu kaldırayım mı?" dedirtirdi.

            Ama sessiz de kalamayız: müşteri 100 TL indirim uygulayıp
            toplamın 50 TL düştüğünü görürse hesabın yanlış olduğunu
            düşünür. Sebebini söylemek güveni koruyor.

            Özetin ÜSTÜNDE duruyor ki rakamlar okunmadan önce bağlam
            verilmiş olsun. */}
        {kuponKargoyuUcretliYapti && (
          <View style={styles.kargoBilgi}>
            <Ionicons name="information-circle-outline" size={16} color={renkler.yaziOrta} />
            <Text style={styles.kargoBilgiYazi}>
              Kupon sonrası tutar ücretsiz kargo limitinin altında kaldı.
            </Text>
          </View>
        )}

        {/* ⭐ DEĞİŞTİ — SEPET EKRANIYLA AYNI ÜÇ SATIRLIK ÖZET.

            Eskiden döküm sadece indirim varken açılıyor, yoksa tek
            satır toplam gösteriliyordu. Kargo girince o kısayol
            kullanılamaz oldu: kargo indirimden bağımsız olarak her
            siparişte var ve gösterilmesi gerekiyor.

            İki ekranın AYNI satırları göstermesi bilinçli. Müşteri
            sepette gördüğü dökümü burada da görmezse "arada bir şey
            mi değişti?" diye düşünür. */}
        <View style={styles.ozetSatir}>
          <Text style={styles.ozetEtiket}>Ara toplam</Text>
          <Text style={styles.ozetDeger}>{paraBicimle(ozet?.araToplam ?? 0)}</Text>
        </View>

        {indirimTutari > 0 && (
          <View style={styles.ozetSatir}>
            <Text style={styles.ozetEtiket}>İndirim</Text>
            <Text style={[styles.ozetDeger, { color: renkler.basari }]}>
              −{paraBicimle(indirimTutari)}
            </Text>
          </View>
        )}

        <View style={styles.ozetSatir}>
          <Text style={styles.ozetEtiket}>Kargo</Text>

          {ozet && ozet.kargoUcreti > 0 ? (
            <Text style={styles.ozetDeger}>{paraBicimle(ozet.kargoUcreti)}</Text>
          ) : (
            <Text style={[styles.ozetDeger, { color: renkler.basari }]}>Ücretsiz</Text>
          )}
        </View>

        <View style={styles.ayirac} />

        <View style={styles.toplamSatir}>
          <Text style={styles.toplamEtiket}>
            {indirimTutari > 0 ? 'Ödenecek' : 'Toplam'}
          </Text>
          <Text style={styles.toplamTutar}>{paraBicimle(ozet?.toplam ?? 0)}</Text>
        </View>

        {/* ⭐ YENİ (5.4) — FİYAT DEĞİŞİKLİĞİ ONAYI

            ⚠️ Neden TOPLAMIN ALTINDA, ekranın tepesinde değil?
            Onayın konusu ödenecek tutar. Müşterinin sıralaması şu
            olmalı: rakamı gör → değiştiğini öğren → kabul et → bas.
            Tepeye koysaydık müşteri uyarıyı toplamı görmeden okur,
            sonra aşağı inip rakama bakar ve uyarıyı unuturdu.

            ⚠️ Bu bir Alert DEĞİL. Açılır pencere refleksle kapatılır;
            ekranda duran ve butonu kilitleyen bir onay, kapatılamadığı
            için okunur. */}
        {fiyatDegisenVar && (
          <View style={styles.fiyatUyariKutu}>
            <View style={styles.fiyatUyariBaslikSatir}>
              <Ionicons name="pricetag-outline" size={16} color={renkler.uyari} />
              <Text style={styles.fiyatUyariBaslik}>
                Sepetinizdeki bazı ürünlerin fiyatı değişti
              </Text>
            </View>

            <Text style={styles.fiyatUyariAciklama}>
              Sipariş yukarıdaki güncel fiyatlar üzerinden oluşturulacak.
              Hangi ürünlerin değiştiğini sepet ekranında görebilirsiniz.
            </Text>

            {/* Onay kutusu — dokunma hedefi tüm satır.
                Yalnızca küçük kareyi tıklanabilir yapmak, kutuyu
                ıskalayan her dokunuşu sessizce yutardı. */}
            <TouchableOpacity
              style={styles.onaySatir}
              onPress={() => setFiyatlariKabul((o) => !o)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={fiyatlariKabul ? 'checkbox' : 'square-outline'}
                size={22}
                color={fiyatlariKabul ? renkler.anaRenk : renkler.yaziOrta}
              />
              <Text style={styles.onayYazi}>Yeni fiyatları kabul ediyorum</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ⭐ DEĞİŞTİ (5.4) — buton onay verilmeden basılamıyor.
            Fiyat değişmemişse (fiyatDegisenVar false) koşul hiç
            devreye girmiyor; olağan akış aynen eskisi gibi. */}
        <TouchableOpacity
          style={[
            styles.tamamlaButon,
            fiyatDegisenVar && !fiyatlariKabul && styles.tamamlaButonPasif,
          ]}
          onPress={() => siparisiTamamla(false)}
          disabled={gonderiliyor || (fiyatDegisenVar && !fiyatlariKabul)}
        >
          {gonderiliyor
            ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
            : <Text style={styles.tamamlaYazi}>Siparişi Tamamla</Text>}
        </TouchableOpacity>
      </View>
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
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },
  geriButon: {
    marginRight: 12,
  },
  ustBaslik: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },
  adimYazi: {
    fontSize: 13,
    color: renkler.yaziOrta,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  icerik: {
    padding: 16,
  },
  bolum: {
    marginBottom: 20,
  },
  bolumBaslik: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: 8,
  },
  kutu: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14,
  },
  kutuBaslik: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: 4,
  },
  kutuMetin: {
    fontSize: 14,
    color: renkler.yaziOrta,
    marginBottom: 2,
  },
  kutuAlt: {
    fontSize: 13,
    color: renkler.yaziGri,
  },
  urunSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  urunAd: {
    flex: 1,
    fontSize: 14,
    color: renkler.yaziKoyu,
    marginRight: 10,
  },
  urunFiyat: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },


  /* ---------- KUPON KUTUSU ---------- */

  kuponKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: renkler.basari,
  },
  kuponOrta: {
    flex: 1,
  },
  kuponKod: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    letterSpacing: 0.5,
  },
  kuponAciklama: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginTop: 2,
  },
  kuponIndirim: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: font.kalin,
    color: renkler.basari,
  },


  /* ---------- ALT BAR ---------- */

  altBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },
  ozetSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  /* ⭐ YENİ — kupon sonrası kargo bilgisi.

     Kenarlık ve dolgu rengi YOK, sadece hafif bir arka plan. Uyarı
     kutularındaki sol kenar çizgisini bilerek kullanmadık: o çizgi
     bu projede "dikkat et" demek, buradaki mesaj ise sadece açıklama. */
  kargoBilgi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: renkler.acikKart,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  kargoBilgiYazi: {
    flex: 1,
    fontSize: 12,
    color: renkler.yaziOrta,
    lineHeight: 17,
  },
  ozetEtiket: {
    fontSize: 14,
    color: renkler.yaziOrta,
  },
  ozetDeger: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },
  ayirac: {
    height: 1,
    backgroundColor: renkler.kenarlik,
    marginVertical: 8,
  },
  toplamSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toplamEtiket: {
    fontSize: 15,
    color: renkler.yaziOrta,
  },
  toplamTutar: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: font.kalin,
    color: renkler.anaRenk,
  },
  tamamlaButon: {
    backgroundColor: renkler.anaRenk,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },

  /* ⭐ YENİ (5.4) — onay verilmemişken butonun hali.

     ⚠️ Butonu GİZLEMİYORUZ, soluklaştırıyoruz. Gizleseydik müşteri
     "siparişi tamamla butonu nerede?" diye arardı; soluk buton
     "burada ama önce bir şey yapman lazım" diyor — ve yapılacak şey
     hemen üstünde duruyor. */
  tamamlaButonPasif: {
    opacity: 0.45,
  },

  /* ⭐ YENİ (5.4) — fiyat değişikliği uyarı + onay kutusu.

     Kenarlık uyarı renginde ama zemin nötr: kutu dikkat çekmeli,
     bağırmamalı. Müşteri hata yapmadı — sadece bilgilendiriliyor. */
  fiyatUyariKutu: {
    backgroundColor: renkler.acikKart,
    borderWidth: 1,
    borderColor: renkler.uyari,
    borderRadius: kose.orta,
    padding: bosluk.orta,
    marginBottom: bosluk.orta,
  },
  fiyatUyariBaslikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
  },
  fiyatUyariBaslik: {
    flex: 1,
    fontSize: yazi.normal,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },
  fiyatUyariAciklama: {
    fontSize: yazi.kucuk,
    color: renkler.yaziOrta,
    lineHeight: satir.kucuk,
    marginTop: bosluk.kucuk,
  },

  /* Onay satırı: dokunma hedefi tüm satır olduğu için dikey iç
     boşluk cömert — 22px'lik kutucuk tek başına küçük bir hedef. */
  onaySatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    marginTop: bosluk.kucuk,
    paddingVertical: bosluk.mikro,
  },
  onayYazi: {
    flex: 1,
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },
  tamamlaYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: font.kalin,
  },

  /* ⭐ YENİ — sipariş notu girişi */
  notGirdi: {
    fontSize: 14,
    lineHeight: 20,
    color: renkler.yaziKoyu,

    /* Android'de multiline TextInput varsayılan iç boşluk ekler;
       sıfırlayıp kendi ölçümüzü veriyoruz ki iki platformda
       aynı görünsün. */
    padding: 0,
    minHeight: 60
  },

  notSayac: {
    fontSize: 11,
    color: renkler.yaziGri,
    textAlign: 'right',
    marginTop: 8
  },

  notIpucu: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginTop: 6,
    lineHeight: 17
  },


});