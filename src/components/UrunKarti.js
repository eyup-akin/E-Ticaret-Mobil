import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFavorite } from '../context/FavoriteContext';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { resimUrl } from '../utils/resim';
import { paraBicimle } from '../utils/bicimlendir';
// ⭐ YENİ — tasarım sistemi
import { bosluk, kose, yazi, agirlik, font } from '../theme/olculer';
import Rozet from './Rozet';
// ⭐ YENİ — puan şeridi için ortak bileşen (yorum ekranında da kullanılıyor).
import Yildizlar from './Yildizlar';
// ⭐ YENİ (5.1) — karttan doğrudan sepete ekleme
import AdetKontrolu from './AdetKontrolu';

export default function UrunKarti({ urun, onPress }) {
  const { favoriMi, favoriDegistir } = useFavorite();
  const { token } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);
  const navigation = useNavigation();

  const favori = favoriMi(urun.id);
  const resim = resimUrl(urun.mainImageUrl);

  // ⭐ DEĞİŞTİ — ham stok yerine sunucunun verdiği DURUM.
  //
  // ⚠️ "urun.stock" ARTIK MÜŞTERİYE GÖNDERİLMİYOR.
  //
  // Sunucu üç durumdan birini gönderiyor: yok / az / var. Ham sayı
  // iki sebeple kaldırıldı: rakip stok takibi yapabiliyordu ve
  // "Stokta 847 adet var" aciliyeti öldürüyordu.
  //
  // ⚠️ "=== 'yok'" yazıyoruz, "!== 'var'" değil.
  // Alan hiç gelmezse (eski API sürümü) undefined olur; "!== 'var'"
  // yazsaydık BÜTÜN ürünler tükenmiş görünür ve hiçbiri satın
  // alınamazdı. Açıkça "yok" denmedikçe ürün satılabilir sayılıyor —
  // asıl kilit zaten sunucuda.
  const tukendi = urun.stokDurumu === 'yok';
  const azKaldi = urun.stokDurumu === 'az';

  // ⭐ Puan satırı: backend averageRating + reviewCount gönderince yanacak.
  //    Şu an yorum sistemi yokken bu değerler undefined → satır görünmez.
  const puanVar = urun.reviewCount > 0;

  function kalbeBasildi() {
    if (!token) {
      navigation.navigate('Giris');
      return;
    }
    favoriDegistir(urun.id);
  }

  return (
    <TouchableOpacity style={styles.kart} activeOpacity={0.85} onPress={onPress}>
      {/* ---------- RESİM ALANI (kartın ~%65'i) ---------- */}
      <View style={styles.resimAlan}>
        {resim ? (
          <Image source={{ uri: resim }} style={styles.resim} resizeMode="cover" />
        ) : (
          <View style={styles.resimYok}>
            <Text style={styles.resimHarf}>{urun.name.charAt(0)}</Text>
          </View>
        )}

        {tukendi && (
          <View style={styles.tukendiOrtu}>
            <Text style={styles.tukendiYazi}>TÜKENDİ</Text>
          </View>
        )}

        {/* ⭐ DEĞİŞTİ — kalp artık YARI SAYDAM BEYAZ DAİRE DEĞİL.

            Eski hali rgba(255,255,255,0.9) sabit bir daireydi ve
            koyu temada da beyaz kalıyordu — koyu bir ekranda parlak
            beyaz bir nokta gibi duruyordu.

            Artık tema zeminini kullanıyor. Ayrıca ikon rengi de
            sabit '#555' değil; o renk koyu temada görünmüyordu. */}
        <TouchableOpacity style={styles.kalpButon} onPress={kalbeBasildi} hitSlop={8}>
          <Ionicons
            name={favori ? 'heart' : 'heart-outline'}
            size={18}
            color={favori ? renkler.favoriRenk : renkler.yaziOrta}
          />
        </TouchableOpacity>
      </View>

      {/* ---------- BİLGİ ALANI ---------- */}
      <View style={styles.bilgi}>
        <Text style={styles.urunAd} numberOfLines={2}>{urun.name}</Text>

        {/* ⭐ DEĞİŞTİ — PUAN SATIRI ARTIK HER KARTTA VAR.

            Eskiden yalnızca yorumu olan üründe çiziliyordu. Sonuç:
            grid'de kartların bir kısmında satır var, bir kısmında
            yok — ürün adları ve fiyatlar farklı yüksekliklerde
            hizalanıyordu. Ayrıca puan, müşterinin karttan en çok
            beklediği ikinci bilgi (fiyattan sonra); yokluğu
            "bu üründe puan diye bir şey yok mu?" sorusunu doğuruyor.

            ⚠️ YORUMU OLMAYAN ÜRÜNDE "0,0" YAZMIYORUZ.
            Boş yıldızlar + "(0)" gösteriliyor. "0,0" bir PUAN
            iddiasıdır ve ürünün kötü puan aldığını söyler; oysa
            gerçek şu: henüz kimse puanlamamış. Aynı ayrımı KDV
            oranında ve EklenmeFiyati'nda da yaptık — yanlış sayı,
            eksik sayıdan tehlikelidir.

            ⚠️ Tek yıldız + rakam yerine BEŞ yıldız: kullanıcı 4,5'in
            beş üzerinden olduğunu okumak zorunda kalmıyor.

            Ortak Yildizlar bileşeni kullanılıyor — buradaki eski
            elle çizim sabit '#f5a623' rengini kartın içine
            gömüyordu. */}
        <View style={styles.puanSatir}>
          <Yildizlar deger={puanVar ? urun.averageRating : 0} boyut={12} />

          {puanVar && (
            <Text style={styles.puanYazi}>
              {Number(urun.averageRating).toFixed(1)}
            </Text>
          )}

          <Text style={styles.puanAdet}>({urun.reviewCount ?? 0})</Text>
        </View>

        <Text style={styles.fiyat}>{paraBicimle(urun.price)}</Text>

        {/* ---------- STOK ROZETİ + SEPET BUTONU ----------

            ⚠️ ROZET ARTIK İKİ DURUMLU, ÜÇ DEĞİL.
            "Stokta var" (yeşil) hali KALDIRILDI; geriye "Son X ürün"
            (turuncu) ve "Tükendi" (nötr) kaldı.

            Sebep: yeşil rozet neredeyse HER kartta çıkıyordu. Her
            yerde görünen bir işaret hiçbir şey söylemez — göz onu
            birkaç saniyede filtrelemeyi öğrenir ve o andan itibaren
            AYNI yerdeki "Son 3 ürün" uyarısını da görmez olur.
            Kıtlık sinyalini değersizleştiren şey bolluk sinyaliydi.

            Ayrıca "stokta var" zaten varsayılan durum: ürün kartta
            görünüyor ve sepete eklenebiliyorsa stoktadır. Aynı
            bilgiyi iki kez söylüyorduk.

            Kalan iki rozet varsayılandan SAPMA bildiriyor — ikisi de
            gerçek haber değeri taşıyor. Renk hâlâ bilgi: turuncu
            "acele et", nötr "bu bir hata değil, sadece bir durum".

            ⚠️ Renk koşullu HESAPLANMIYOR, Rozet'e TİP veriliyor.
            "tukendi ? renkler.yaziGri : renkler.uyari" yazmak,
            rengin ne anlama geldiğini çağrı yerinde saklardı.

            Sepet butonu da bu satırda: eskiden ürün görselinin sağ
            alt köşesinde yüzüyor ve fotoğrafı kapatıyordu. Genişlik
            hesabı ve sarmalayıcının gerekçesi altSatir / rozetSar
            stillerinde. */}
        <View style={styles.altSatir}>
          <View style={styles.rozetSar}>
            {(tukendi || azKaldi) && (
              <Rozet
                tip={tukendi ? 'notr' : 'uyari'}
                yazi={tukendi ? 'Tükendi' : `Son ${urun.kalanAdet} ürün`}
              />
            )}
          </View>

          {/* Tükenmiş üründe bileşen null dönüyor; satırda yalnızca
              "Tükendi" rozeti kalıyor. */}
          <AdetKontrolu urun={urun} boyut="kart" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  /* ⭐ DEĞİŞTİ (Aşama 4.5) — kenarlık kaldırıldı, gölge geldi.

     Referans tasarımlarda ürün kartlarının çerçevesi yok; kart
     zeminden gölgeyle ayrılıyor ve görsel alanı kendi açık gri
     karosuyla belli oluyor. 1px kenarlık kartları "kutu" gibi
     gösteriyor ve grid'i kafes gibi okutuyordu.

     ⚠️ elevation: 2 yerine tema gölgesi kullanılıyor. elevation
     sadece Android'de çalışıyordu; iOS'ta kartlar tamamen düz
     görünüyordu. Tema gölgesi iki platformu birden veriyor. */
  kart: {
    width: '48%',
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    marginBottom: bosluk.normal,
    overflow: 'hidden',
    ...renkler.golgeSm,
  },
  resimAlan: {
    width: '100%',
    height: 200,            // kartın ~%65'i. Ayar düğmesi burası.
    backgroundColor: renkler.acikKart,
    position: 'relative',
  },
  resim: {
    width: '100%',
    height: '100%',
  },
  // ⭐ DEĞİŞTİ (GV/Faz 1) — YER TUTUCU ARTIK ANA RENKTE DEĞİL.
  //
  // ⚠️ Bu, palet değişiminin ORTAYA ÇIKARDIĞI bir hataydı.
  //
  // Resimsiz ürünün yer tutucusu ana rengi zemin olarak
  // kullanıyordu. Mavideyken göze batmıyordu; turuncuya geçince
  // resimsiz ürünlerin olduğu bir listede ekranın yarısı turuncu
  // doldu ve "turuncu = eylem" kuralı görünür şekilde çöktü:
  // müşteri hangisinin basılabilir olduğunu renkten ayırt
  // edemiyordu.
  //
  // Ders: dekoratif amaçla kullanılan bir ANA RENK, palet
  // değişene kadar sorun gibi görünmüyor.
  resimYok: {
    width: '100%',
    height: '100%',
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resimHarf: {
    color: renkler.yaziGri,
    fontSize: 56,
    fontWeight: 'bold',
    fontFamily: font.kalin,
  },
  tukendiOrtu: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tukendiYazi: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: font.kalin,
    letterSpacing: 1,
  },
  kalpButon: {
    position: 'absolute',
    top: bosluk.kucuk,
    right: bosluk.kucuk,

    // ⭐ DEĞİŞTİ — sabit yarı saydam beyaz yerine tema zemini.
    // Eski değer koyu temada da beyaz kalıyordu.
    backgroundColor: renkler.kartArka,

    width: 32,
    height: 32,
    borderRadius: kose.tam,
    justifyContent: 'center',
    alignItems: 'center',
    ...renkler.golgeSm,
  },
  bilgi: {
    padding: bosluk.orta,
  },
  urunAd: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,

    // İki satırlık yer ayrılıyor ki kısa ve uzun adlı kartların
    // fiyat satırı aynı hizada kalsın. Grid'de hizasız fiyatlar
    // gözü yoruyor.
    minHeight: 36,
    marginBottom: bosluk.mikro,
  },
  puanSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: bosluk.mikro,
  },
  puanYazi: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    marginLeft: bosluk.mikro,
  },
  puanAdet: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginLeft: bosluk.mikro,
  },

  /* ⭐ DEĞİŞTİ — fiyat büyüdü ve renk değişti.

     17 → 18px: fiyat, kartın en çok bakılan bilgisi; ürün adıyla
     neredeyse aynı puntodaydı.

     ⚠️ RENK anaRenk (mavi) DEĞİL, yaziKoyu.

     Mavi bu uygulamada "tıklanabilir" demek (butonlar, bağlantılar).
     Fiyatı mavi yazmak, tıklanabilir bir şey olduğunu ima ediyordu.
     Referans tasarımlarda da fiyat nötr ve koyu; dikkati punto ve
     kalınlık çekiyor, renk değil. */
  fiyat: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.kucuk,
  },

  /* ⭐ YENİ — stok rozeti + sepet butonu satırı.

     ⚠️ FİYAT BU SATIRA ALINMADI, ÜSTTE TEK BAŞINA KALDI.
     Kart 165dp, iç boşluklar düşünce ~141dp kullanılabilir alan
     var. "₺1.799,50" 18px kalın puntoda ~90dp, sayaç hapı ~68dp:
     yan yana koysaydık 158dp ederdi ve taşardı. Taşmayı flex ile
     çözseydik daralan taraf fiyat olur, karttaki en kritik bilgi
     "₺1.799,5…" diye kırpılırdı.

     Rozet ise ~72dp — hapla birlikte 140dp, sınırın içinde. */
  altSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.kucuk,
  },

  /* Rozetin yeri — rozet çizilmese bile duruyor.

     ⚠️ flexShrink DEĞİL flex: 1.
     "Stokta var" kaldırıldıktan sonra bu sarmalayıcı çoğu kartta
     BOŞ kalıyor. Sadece flexShrink olsaydı boş kutu 0 genişlik alır,
     justifyContent: 'space-between' tek çocuk (buton) ile onu SOLA
     yaslardı. flex: 1 boşluğu doldurup butonu sağda tutuyor.

     ⚠️ minWidth: 0 ŞART. Flex çocukları varsayılan olarak kendi
     içeriklerinin altına inmeyi reddeder; bu olmadan uzun rozet
     metni ("Son 12 ürün") sarmalayıcıyı şişirip butonu kartın
     dışına iter. */
  rozetSar: {
    flex: 1,
    minWidth: 0,
  },
});