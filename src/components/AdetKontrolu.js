import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { useSepet } from '../context/SepetContext';
import { useAyarlar } from '../context/AyarlarContext';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik } from '../theme/olculer';

// ============================================================
//  ADET KONTROLÜ
//
//  Ürün sepette DEĞİLSE  → "Sepete Ekle" butonu
//  Ürün sepette İSE      → −  [2]  +  kontrolü
//
//  boyut : 'kucuk' | 'buyuk' (ürün detayı) | 'kart' (ürün kartı)
//
//  ⚠️ 'kart' — ürün kartının BİLGİ ALANINDA, stok rozetiyle aynı
//  satırda sağda duran kompakt buton. Sepette değilken sepet
//  ikonlu bir daire; sepete girince aynı yerde kompakt hap sayaç.
//
//  ⚠️ ESKİDEN GÖRSELİN ÜSTÜNDE YÜZÜYORDU ('yuzen'), ARTIK DEĞİL.
//  Görselin üstünde durunca ürün fotoğrafının sağ alt köşesini
//  kapatıyordu — fotoğrafın en çok ürün detayı taşıyan bölgesi
//  orası. Bilgi alanının sağı zaten boştu.
//
//  ⚠️ NEDEN FİYATIN YANINA DEĞİL, ROZET SATIRINA?
//  Kart 165dp; bilgi alanı iç boşluklar düşünce ~141dp kalıyor.
//  "₺1.799,50" tek başına 18px kalın puntoda ~90dp yer kaplıyor,
//  sayaç hapı ise ~68dp. İkisi yan yana taşardı ve daralan taraf
//  FİYAT olurdu — karttaki en kritik bilgiyi "₺1.799,5…" diye
//  kırpmak kabul edilebilir değil. Stok rozeti ise çoğu kartta hiç
//  çizilmiyor (yalnızca "Son X ürün" / "Tükendi"); en geniş hali bile
//  ~72dp ve hapla yan yana rahat sığıyor.
//
//  ⚠️ İKİ TEKNİK TUZAK BURADA ÇÖZÜLÜYOR:
//
//  1) HIZLI TIKLAMA
//     "+"ya 5 kez basılırsa 5 istek gider ve cevaplar SIRASIZ
//     dönebilir; eski cevap sonra gelirse ekranda yanlış sayı
//     kalır. Çözüm: ekranı ANINDA güncelle (iyimser), isteği
//     400 ms geciktir (debounce). 5 tıklama tek istek olur.
//
//  2) MİSAFİR
//     Sepet veritabanında ve UserId'ye bağlı — misafirin sepeti
//     olamaz. Giriş ekranına yönlendiriyoruz.
//
//  ⚠️ SUNUCUYA MUTLAK ADET GÖNDERİLİYOR, "artır" DEĞİL.
//  adetGuncelle bir PUT ve gövdesinde nihai adet var. Böylece
//  aynı istek iki kez gitse bile sonuç aynı — idempotent.
//  "1 artır" deseydik, tekrarlanan istek adedi iki kez artırırdı.
// ============================================================
export default function AdetKontrolu({ urun, boyut = 'kucuk' }) {
  const { token } = useAuth();
  const { sepet, sepeteEkle, adetGuncelle, sepettenCikar } = useSepet();
  const { ayarlar } = useAyarlar();
  const { renkler } = useTema();
  const navigation = useNavigation();

  const styles = stilOlustur(renkler, boyut);

  // Bu ürünün sepetteki satırı (yoksa undefined)
  const sepetSatiri = sepet.find((s) => s.productId === urun.id);

  // ⭐ İYİMSER ADET
  //
  // Ekranda gösterilen sayı. Sunucudan gelen değerden BAĞIMSIZ
  // olarak, kullanıcı bastığı anda değişiyor.
  //
  // null = "bekleyen değişiklik yok, sepetteki değeri göster"
  const [yerelAdet, setYerelAdet] = useState(null);
  const [islemde, setIslemde] = useState(false);

  const sayacRef = useRef(null);

  // Gösterilecek adet: bekleyen bir değişiklik varsa o, yoksa sepetteki.
  const adet = yerelAdet ?? sepetSatiri?.quantity ?? 0;

  // ---------- ÜST SINIR ----------
  //
  // ⚠️ HAM STOK ARTIK GELMİYOR (Aşama 5.3).
  //
  // Sunucu yalnızca "az" durumunda kalanAdet gönderiyor — ve bu
  // tam olarak sınırın önem kazandığı durum. Bol stokta bağlayıcı
  // sınır sepetin kendi üst sınırı (varsayılan 99).
  //
  // Asıl kilit yine sunucuda: sipariş anındaki atomik UPDATE stok
  // yetmezse siparişi reddediyor. Buradaki sınır kullanıcıya ERKEN
  // ve anlaşılır geri bildirim vermek için.
  const stokSiniri =
    urun.stokDurumu === 'az' && urun.kalanAdet != null
      ? urun.kalanAdet
      : ayarlar.sepetMaksAdet;

  const ustSinir = Math.min(stokSiniri, ayarlar.sepetMaksAdet);

  // ⚠️ Bileşen sökülürken bekleyen zamanlayıcıyı temizle.
  // Temizlemezsek kullanıcı ekrandan çıktıktan sonra istek gider
  // ve sökülmüş bir bileşenin state'i güncellenmeye çalışılır.
  useEffect(() => {
    return () => {
      if (sayacRef.current) {
        clearTimeout(sayacRef.current);
      }
    };
  }, []);

  // ---------- SUNUCUYA GECİKMELİ YAZ ----------
  function gecikmeliYaz(hedefAdet) {
    if (sayacRef.current) {
      clearTimeout(sayacRef.current);
    }

    sayacRef.current = setTimeout(async () => {
      try {
        if (hedefAdet <= 0) {
          await sepettenCikar(sepetSatiri);
        } else {
          await adetGuncelle(sepetSatiri, hedefAdet);
        }
      } catch (hata) {
        console.log('Adet güncellenemedi:', hata.message);
      } finally {
        // ⚠️ Yerel değeri BIRAKIYORUZ — artık sepetteki değer
        // geçerli. Bırakmasaydık ekran, sunucunun kırptığı
        // değeri değil bizim gönderdiğimizi göstermeye devam
        // ederdi (örn. sunucu 99'a kırptı ama ekranda 120 yazıyor).
        setYerelAdet(null);
      }
    }, 400);
  }

  // ---------- İLK EKLEME ----------
  async function sepeteEkleBas() {
    if (!token) {
      navigation.navigate('Giris');
      return;
    }

    try {
      setIslemde(true);
      await sepeteEkle(urun.id, 1);
    } catch (hata) {
      console.log('Sepete eklenemedi:', hata.message);
    } finally {
      setIslemde(false);
    }
  }

  // ---------- ARTIR / AZALT ----------
  function degistir(fark) {
    const yeni = adet + fark;

    // Üst sınırı aşma — sessizce durduruyoruz.
    // Uyarı göstermek her tıklamada bir pencere açardı; buton
    // zaten soluklaşıp basılamaz hale geliyor.
    if (yeni > ustSinir) {
      return;
    }

    setYerelAdet(yeni);
    gecikmeliYaz(yeni);
  }

  // ---------- GÖRÜNÜM ----------

  const tukendi = urun.stokDurumu === 'yok';
  const kartta = boyut === 'kart';

  // ---------- KART: sepette değil → sepet ikonlu daire ----------
  if (kartta && adet <= 0) {
    // Tükenmiş üründe buton hiç çizilmiyor. Soluk bir buton
    // göstermek "belki basarım" ümidi verirdi; yokluk daha net.
    if (tukendi) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.kartDaire}
        onPress={sepeteEkleBas}
        disabled={islemde}
        activeOpacity={0.8}
        hitSlop={8}
      >
        {islemde ? (
          <ActivityIndicator size="small" color={renkler.anaRenkUstuYazi} />
        ) : (
          /* ⭐ DEĞİŞTİ — "add" (+) yerine sepet ikonu.

             "+" tek başına NE eklendiğini söylemiyordu; aynı ikon
             favoriye, listeye, karşılaştırmaya eklemek için de
             kullanılıyor. Sepet ikonu eylemin hedefini ikonun
             kendisinde taşıyor.

             ⚠️ 'cart-outline' seçildi, 'cart' değil: alttaki
             "Sepete Ekle" butonu (boyut='kucuk'/'buyuk') zaten
             bu ikonu kullanıyor. Aynı eylem iki yerde farklı
             ikonla görünmemeli. */
          <Ionicons name="cart-outline" size={18} color={renkler.anaRenkUstuYazi} />
        )}
      </TouchableOpacity>
    );
  }

  // ---------- KART: sepette → kompakt hap sayaç ----------
  if (kartta) {
    return (
      <View style={styles.kartHap}>
        <TouchableOpacity onPress={() => degistir(-1)} activeOpacity={0.7} hitSlop={6}>
          <Ionicons
            name={adet === 1 ? 'trash-outline' : 'remove'}
            size={16}
            color={adet === 1 ? renkler.hata : renkler.anaRenkUstuYazi}
          />
        </TouchableOpacity>

        <Text style={styles.kartAdet}>{adet}</Text>

        <TouchableOpacity
          onPress={() => degistir(1)}
          disabled={adet >= ustSinir}
          activeOpacity={0.7}
          hitSlop={6}
        >
          <Ionicons
            name="add"
            size={16}
            color={renkler.anaRenkUstuYazi}
            style={adet >= ustSinir ? styles.pasif : null}
          />
        </TouchableOpacity>
      </View>
    );
  }

  // Sepette değil → tek buton
  if (adet <= 0) {
    return (
      <TouchableOpacity
        style={[styles.ekleButon, tukendi && styles.pasif]}
        onPress={sepeteEkleBas}
        disabled={islemde || tukendi}
        activeOpacity={0.85}
      >
        {islemde ? (
          <ActivityIndicator size="small" color={renkler.anaRenkUstuYazi} />
        ) : (
          <>
            <Ionicons
              name={tukendi ? 'close-circle-outline' : 'cart-outline'}
              size={boyut === 'buyuk' ? 20 : 16}
              color={renkler.anaRenkUstuYazi}
            />
            <Text style={styles.ekleYazi}>
              {tukendi ? 'Stokta Yok' : 'Sepete Ekle'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  // Sepette → adet kontrolü
  const artirilamaz = adet >= ustSinir;

  return (
    <View style={styles.kontrol}>
      {/* Adet 1'ken "−" çöp kutusuna dönüşüyor: bir sonraki basış
          ürünü sepetten çıkaracak. İkonun değişmesi bunu önceden
          söylüyor — kullanıcı ne olacağını basmadan biliyor. */}
      <TouchableOpacity
        style={styles.dugme}
        onPress={() => degistir(-1)}
        activeOpacity={0.7}
        hitSlop={6}
      >
        <Ionicons
          name={adet === 1 ? 'trash-outline' : 'remove'}
          size={boyut === 'buyuk' ? 20 : 16}
          color={adet === 1 ? renkler.hata : renkler.yaziKoyu}
        />
      </TouchableOpacity>

      <Text style={styles.adet}>{adet}</Text>

      <TouchableOpacity
        style={[styles.dugme, artirilamaz && styles.pasif]}
        onPress={() => degistir(1)}
        disabled={artirilamaz}
        activeOpacity={0.7}
        hitSlop={6}
      >
        <Ionicons
          name="add"
          size={boyut === 'buyuk' ? 20 : 16}
          color={renkler.yaziKoyu}
        />
      </TouchableOpacity>
    </View>
  );
}

const stilOlustur = (renkler, boyut) => {
  const buyuk = boyut === 'buyuk';

  return StyleSheet.create({
    ekleButon: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: bosluk.kucuk,

      backgroundColor: renkler.anaRenk,
      borderRadius: kose.orta,
      paddingVertical: buyuk ? 14 : bosluk.kucuk,
      paddingHorizontal: bosluk.orta,
    },

    ekleYazi: {
      color: renkler.anaRenkUstuYazi,
      fontSize: buyuk ? yazi.orta : yazi.kucuk,
      fontWeight: agirlik.kalin,
    },

    kontrol: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',

      backgroundColor: renkler.acikKart,
      borderRadius: kose.orta,
      paddingVertical: buyuk ? 6 : 3,
      paddingHorizontal: bosluk.kucuk,
    },

    dugme: {
      width: buyuk ? 38 : 28,
      height: buyuk ? 38 : 28,
      borderRadius: kose.kucuk,
      backgroundColor: renkler.kartArka,

      alignItems: 'center',
      justifyContent: 'center',
    },

    adet: {
      flex: 1,
      textAlign: 'center',
      fontSize: buyuk ? yazi.orta : yazi.normal,
      fontWeight: agirlik.kalin,
      color: renkler.yaziKoyu,
    },

    pasif: {
      opacity: 0.45,
    },

    /* ---------- KART VARYANTI ----------

       Ürün kartının bilgi alanında, stok rozetiyle aynı satırda
       sağda duran kompakt buton.

       ⚠️ GÖLGE YOK — bilerek.
       Eskiden bu buton ürün FOTOĞRAFININ üstünde yüzüyordu ve
       gölge (golgeMd) onu fotoğraftan ayırmak için gerekliydi.
       Artık düz kart zemininde duruyor: dolu mavi bir daire beyaz
       zeminde zaten ayrışıyor. Gölgeyi bırakmak, kartın kendi
       gölgesinin (golgeSm) içinde ikinci bir gölge katmanı
       yaratıp yüzeyi bulanıklaştırırdı.

       ⚠️ 40 → 36px. Rozet satırına giriyor; 40px satırı gereksiz
       yere uzatıp kartı büyütüyordu. */
    kartDaire: {
      width: 36,
      height: 36,
      borderRadius: kose.tam,
      backgroundColor: renkler.anaRenk,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* Sepetteyken aynı yerde kompakt hap.

       Dairenin yüksekliğiyle AYNI (36px): sepete eklenince buton
       büyüyüp kartın yerleşimini zıplatmıyor, sadece yana açılıyor.

       ⚠️ İç boşluk ve aralıklar dar tutuldu (8 / 4). Toplam
       genişlik ~68dp; rozetle birlikte kartın ~141dp'lik bilgi
       alanına sığması buna bağlı. Bu değerleri büyütmek rozeti
       kırptırır. */
    kartHap: {
      height: 36,
      flexDirection: 'row',
      alignItems: 'center',
      gap: bosluk.mikro,
      paddingHorizontal: bosluk.kucuk,
      borderRadius: kose.tam,
      backgroundColor: renkler.anaRenk,
    },

    kartAdet: {
      minWidth: 14,
      textAlign: 'center',
      color: renkler.anaRenkUstuYazi,
      fontSize: yazi.normal,
      fontWeight: agirlik.kalin,
    },
  });
};
