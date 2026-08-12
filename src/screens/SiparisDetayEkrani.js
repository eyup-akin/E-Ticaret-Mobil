import React, { useState, useEffect } from 'react';
// ⭐ DEĞİŞTİ (GV/Faz 7.4) — dosyadaki elle yazılı ölçüler token'a bağlandı.
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Linking } from 'react-native';
import * as Clipboard from 'expo-clipboard';   // ⭐ YENİ
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { odemeYazisi, odemeRengi } from '../utils/durum';
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';
import KargoDurumu from '../components/KargoDurumu';
import SiparisIptalForm from '../components/SiparisIptalForm';

export default function SiparisDetayEkrani({ route, navigation }) {
  const { siparisId } = route.params;
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [siparis, setSiparis] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // ⭐ YENİ — takip numarası panoya kopyalandı mı?
  //
  // Neden Alert kullanmıyoruz? Alert ekranı kaplar ve kapatmak için
  // bir dokunuş daha ister. Bu kadar küçük bir onay için ağır kalır.
  // Yazının kendisi 2 saniyeliğine değişiyor — geri bildirim, eylemin
  // gerçekleştiği yerde.
  const [kopyalandi, setKopyalandi] = useState(false);

  async function siparisiGetir(sessiz = false) {
    try {
      if (!sessiz) setYukleniyor(true);
      const veri = await apiGet('/orders/' + siparisId);
      setSiparis(veri);
    } catch (hata) {
      console.log('Sipariş alınamadı:', hata.message);
    } finally {
      if (!sessiz) setYukleniyor(false);
    }
  }

  useEffect(() => {
    siparisiGetir();
  }, [siparisId]);

  // ⭐ YENİ — "Kopyalandı" yazısını 2 saniye sonra sil.
  //
  // setTimeout'u kopyalama fonksiyonunun içine koysaydık, kullanıcı üst
  // üste iki kez kopyaladığında iki zamanlayıcı çalışır ve birincisi,
  // ikinci kopyalamanın yazısını erken silerdi. Effect'in temizliği
  // eskisini iptal ederek bunu engelliyor.
  useEffect(() => {
    if (!kopyalandi) {
      return;
    }

    const sayac = setTimeout(() => setKopyalandi(false), 2000);
    return () => clearTimeout(sayac);
  }, [kopyalandi]);

  // ⭐ YENİ — takip numarasını panoya kopyala
  async function takipNoKopyala() {
    try {
      await Clipboard.setStringAsync(siparis.trackingNumber);
      setKopyalandi(true);
    } catch (hata) {
      // Pano yazma nadiren başarısız olur. Olursa da numara zaten
      // ekranda duruyor, kullanıcı elle yazabilir. Bu yüzden hata
      // penceresi açmıyoruz — çözemeyeceği bir uyarı vermek gereksiz.
      console.log('Panoya kopyalanamadı:', hata.message);
    }
  }

  // ⭐ YENİ (GV/Faz 7.5) — kargo firmasının takip sayfasını aç.
  //
  // ⚠️ `canOpenURL` sorulmuyor. Adres http(s) ve harici tarayıcıyı
  // açmak her platformda destekleniyor; sorup cevabı beklemek bir
  // dokunuşluk işi yavaşlatırdı. Yine de openURL reddedebilir
  // (tarayıcısı olmayan cihaz) — o yüzden hata yakalanıyor.
  //
  // ⚠️ Hata penceresi AÇILMIYOR: numara zaten ekranda ve
  // kopyalanabiliyor, müşteri kendi tarayıcısından bakabilir.
  // Çözemeyeceği bir uyarı vermek yerine sessiz kalıyoruz — takip
  // numarası kopyalamada verilen kararın aynısı.
  async function takibiAc() {
    try {
      await Linking.openURL(siparis.trackingUrl);
    } catch (hata) {
      console.log('Takip sayfası açılamadı:', hata.message);
    }
  }

  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }
  if (!siparis) {
    return (
      <View style={styles.ortala}>
        <Text style={styles.bosYazi}>Sipariş bulunamadı.</Text>
      </View>
    );
  }

  const iptalMi = siparis.status === 'iptal';

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      {/* ⚠️ B8 — BAŞLIKTAKİ "?" YARDIM İKONU HÂLÂ ÇİZİLMİYOR, ama
          gerekçe DEĞİŞTİ (Aşama 8, 2026-08-12).

          Eski gerekçe "destek sistemi yok, ikon hiçbir yere gitmez"di.
          Artık var. Yine de çizilmedi: sayfanın altında "Bu siparişle
          ilgili destek talebi aç" satırı duruyor ve ikisi AYNI yere
          gidiyor olurdu — "aynı işi yapan iki düğme koyma".

          Alttaki satır tercih edildi çünkü ne yapacağını YAZIYOR;
          başlıktaki bir "?" ikonu ise SSS mi, canlı destek mi, iade mi
          açacağını söylemiyor. */}
      <View style={styles.ustBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.geriButon}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <View style={styles.ustOrta}>
          <Text style={styles.ustBaslik}>{siparis.orderNumber}</Text>
          <Text style={styles.ustAlt}>{tarihBicimle(siparis.createdAt)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.icerik}>
        {/* KARGO DURUMU / İPTAL KUTUSU
            ⭐ DEĞİŞTİ (GV/Faz 7.4) — sipariş tarihi buradan başlığın
            alt satırına taşındı; içeriğin en üstünde sahipsiz bir
            satır olarak duruyordu. */}
        <View style={styles.bolum}>
          {!iptalMi && <Text style={styles.bolumBaslik}>KARGO DURUMU</Text>}
          <KargoDurumu siparis={siparis} />
        </View>

        {/* ⭐ YENİ — KARGO TAKİP BİLGİSİ
            
            Sadece takip numarası varsa çiziliyor. "Hazırlanıyor"
            aşamasındaki siparişte bu bölüm hiç yok — boş bir kutu
            göstermek müşteriye "bir şey eksik" hissi verirdi.
            
            Kargo Durumu'nun HEMEN ALTINDA: müşteri sipariş detayını
            açtığında ilk merak ettiği şey "nerede kaldı" sorusu.
            Adres ve ödeme bilgisi ikincil — onları zaten biliyor. */}
        {siparis.trackingNumber ? (
          <View style={styles.bolum}>
            <Text style={styles.bolumBaslik}>KARGO TAKİP</Text>

            <View style={styles.kutu}>
              <View style={styles.satir}>
                <Text style={styles.etiket}>Firma</Text>
                <Text style={styles.deger}>
                  {siparis.shippingCompany || '—'}
                </Text>
              </View>

              {/* Takip numarası tıklanabilir.
                  
                  Neden UZUN BASINCA kopyalıyoruz, tek dokunuşla değil?
                  Tek dokunuş kaza eseri olur — müşteri listeyi kaydırırken
                  parmağı değebilir ve ne olduğunu anlamadan panosu değişir.
                  Uzun basmak bilinçli bir eylemdir ve mobilde "kopyala"
                  için zaten alışılmış harekettir (WhatsApp, tarayıcı,
                  notlar hep böyle).
                  
                  delayLongPress: varsayılan 500ms. 400'e çekiyoruz;
                  numarayı kopyalamak sık yapılan bir iş, biraz daha
                  çabuk tepki versin. */}
              <TouchableOpacity
                onLongPress={takipNoKopyala}
                delayLongPress={400}
                activeOpacity={0.6}
              >
                <View style={styles.satir}>
                  <Text style={styles.etiket}>Takip No</Text>
                  <Text style={styles.takipNo}>{siparis.trackingNumber}</Text>
                </View>
              </TouchableOpacity>

              {/* İpucu satırı, kopyalanınca onaya dönüşüyor.
                  
                  Bu ipucu olmadan uzun basma özelliği KEŞFEDİLEMEZ —
                  görünmeyen bir özellik, olmayan bir özelliktir. */}
              <View style={styles.kopyaIpucuSatir}>
                {kopyalandi && (
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={renkler.basari}
                  />
                )}

                <Text
                  style={[
                    styles.kopyaIpucu,
                    kopyalandi && styles.kopyaIpucuBasarili,
                  ]}
                >
                {/* ⭐ DEĞİŞTİ (4.7) — baştaki ✓ karakteri kaldırıldı.
                    Onay işareti artık metnin solunda gerçek bir ikon;
                    metnin içine gömülü karakter, yazı tipine göre
                    farklı boyutta çiziliyor ve satır hizasını
                    kaydırıyordu. */}
                  {kopyalandi
                    ? 'Takip numarası kopyalandı'
                    : 'Numarayı kopyalamak için üzerine uzun bas'}
                </Text>
              </View>

              {/* ⭐ YENİ (GV/Faz 7.5, B7) — KARGOYU TAKİP ET

                  ⚠️ Adresi SUNUCU kuruyor; burada firma adına göre
                  şablon seçmiyoruz. `trackingUrl` yoksa buton hiç
                  çizilmiyor — o firmanın takip adresi appsettings'te
                  tanımlı değil demektir. Çalışmayan bir butonu soluk
                  gösterip orada bırakmak, müşteriye neden
                  basamadığını söylemez.

                  ⚠️ Kutunun İÇİNDE ve takip bilgisinin altında:
                  butonun konusu bu kutu. Ekranın altına yapışık bir
                  çubuk yapılmadı — bu ekranın tek bir asıl eylemi
                  yok, sipariş iptali de aşağıda duruyor.

                  ⚠️ G9 — tasarımda bu buton taşıyordu. Yazı
                  `flexShrink` ile daralıyor ve tek satıra
                  sıkıştırılıyor. */}
              {siparis.trackingUrl ? (
                <TouchableOpacity
                  style={styles.takipButon}
                  onPress={takibiAc}
                  activeOpacity={0.85}
                  accessibilityRole="link"
                  accessibilityLabel={`${siparis.shippingCompany} takip sayfasını aç`}
                >
                  <Ionicons name="cube-outline" size={18} color={renkler.anaRenkUstuYazi} />
                  <Text style={styles.takipButonYazi} numberOfLines={1}>
                    Kargoyu Takip Et
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ⭐ YENİ — MÜŞTERİNİN KENDİ NOTU
            
            Neden müşteriye de gösteriyoruz? Not asıl olarak kargo
            hazırlayan için ama müşterinin "ben ne yazmıştım" sorusuna
            cevap vermesi de önemli: kapıya bırakılmasını istediğini
            hatırlamazsa kargocuyu bekler. Kendi verisini görebilmek
            temel bir beklenti. */}
        {siparis.customerNote ? (
          <View style={styles.bolum}>
            <Text style={styles.bolumBaslik}>SİPARİŞ NOTUN</Text>

            <View style={styles.kutu}>
              <Text style={styles.notMetin}>{siparis.customerNote}</Text>
            </View>
          </View>
        ) : null}

        {/* TESLİMAT ADRESİ
            Sipariş anında dondurulmuş bilgi — müşteri adresini sonradan
            değiştirse bile burada eski hali görünür ve görünmelidir. */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>TESLİMAT ADRESİ</Text>

          <View style={styles.kutu}>
            <View style={styles.satir}>
              <Text style={styles.etiket}>Alıcı</Text>
              <Text style={styles.deger}>
                {siparis.shippingFullName || '—'}
              </Text>
            </View>

            <View style={styles.satir}>
              <Text style={styles.etiket}>Başlık</Text>
              <Text style={styles.deger}>
                {siparis.shippingTitle || '—'}
              </Text>
            </View>

            <View style={styles.satir}>
              <Text style={styles.etiket}>Şehir</Text>
              <Text style={styles.deger}>
                {siparis.shippingCity || '—'}
              </Text>
            </View>

            <View style={styles.satir}>
              <Text style={styles.etiket}>Telefon</Text>
              <Text style={styles.deger}>
                {siparis.shippingPhone || '—'}
              </Text>
            </View>

            {/* Açık adres uzun olduğu için satır düzeni yerine alt alta.
                Sağa yaslanmış uzun metin dar ekranda okunmaz hale gelir. */}
            <Text style={styles.adresEtiket}>Açık Adres</Text>
            <Text style={styles.adresMetin}>
              {siparis.shippingFullAddress || '—'}
            </Text>
          </View>
        </View>

        {/* ÖDEME */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>ÖDEME</Text>
          <View style={styles.kutu}>
            <View style={styles.satir}>
              <Text style={styles.etiket}>Durum</Text>
              <Text style={[styles.deger, { color: odemeRengi(siparis.paymentStatus, renkler) }]}>
                {odemeYazisi(siparis.paymentStatus)}
              </Text>
            </View>
            <View style={styles.satir}>
              <Text style={styles.etiket}>Kart</Text>
              <Text style={styles.deger}>•••• {siparis.cardLast4}</Text>
            </View>
          </View>
        </View>

        {/* ÜRÜNLER */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>ÜRÜNLER ({siparis.items.length})</Text>
          <View style={styles.kutu}>
            {siparis.items.map((u, i) => (
              <View key={i} style={styles.urunSatir}>
                <View style={styles.harfKutu}>
                  <Text style={styles.harfYazi}>{u.productName.charAt(0)}</Text>
                </View>
                <View style={styles.urunOrta}>
                  <Text style={styles.urunAd} numberOfLines={2}>{u.productName}</Text>
                  <Text style={styles.urunBirim}>{paraBicimle(u.unitPrice)} × {u.quantity}</Text>
                </View>
                <Text style={styles.urunToplam}>{paraBicimle(u.unitPrice * u.quantity)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* İPTAL AKIŞI (bileşen kendi içinde uygun mu diye karar veriyor) */}
        <View style={styles.bolum}>
          <SiparisIptalForm
            siparisId={siparisId}
            durum={siparis.status}
            onIptalEdildi={() => siparisiGetir(true)}
          />
        </View>

        {/* ⭐ YENİ (Aşama 8.4) — BU SİPARİŞ İÇİN DESTEK TALEBİ
            ⚠️ Kısayolun bütün değeri BAĞLAMI TAŞIMASINDA: talep
            siparişe bağlı açılıyor ve admin "hangi sipariş?" diye
            sormak zorunda kalmıyor. Müşteri aynı talebi Hesabım'dan
            da açabilir, ama orada siparişi kendisi anlatması gerekir.

            ⚠️ Durumdan BAĞIMSIZ çiziliyor: iptal edilmiş ya da
            teslim edilmiş bir siparişle ilgili de sorun olabilir
            ("iade edilen param gelmedi"). İptal formundan farkı bu —
            o yalnızca iptal edilebilir durumlarda anlamlı.

            ⚠️ Dolu buton DEĞİL, satır bağlantısı: bu ekranın asıl
            eylemi sipariş takibi; destek bir kaçış yolu. */}
        <View style={styles.bolum}>
          <TouchableOpacity
            style={styles.destekSatir}
            onPress={() => navigation.navigate('YeniTalep', { orderId: siparisId })}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={renkler.anaRenk} />
            <Text style={styles.destekYazi}>Bu siparişle ilgili destek talebi aç</Text>
            <Ionicons name="chevron-forward" size={16} color={renkler.yaziGri} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.altBar}>
        {/* ⭐ DEĞİŞTİ — döküm artık indirim olmasa da çiziliyor.

            Eskiden tüm blok "indirim varsa" koşuluna bağlıydı. Kargo
            satırı eklenince o koşul yanlış hale geldi: kargo, kupon
            olsun olmasın her siparişte var.

            ⚠️ Bu değerler DONDURULMUŞ alanlardan geliyor:
            subTotal, couponCode, discountAmount, shippingCost —
            hepsi sipariş anında Order tablosuna yazıldı. Kuponun ya
            da mağaza kargo ücretinin BUGÜNKÜ haline BAKMIYORUZ.
            Mağaza yarın kargoyu 79,90'a çıkarsa bu sipariş yine
            ödendiği tutarı gösterir.

            Aynı desen adres (ShippingFullName vb.) ve birim fiyat
            (UnitPrice) için de geçerli — projedeki tutarlı yaklaşım. */}
        <View style={styles.ozetSatir}>
          <Text style={styles.ozetEtiket}>Ara toplam</Text>
          <Text style={styles.ozetDeger}>{paraBicimle(siparis.subTotal)}</Text>
        </View>

        {siparis.discountAmount > 0 && (
          <View style={styles.ozetSatir}>
            <Text style={styles.ozetEtiket}>
              İndirim{siparis.couponCode ? ` (${siparis.couponCode})` : ''}
            </Text>
            <Text style={[styles.ozetDeger, { color: renkler.basari }]}>
              −{paraBicimle(siparis.discountAmount)}
            </Text>
          </View>
        )}

        {/* ⭐ YENİ — KARGO SATIRI

            0 ise "Ücretsiz" yazıyoruz. Bu iki farklı sebepten olabilir
            (eşik aşıldı ya da mağaza hiç kargo almıyor) ama müşteri
            açısından ikisi de aynı: ödemedi. Ayırt etmeye çalışmak
            ekrana bilgi değil gürültü katardı. */}
        <View style={styles.ozetSatir}>
          <Text style={styles.ozetEtiket}>Kargo</Text>

          {siparis.shippingCost > 0 ? (
            <Text style={styles.ozetDeger}>{paraBicimle(siparis.shippingCost)}</Text>
          ) : (
            <Text style={[styles.ozetDeger, { color: renkler.basari }]}>Ücretsiz</Text>
          )}
        </View>

        <View style={styles.ozetAyirac} />

        <View style={styles.toplamSatir}>
          <Text style={styles.toplamEtiket}>
            {siparis.discountAmount > 0 ? 'Ödenen' : 'Toplam'}
          </Text>
          <Text style={styles.toplamTutar}>{paraBicimle(siparis.total)}</Text>
        </View>

        {/* ⭐ YENİ — KDV KIRILIMI

            ⚠️ TOPLAMIN ALTINDA — bilinçli, admin panelindekiyle aynı
            sebep. Yukarıdaki satırlar toplama GİDEN adımlar; KDV ise
            toplama hiçbir şey EKLEMİYOR. Fiyatlar KDV dahil olduğu için
            vergi zaten ödenen rakamın içinde.

            Üste koysaydık müşteri onu da eklenen bir kalem sanar,
            "ürünler + kargo + KDV mi ödedim?" diye düşünürdü. Sürpriz
            fiyat algısı, gerçek bir fiyat artışı kadar zarar verir.

            ⚠️ hasVatBreakdown false ise blok HİÇ çizilmiyor. Bu özellik
            eklenmeden önceki siparişlerde oran bilinmiyor; "KDV: 0,00 ₺"
            yazmak eksik değil YANLIŞ bilgi olurdu — o siparişte vergi
            alınmadığını iddia ederdi.

            ⚠️ Sunucunun gönderdiği bayrağa bakıyoruz, "vatLines.length"e
            değil. Karar sunucuda veriliyor ki üç ekran aynı koşulu ayrı
            ayrı yazıp birinde yanlış yapmasın. */}
        {siparis.hasVatBreakdown && (
          <View style={styles.kdvBlok}>
            <Text style={styles.kdvBaslik}>KDV dahil</Text>

            {siparis.vatLines.map((s) => (
              <View style={styles.kdvSatir} key={s.rate}>
                <Text style={styles.kdvEtiket}>
                  KDV %{s.rate} (matrah {paraBicimle(s.netAmount)})
                </Text>
                <Text style={styles.kdvDeger}>{paraBicimle(s.vatAmount)}</Text>
              </View>
            ))}

            {/* Toplam satırı SADECE birden fazla oran varsa.
                Tek oranda üstteki satırla birebir aynı sayı olurdu —
                aynı bilgiyi iki kez göstermek okuyanı "acaba farklı bir
                şey mi?" diye durdurur. */}
            {siparis.vatLines.length > 1 && (
              <View style={styles.kdvSatir}>
                <Text style={styles.kdvEtiket}>Toplam KDV</Text>
                <Text style={styles.kdvDeger}>
                  {paraBicimle(siparis.totalVat)}
                </Text>
              </View>
            )}
          </View>
        )}
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
    gap: bosluk.orta,
    paddingHorizontal: sayfaKenari,
    paddingVertical: bosluk.orta,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  geriButon: {
    width: 32,
  },

  ustOrta: {
    flex: 1,
    minWidth: 0,
  },

  /* ⚠️ Sipariş numarası eşit genişlikli fontta: alt alta gelen
     numaralar hizalı okunsun. Özel fontla kalınlık çalışmadığı için
     fontWeight verilmiyor — duran ama etkisi olmayan bir satır
     sonraki okuyucuyu yanıltır. */
  ustBaslik: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontSize: yazi.orta,
    letterSpacing: 0.5,
    color: renkler.yaziKoyu,
  },

  ustAlt: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },

  icerik: {
    padding: sayfaKenari,
    gap: bosluk.normal,
  },

  bolum: {
    gap: bosluk.kucuk,
  },

  /* ⭐ YENİ (Aşama 8.4) — destek kısayolu satırı.
     Menü satırlarıyla aynı dil (kart + ikon + chevron); yeni bir
     görünüm uydurmak, müşteriye ikinci bir kalıp öğretmek olurdu. */
  destekSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    backgroundColor: renkler.kartArka,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    borderRadius: kose.buyuk,
    paddingVertical: bosluk.normal,
    paddingHorizontal: bosluk.normal,
  },

  destekYazi: {
    flex: 1,
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  /* ⚠️ Bölüm etiketi KÜÇÜK ve BÜYÜK HARF — sipariş onay ekranıyla
     aynı dil. Kartın içindeki asıl bilgi adres/ödeme; etiket yalnızca
     "bu kart neyin kartı" diyor. Aynı puntoda olsalardı ikisi eşit
     ağırlıkta okunurdu. */
  bolumBaslik: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziGri,
    letterSpacing: 0.5,
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 7.4) — kutular artık kenarlıklı beyaz kart.
     acikKart zeminli kutular sayfa zemininden zor ayrılıyordu ve
     akışın geri kalanı (sepet, sipariş onayı) beyaz kart kullanıyor. */
  kutu: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
  },

  satir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: bosluk.orta,
    paddingVertical: bosluk.mikro,
  },

  etiket: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
  },

  deger: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  /* ⚠️ DÜZELTME (GV/Faz 7.4): `fontFamily` burada İKİ KEZ yazılıydı —
     önce Menlo/monospace, hemen ardından font.yari. İkincisi
     birincisini eziyordu, yani takip numarası hiçbir zaman eşit
     genişlikli fontla çizilmiyordu ve üstündeki yorum yalan
     söylüyordu.

     Eşit genişlikli font korundu: numara karakter karakter okunuyor
     ve "1" ile "l", "0" ile "O" ayrımı normal fontta zor. Yanlış
     okunan tek karakter numarayı kullanılmaz yapar. */
  takipNo: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: yazi.normal,
    letterSpacing: 0.5,
    color: renkler.yaziKoyu,
  },

  /* ⚠️ marginTop metinden BURAYA taşınmıştı: metinde kalsaydı ikon
     satırın tepesinde, metin aşağıda durur ve ikisi hizasız
     görünürdü. */
  kopyaIpucuSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: bosluk.mikro,
    marginTop: bosluk.kucuk,
  },

  kopyaIpucu: {
    fontSize: yazi.mikro,
    color: renkler.yaziGri,
    textAlign: 'right',
  },

  kopyaIpucuBasarili: {
    color: renkler.basari,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },

  /* ⭐ YENİ (GV/Faz 7.5) — takip butonu.
     Dolu turuncu: bu kutunun asıl eylemi ve kutuda başka basılabilir
     bir şey yok (takip numarası uzun basmayla kopyalanıyor, o bir
     kısayol). Üstteki ince ayraç butonu bilgiden ayırıyor. */
  takipButon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.kucuk,
    marginTop: bosluk.orta,
    paddingVertical: bosluk.orta,
    borderRadius: kose.orta,
    backgroundColor: renkler.anaRenk,
  },

  takipButonYazi: {
    flexShrink: 1,
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  /* React Native Text bileşeni satır sonlarını ZATEN koruyor;
     web'deki white-space: pre-wrap ihtiyacı burada yok. */
  notMetin: {
    fontSize: yazi.normal,
    lineHeight: satir.orta,
    color: renkler.yaziKoyu,
  },

  adresEtiket: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: bosluk.orta,
    marginBottom: bosluk.mikro,
  },

  adresMetin: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.yaziKoyu,
  },

  bosYazi: {
    fontSize: yazi.orta,
    color: renkler.yaziGri,
  },


  /* ---------- ÜRÜN SATIRLARI ---------- */

  urunSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    paddingVertical: bosluk.kucuk,
  },

  // ⭐ DEĞİŞTİ (GV/Faz 1) — ana renk zemin olmaktan çıkarıldı.
  // Gerekçe UrunKarti.resimYok'ta yazılı: turuncu eylem rengi,
  // resimsiz ürünün yer tutucusu bir eylem değil.
  harfKutu: {
    width: 44,
    height: 44,
    borderRadius: kose.kucuk,
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
  },

  harfYazi: {
    color: renkler.yaziGri,
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  urunOrta: {
    flex: 1,
    minWidth: 0,
  },

  urunAd: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.yaziKoyu,
  },

  urunBirim: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },

  urunToplam: {
    fontSize: yazi.normal,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },


  /* ---------- ALT BAR ---------- */

  altBar: {
    paddingHorizontal: sayfaKenari,
    paddingVertical: bosluk.orta,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  ozetSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: bosluk.mikro,
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

  ozetAyirac: {
    height: 1,
    backgroundColor: renkler.kenarlik,
    marginVertical: bosluk.kucuk,
  },

  toplamSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  toplamEtiket: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 7.4) — ödenen tutar turuncu olmaktan çıktı.
     Kuralın bu ekranda kalan son ihlaliydi; aynı düzeltme sepette,
     sipariş onayında ve başarı ekranında da yapıldı. 24 → yazi.baslik
     (22): ölçekte 24 yok. */
  toplamTutar: {
    fontSize: yazi.baslik,
    lineHeight: satir.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },


  /* ---------- KDV KIRILIMI ---------- */

  /* Toplamın altında ve belirgin şekilde daha silik: bu bir
     bilgilendirme, ödenen tutara giren bir kalem değil. Aynı punto ve
     renkte olsaydı toplanan bir satır gibi okunurdu.

     ⚠️ Üstteki ayraç kesikli DEĞİL: React Native'de borderStyle
     'dashed' Android'de yuvarlatılmış köşelerle birlikte çizilmiyor.
     Ayrımı incelik ve boşluk veriyor. */
  kdvBlok: {
    marginTop: bosluk.orta,
    paddingTop: bosluk.kucuk,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
  },

  kdvBaslik: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziGri,
    marginBottom: bosluk.mikro,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  kdvSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: bosluk.kucuk,
    marginBottom: bosluk.mikro,
  },

  kdvEtiket: {
    flex: 1,
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
  },

  kdvDeger: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziOrta,
  },
});
