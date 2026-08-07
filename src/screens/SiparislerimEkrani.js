import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Platform, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { useAuth } from '../context/AuthContext';
import GirisGerekliEkrani from '../components/GirisGerekliEkrani';
import AramaCubugu from '../components/AramaCubugu';
import { durumYazisi, durumRengi, odemeYazisi, odemeRengi } from '../utils/durum';   // ⭐
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';                     // ⭐
// ⭐ YENİ — tasarım sistemi ölçüleri. Bu dosyanın ESKİ stilleri hâlâ ham
// sayı kullanıyor; sadece yeni eklenen durum şeridi token'a bağlandı.
import { bosluk, kose, yazi, agirlik } from '../theme/olculer';

// ⭐ YENİ — DURUM ŞERİDİNİN SIRASI VE ETİKETLERİ
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
  { ozetAnahtari: 'hazirlaniyor', durumKodu: 'hazirlaniyor', etiket: 'Hazırlanıyor' },
  { ozetAnahtari: 'kargoda', durumKodu: 'kargoda', etiket: 'Kargoda' },
  { ozetAnahtari: 'teslimEdildi', durumKodu: 'teslim_edildi', etiket: 'Teslim Edildi' },
  { ozetAnahtari: 'iptal', durumKodu: 'iptal', etiket: 'İptal' },
];

