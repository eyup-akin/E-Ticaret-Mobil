import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiGet, apiDelete } from '../services/api';
import { useTema } from '../context/TemaContext';
import { useSiparisTekrarla } from '../hooks/useSiparisTekrarla';
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

import BosDurum from '../components/BosDurum';
import OnayPenceresi from '../components/OnayPenceresi';
import { SatirListesiIskeleti } from '../components/Iskelet';

// ⭐ YENİ — HIZLI SİPARİŞLERİM
//
// Müşterinin "sonra yine alırım" diye kaydettiği siparişler.
//
// ⚠️ BU EKRAN SİPARİŞ VERMİYOR. "Tekrar sipariş ver" butonu ürünleri
// SEPETE ekliyor; ödeme adımı normal sepet akışından geçiyor. Tek
// dokunuşla sipariş vermek, müşteriye tutarı ve adresi göstermeden
// para çekmek olurdu.
export default function HizliSiparislerimEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  // Tekrarlama akışının tamamı ortak hook'ta — onay penceresi, sepet
  // tazeleme ve sonuç mesajı dahil. Sipariş detay ekranı da aynısını
  // kullanıyor.
  const { sor: tekrarlaSor, islemde: tekrarIslemde, pencere: tekrarPenceresi } = useSiparisTekrarla();

  const [liste, setListe] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [agHatasi, setAgHatasi] = useState(false);

  // Çıkarma onayı bekleyen kayıt (null = pencere kapalı).
  //
  // ⚠️ Onay SORULUYOR: kaydı çıkarmak geri alınabilir bir işlem ama
  // müşteri listeyi yeniden kurmak için siparişi bulup tekrar
  // kaydetmek zorunda kalır. Tek dokunuşla kaybolmamalı.
  const [cikarilacak, setCikarilacak] = useState(null);

  const getir = useCallback(async () => {
    try {
      setAgHatasi(false);
      const veri = await apiGet('/hizli-siparisler');
      setListe(veri);
    } catch (hata) {
      setListe([]);
      setAgHatasi(true);
      console.log('Hızlı siparişler alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }, []);

  // ⚠️ useFocusEffect, useEffect DEĞİL: müşteri bu ekrandan sipariş
  // detayına gidip orada kaydı kaldırabilir. Geri döndüğünde liste
  // güncel olmalı. (İadelerim ve Siparişlerim ekranlarındaki desen.)
  useFocusEffect(
    useCallback(() => {
      let iptal = false;

      (async () => {
        await getir();
        if (iptal) return;
      })();

      return () => { iptal = true; };
    }, [getir])
  );

  async function cikar() {
    const kayit = cikarilacak;
    setCikarilacak(null);

    if (!kayit) return;

    // ⚠️ İYİMSER GÜNCELLEME — bilerek, ve burada DOĞRU.
    //
    // Satırı hemen listeden düşürüyoruz; istek arkadan gidiyor.
    // Sipariş başarı ekranındaki "kaydet" butonunda bunu YAPMAMIŞTIK
    // çünkü orada başarısızlık müşterinin kaydettiğini sanmasına yol
    // açardı. Burada tersi: başarısız olursa liste tazelenip satır
    // geri geliyor, yani yanlış bilgi ekranda kalmıyor.
    setListe((oncekiler) => oncekiler.filter((x) => x.orderId !== kayit.orderId));

    try {
      await apiDelete('/hizli-siparisler/' + kayit.orderId);
    } catch {
      // Sunucu reddettiyse gerçeği yeniden sor — elle geri eklemek,
      // satırın listedeki yerini de hatırlamayı gerektirirdi.
      getir();
    }
  }

  function kart({ item }) {
    return (
      <View style={styles.kart}>
        <View style={styles.kartUst}>
          <View style={styles.kartUstSol}>
            <Text style={styles.siparisNo}>{item.siparisNo}</Text>
            <Text style={styles.meta}>
              {tarihBicimle(item.siparisTarihi)}
            </Text>
          </View>

          {/* ⚠️ Çıkarma ikonu, metinli buton değil: ikincil ve
              yıkıcı bir eylem. Metin verseydik "Tekrar sipariş ver"
              ile aynı ağırlıkta görünürdü. */}
          <TouchableOpacity
            onPress={() => setCikarilacak(item)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={item.siparisNo + ' kaydını çıkar'}
          >
            <Ionicons name="bookmark" size={20} color={renkler.anaRenk} />
          </TouchableOpacity>
        </View>

        {/* ⚠️ Ürün adları siparişe DONDURULMUŞ hâlleriyle geliyor.
            Ürün silinse ya da adı değişse bile müşteri neyi
            kaydettiğini görüyor. */}
        <Text style={styles.urunler} numberOfLines={2}>
          {item.urunler.join(' · ')}
          {item.urunCesidi > item.urunler.length
            ? ` +${item.urunCesidi - item.urunler.length} ürün`
            : ''}
        </Text>

        <View style={styles.altSatir}>
          <View>
            <Text style={styles.adet}>
              {item.urunCesidi} çeşit · {item.toplamAdet} adet
            </Text>
            <Text style={styles.tutar}>{paraBicimle(item.toplam)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.tekrarButon, tekrarIslemde && styles.tekrarButonPasif]}
            onPress={() => tekrarlaSor(item.orderId)}
            disabled={tekrarIslemde}
            activeOpacity={0.85}
          >
            {tekrarIslemde ? (
              <ActivityIndicator size="small" color={renkler.anaRenkUstuYazi} />
            ) : (
              <Ionicons name="repeat" size={16} color={renkler.anaRenkUstuYazi} />
            )}
            <Text style={styles.tekrarYazi}>Tekrar sipariş ver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <Text style={styles.ustBaslik}>Hızlı Siparişlerim</Text>
      </View>

      {yukleniyor ? (
        <View style={styles.icerik}><SatirListesiIskeleti /></View>
      ) : agHatasi ? (
        <BosDurum
          ikon="cloud-offline-outline"
          baslik="Bağlanamadık"
          aciklama="Hızlı siparişlerini getiremedik. Bağlantını kontrol edip tekrar dene."
        />
      ) : liste.length === 0 ? (
        /* ⚠️ Açıklama NEREDEN kaydedileceğini söylüyor. "Henüz kayıt
           yok" demek yeterli değildi: müşteri bu ekranın nasıl
           dolacağını bilmiyor ve boş ekran bir çıkmaz olurdu. */
        <BosDurum
          ikon="bookmark-outline"
          baslik="Henüz kayıtlı siparişin yok"
          aciklama="Bir siparişi tamamladıktan sonra 'Hızlı siparişlerime kaydet' diyerek buraya ekleyebilirsin. Sık aldığın siparişleri tek dokunuşla sepete geri koyarsın."
        />
      ) : (
        <FlatList
          data={liste}
          keyExtractor={(x) => x.orderId.toString()}
          renderItem={kart}
          contentContainerStyle={styles.icerik}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ⭐ Tekrarlama akışının kendi penceresi — onay, sonuç ve hata
          adımlarının üçü de burada. Hook döndürüyor; ekran yalnızca
          çiziyor. */}
      {tekrarPenceresi}

      <OnayPenceresi
        acik={cikarilacak !== null}
        baslik="Kaydı çıkar"
        mesaj={
          cikarilacak
            ? `${cikarilacak.siparisNo} hızlı siparişlerinden çıkarılacak. Siparişin kendisi silinmez, geçmişinde kalmaya devam eder.`
            : ''
        }
        onayYazisi="Çıkar"
        yikici
        ikon="bookmark-outline"
        onOnayla={cikar}
        onVazgec={() => setCikarilacak(null)}
      />
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
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

  ustBaslik: {
    flex: 1,
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  icerik: {
    padding: sayfaKenari,
    gap: bosluk.orta,
  },

  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
    gap: bosluk.kucuk,
  },

  kartUst: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: bosluk.orta,
  },

  kartUstSol: {
    flex: 1,
  },

  siparisNo: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  meta: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },

  urunler: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.yaziOrta,
  },

  altSatir: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: bosluk.orta,
    marginTop: bosluk.mikro,
  },

  adet: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
  },

  /* ⚠️ Tutar mavi/turuncu DEĞİL: bu panelde ana renk "tıklanabilir"
     demek ve fiyatı onunla yazmak tıklanır sanılmasına yol açardı.
     Dikkati punto ve kalınlık çekiyor. */
  tutar: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    marginTop: 2,
  },

  tekrarButon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    backgroundColor: renkler.anaRenk,
    paddingVertical: bosluk.orta,
    paddingHorizontal: bosluk.normal,
    borderRadius: kose.orta,
  },

  tekrarButonPasif: {
    opacity: 0.6,
  },

  tekrarYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },
});
