import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
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
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>{siparis.orderNumber}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.icerik}>
        <Text style={styles.tarih}>Sipariş tarihi: {tarihBicimle(siparis.createdAt)}</Text>

        {/* KARGO DURUMU / İPTAL KUTUSU */}
        <View style={styles.bolum}>
          {!iptalMi && <Text style={styles.bolumBaslik}>Kargo Durumu</Text>}
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
            <Text style={styles.bolumBaslik}>Kargo Takip</Text>

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
              <Text
                style={[
                  styles.kopyaIpucu,
                  kopyalandi && styles.kopyaIpucuBasarili,
                ]}
              >
                {kopyalandi
                  ? '✓ Takip numarası kopyalandı'
                  : 'Numarayı kopyalamak için üzerine uzun bas'}
              </Text>
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
            <Text style={styles.bolumBaslik}>Sipariş Notun</Text>

            <View style={styles.kutu}>
              <Text style={styles.notMetin}>{siparis.customerNote}</Text>
            </View>
          </View>
        ) : null}

        {/* TESLİMAT ADRESİ
            Sipariş anında dondurulmuş bilgi — müşteri adresini sonradan
            değiştirse bile burada eski hali görünür ve görünmelidir. */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Teslimat Adresi</Text>

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
          <Text style={styles.bolumBaslik}>Ödeme</Text>
          <View style={styles.kutu}>
            <View style={styles.satir}>
              <Text style={styles.etiket}>Durum</Text>
              <Text style={[styles.deger, { color: odemeRengi(siparis.paymentStatus, renkler) }]}>
                {odemeYazisi(siparis.paymentStatus)}
              </Text>
            </View>
            <View style={styles.satir}>
              <Text style={styles.etiket}>Kart</Text>
              <Text style={styles.deger}>**** **** **** {siparis.cardLast4}</Text>
            </View>
          </View>
        </View>

        {/* ÜRÜNLER */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>Ürünler ({siparis.items.length})</Text>
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
      </ScrollView>

      <View style={styles.altBar}>
        {/* ⭐ İndirim varsa dökümü göster.
            
            ⚠️ Bu değerler DONDURULMUŞ alanlardan geliyor:
            subTotal, couponCode, discountAmount — hepsi sipariş
            anında Order tablosuna yazıldı. Kuponun bugünkü haline
            BAKMIYORUZ. Admin kuponu silse, oranını değiştirse veya
            pasifleştirse bile bu sipariş aynı görünür.
            
            Aynı desen adres (ShippingFullName vb.) ve birim fiyat
            (UnitPrice) için de geçerli — projedeki tutarlı yaklaşım. */}
        {siparis.discountAmount > 0 && (
          <>
            <View style={styles.ozetSatir}>
              <Text style={styles.ozetEtiket}>Ara toplam</Text>
              <Text style={styles.ozetDeger}>{paraBicimle(siparis.subTotal)}</Text>
            </View>

            <View style={styles.ozetSatir}>
              <Text style={styles.ozetEtiket}>
                İndirim{siparis.couponCode ? ` (${siparis.couponCode})` : ''}
              </Text>
              <Text style={[styles.ozetDeger, { color: renkler.basari }]}>
                −{paraBicimle(siparis.discountAmount)}
              </Text>
            </View>

            <View style={styles.ozetAyirac} />
          </>
        )}

        <View style={styles.toplamSatir}>
          <Text style={styles.toplamEtiket}>
            {siparis.discountAmount > 0 ? 'Ödenen' : 'Toplam'}
          </Text>
          <Text style={styles.toplamTutar}>{paraBicimle(siparis.total)}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan
  },
  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: renkler.arkaPlan
  },
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik
  },
  geriButon: {
    marginRight: 12
  },
  ustBaslik: {
    fontSize: 18,
    fontWeight: '600',
    color: renkler.yaziKoyu
  },
  icerik: {
    padding: 16
  },
  tarih: {
    fontSize: 13,
    color: renkler.yaziGri,
    marginBottom: 16
  },
  bolum: {
    marginBottom: 20
  },

  /* ⭐ YENİ — takip numarası.
     
     Eşit genişlikli font: numaralar karakter karakter okunuyor ve
     "1" ile "l", "0" ile "O" ayrımı normal fontta zor. Yanlış okunan
     tek karakter numarayı kullanılmaz yapar.
     
     letterSpacing: monospace'te bile uzun diziler birbirine yapışık
     görünüyor; harfleri hafif açmak gözle takibi kolaylaştırıyor. */
  takipNo: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    letterSpacing: 0.5,
    color: renkler.yaziKoyu,
    fontWeight: '600'
  },

  /* ⭐ YENİ — uzun basma ipucu / kopyalandı onayı */
  kopyaIpucu: {
    fontSize: 11,
    color: renkler.yaziGri,
    marginTop: 6,
    textAlign: 'right'
  },
  kopyaIpucuBasarili: {
    color: renkler.basari,
    fontWeight: '600'
  },

  /* ⭐ YENİ — müşteri notu metni.
     
     pre-wrap yerine RN'de bir şey yapmaya gerek yok: React Native
     Text bileşeni satır sonlarını ZATEN korur. Web'deki
     white-space: pre-wrap ihtiyacı burada yok — RN'in metin
     motoru HTML gibi boşlukları sıkıştırmıyor. */
  notMetin: {
    fontSize: 14,
    lineHeight: 21,
    color: renkler.yaziKoyu
  },

  bolumBaslik: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 8
  },
  kutu: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14
  },
  satir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  etiket: {
    fontSize: 15,
    color: renkler.yaziOrta
  },
  deger: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu
  },
  adresEtiket: {
    fontSize: 13,
    color: renkler.yaziGri,
    marginTop: 12,
    marginBottom: 4
  },
  adresMetin: {
    fontSize: 14,
    color: renkler.yaziKoyu,
    lineHeight: 20
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri
  },
  urunSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  harfKutu: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  harfYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 18,
    fontWeight: 'bold'
  },
  urunOrta: {
    flex: 1
  },
  urunAd: {
    fontSize: 15,
    fontWeight: '600',
    color: renkler.yaziKoyu
  },
  urunBirim: {
    fontSize: 13,
    color: renkler.yaziOrta,
    marginTop: 2
  },
  urunToplam: {
    fontSize: 15,
    fontWeight: 'bold',
    color: renkler.yaziKoyu
  },
  /* Artık birden fazla satır olabildiği için yatay dizilim
     kaldırıldı; satırlar alt alta akıyor. Yatay hizalama
     her satırın kendi içinde (toplamSatir / ozetSatir) yapılıyor. */
  altBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka
  },
  toplamSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  ozetSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  ozetEtiket: {
    fontSize: 14,
    color: renkler.yaziOrta
  },
  ozetDeger: {
    fontSize: 14,
    fontWeight: '600',
    color: renkler.yaziKoyu
  },
  ozetAyirac: {
    height: 1,
    backgroundColor: renkler.kenarlik,
    marginVertical: 8
  },
  toplamEtiket: {
    fontSize: 15,
    color: renkler.yaziOrta
  },
  toplamTutar: {
    fontSize: 24,
    fontWeight: 'bold',
    color: renkler.anaRenk
  }
});