export default function SiparislerimEkrani({ navigation }) {
  const { token } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [siparisler, setSiparisler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');

  // ⭐ YENİ — durum sayaçları (sunucudan) ve seçili filtre.
  //
  // ⚠️ SAYILAR SUNUCUDAN GELİYOR, LİSTEDEN SAYILMIYOR.
  // Sipariş listesi ileride sayfalanacak; elimizdeki diziyi
  // gruplayıp saysaydık yalnızca YÜKLENMİŞ sayfayı sayardık ve
  // "Teslim Edildi (5)" yazarken gerçekte 40 tane olurdu. Rakam
  // patlamaz, sessizce yanlış çıkardı.
  const [ozet, setOzet] = useState(null);

  // null = "Tümü". Durum kodu tutuluyor (teslim_edildi gibi).
  const [seciliDurum, setSeciliDurum] = useState(null);

  async function siparisleriGetir() {
    try {
      // ⚠️ İki istek PARALEL, arka arkaya değil — aralarında
      // bağımlılık yok, sıralı yapsaydık ekran toplam süre kadar
      // beklerdi.
      //
      // ⚠️ allSettled, all DEĞİL.
      //
      // Promise.all kullansaydık özet ucu patladığında SİPARİŞ
      // LİSTESİ DE düşerdi — müşteri, tamamen çalışan siparişlerini
      // sırf sayaç şeridi yüzünden göremezdi. Özet bir SÜStür, liste
      // asıl içeriktir; süsün hatası içeriği götürmemeli.
      //
      // Özet gelmezse ozet null kalıyor ve şerit hiç çizilmiyor.
      const [listeSonuc, ozetSonuc] = await Promise.allSettled([
        apiGet('/orders'),
        apiGet('/orders/durum-ozeti'),
      ]);

      if (listeSonuc.status === 'fulfilled') {
        setSiparisler(listeSonuc.value);
      } else {
        console.log('Siparişler alınamadı:', listeSonuc.reason?.message);
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

  // ⭐ YENİ — önce durum filtresi, sonra arama.
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
        // önce küçük harfe çeviriyoruz. Kullanıcı "sp-2607" de yazsa,
        // sadece "4821" de yazsa bulunsun.
        const noEslesme = (s.orderNumber || '')
          .toLowerCase()
          .includes(kelime);
        const urunEslesme = s.items.some((u) => u.productName.toLowerCase().includes(kelime));
        return noEslesme || urunEslesme;
      })
    : durumFiltreli;

  function siparisKarti({ item }) {
    const rozetR = durumRengi(item.status, renkler);
    const odemeR = odemeRengi(item.paymentStatus, renkler);

    const urunOzet = item.items.map((u) => u.productName + ' × ' + u.quantity).join(', ');

    const odemeIkon =
      item.paymentStatus === 'odendi' ? 'checkmark-circle'
      : item.paymentStatus === 'iade_edildi' ? 'arrow-undo-outline'
      : 'time-outline';

    return (
      <TouchableOpacity
        style={styles.kart}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SiparisDetay', { siparisId: item.id })}
      >
        <View style={styles.kartUst}>
          <Text style={styles.siparisNo}>{item.orderNumber}</Text>
          <Text style={styles.tutar}>{paraBicimle(item.total)}</Text>
        </View>

        <Text style={styles.tarih}>{tarihBicimle(item.createdAt)}</Text>

        <Text style={styles.urunOzet} numberOfLines={2}>{urunOzet}</Text>

        <View style={styles.rozetler}>
          <View style={[styles.rozet, { backgroundColor: rozetR }]}>
            <Text style={styles.rozetYazi}>{durumYazisi(item.status)}</Text>
          </View>

          <View style={[styles.rozetOdeme, { borderColor: odemeR }]}>
            <Ionicons name={odemeIkon} size={13} color={odemeR} />
            <Text style={[styles.rozetOdemeYazi, { color: odemeR }]}>  {odemeYazisi(item.paymentStatus)}</Text>
          </View>

          <Text style={styles.kartBilgi}>**** {item.cardLast4}</Text>
        </View>
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

  if (yukleniyor) {
    return <View style={styles.ortala}><ActivityIndicator size="large" color={renkler.anaRenk} /></View>;
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <Text style={styles.baslik}>Siparişlerim</Text>

      {/* ⭐ YENİ — DURUM ŞERİDİ

          ⚠️ Yol haritasında bu "her durum bir satır" olarak
          tasarlanmıştı. Referansta ayrı bir ekrandı; bizde sipariş
          listesiyle AYNI ekranda. Dikey liste, asıl içeriği (siparişleri)
          ekranın altına iterdi. Yatay çip şeridi aynı sayıları
          gösteriyor ve üstüne FİLTRE işlevi kazandırıyor.

          ⚠️ SAYISI 0 OLAN DURUM DA ÇİZİLİYOR ama basılamıyor.
          "İptal (0)" görmek müşteriye "iptalim yok" der; satırın hiç
          olmaması "burada iptal diye bir şey yok mu?" sorusunu
          doğurur. Basılabilir bırakmak ise boş listeye götüren bir
          çıkmaz olurdu.

          Özet gelmediyse (eski API, ağ hatası) şerit hiç çizilmiyor —
          sipariş listesi normal çalışmaya devam ediyor. */}
      {ozet && siparisler.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.durumSerit}
        >
          {/* "Tümü" çipi — seçili durumdan çıkış yolu.
              Olmasaydı müşteri bir durumu seçtikten sonra tüm
              listeye dönmek için aynı çipe tekrar basmayı tahmin
              etmek zorunda kalırdı. */}
          <TouchableOpacity
            style={[styles.cip, seciliDurum === null && styles.cipSecili]}
            onPress={() => setSeciliDurum(null)}
            activeOpacity={0.7}
          >
            <Text style={[styles.cipYazi, seciliDurum === null && styles.cipYaziSecili]}>
              Tümü ({ozet.toplam ?? 0})
            </Text>
          </TouchableOpacity>

          {DURUMLAR.map((d) => {
            const adet = ozet[d.ozetAnahtari] ?? 0;
            const secili = seciliDurum === d.durumKodu;
            const bos = adet === 0;

            return (
              <TouchableOpacity
                key={d.durumKodu}
                style={[styles.cip, secili && styles.cipSecili, bos && styles.cipBos]}
                onPress={() => setSeciliDurum(d.durumKodu)}
                disabled={bos}
                activeOpacity={0.7}
              >
                <Text style={[styles.cipYazi, secili && styles.cipYaziSecili]}>
                  {d.etiket} ({adet})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {siparisler.length > 0 && (
        <AramaCubugu
          value={aramaMetni}
          onChangeText={setAramaMetni}
          onSubmit={() => {}}
          placeholder="Sipariş no veya ürün ara..."
        />
      )}

      {siparisler.length === 0 ? (
        <View style={styles.ortala}>
          <Ionicons name="receipt-outline" size={64} color={renkler.yaziGri} />
          <Text style={styles.bosYazi}>Henüz siparişin yok.</Text>
        </View>
      ) : (
        <FlatList
          data={filtreliSiparisler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={siparisKarti}
          contentContainerStyle={styles.liste}
          ListEmptyComponent={<Text style={styles.bosYazi}>Eşleşen sipariş bulunamadı.</Text>}
        />
      )}
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
  baslik: {
    fontSize: 24,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  liste: {
    padding: 12
  },

  /* ⭐ YENİ — DURUM FİLTRE ŞERİDİ

     ⚠️ Bu çipler ortak bir Chip bileşenine ÇIKARILMADI — bilerek.
     Yol haritası Chip'i Aşama 6/7 için planlıyor ve projenin kuralı
     şu: "kural tek yerde kullanılıyorsa orada durur, İKİNCİ tüketici
     çıktığı an ortak yere taşınır." Bugün tek tüketici burası.
     Filtre paneli (6.3) yazılırken buradan çıkarılacak. */
  durumSerit: {
    paddingHorizontal: bosluk.orta,
    paddingTop: bosluk.orta,
    gap: bosluk.kucuk
  },
  cip: {
    paddingHorizontal: bosluk.orta,
    paddingVertical: bosluk.kucuk,
    borderRadius: kose.tam,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka
  },

  /* Seçili çip: dolu zemin.
     Sadece kenarlık rengini değiştirmek yetmezdi — güneş altında ve
     küçük ekranda 1px'lik renk farkı seçilebilir bir sinyal değil. */
  cipSecili: {
    backgroundColor: renkler.anaRenk,
    borderColor: renkler.anaRenk
  },

  /* Sayısı 0 olan çip: görünür ama soluk ve basılamaz.
     Görünmesi bilgi ("iptalin yok"), soluk olması da o bilginin
     tıklanacak bir şey OLMADIĞINI söylüyor. */
  cipBos: {
    opacity: 0.4
  },
  cipYazi: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.yari,
    color: renkler.yaziOrta
  },
  cipYaziSecili: {
    color: renkler.anaRenkUstuYazi
  },
  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: renkler.kenarlik
  },
  kartUst: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  siparisNo: {
    // Tek aralıklı yazı tipi: alt alta gelen numaralar hizalı görünür.
    // ⚠️ 'monospace' sadece Android'de çalışır, iOS'ta böyle bir font yok.
    // Platform.select her işletim sisteminde doğru fontu seçer.
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace'
    }),
    fontSize: 14,
    fontWeight: 'bold',
    color: renkler.yaziKoyu
  },
  tutar: {
    fontSize: 17,
    fontWeight: 'bold',
    color: renkler.anaRenk
  },
  tarih: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginBottom: 8  // ⭐ yeni
  },
  urunOzet: {
    fontSize: 13,
    color: renkler.yaziOrta,
    marginBottom: 10
  },
  rozetler: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rozet: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8
  },
  rozetYazi: {
    fontSize: 12,
    fontWeight: '600',
    color: renkler.anaRenkUstuYazi
  },
  rozetOdeme: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1
  },
  rozetOdemeYazi: {
    fontSize: 12,
    fontWeight: '600'
  },
  kartBilgi: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginLeft: 'auto'
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri,
    marginTop: 12,
    textAlign: 'center'
  }
});