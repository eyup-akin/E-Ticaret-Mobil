import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFavorite } from '../context/FavoriteContext';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { resimUrl } from '../utils/resim';
import { paraBicimle } from '../utils/bicimlendir';
// ⭐ YENİ (B1) — indirim kuralı ve yüzde hesabı tek dosyada
import { indirimBilgisi, yuzdeYazisi } from '../utils/indirim';
// ⭐ YENİ — tasarım sistemi
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';
import Rozet from './Rozet';
// ⭐ YENİ — puan şeridi için ortak bileşen (yorum ekranında da kullanılıyor).
import Yildizlar from './Yildizlar';
// ⭐ YENİ (5.1) — karttan doğrudan sepete ekleme
import AdetKontrolu from './AdetKontrolu';

function UrunKartiIc({ urun, onPress }) {
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

  // ⭐ YENİ (B1) — indirim durumu.
  //
  // Hesap burada yapılmıyor: kural utils/indirim.js'te, çünkü aynı
  // soruyu kompakt kart ve ürün detayı da soruyor.
  const { indirimliMi, eskiFiyat, yuzde } = indirimBilgisi(urun);

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

        {/* ⭐ DEĞİŞTİ (GV/Faz 2.1) — STOK ROZETİ ARTIK GÖRSELİN ÜSTÜNDE.

            Eskiden bilgi alanında, sepet butonuyla aynı satırdaydı.
            Sorun: o satır kartların ÇOĞUNDA boştu — rozet yalnızca
            "az" ve "yok" durumlarında çiziliyor, yani tipik bir
            listede kartların ~%85'inde 36dp'lik bir şerit sadece
            sağdaki butonu taşımak için duruyordu. Kartı uzatan
            sebeplerden biri buydu.

            Görselin sol üstü tasarımda zaten rozet bölgesi (indirim
            rozeti oraya gelecek — B1 onaylanırsa). Rozet oraya
            taşınınca bilgi alanı bir satır kısaldı ve sepet butonu
            fiyatın yanındaki boşluğa yerleşebildi.

            ⚠️ Sol üst seçildi, sağ üst değil: sağ üstte kalp var. */}
        {/* ⭐ DEĞİŞTİ (B1) — SOL ÜST ARTIK BİR ROZET SÜTUNU.

            İki rozet aynı köşeye talip: indirim (tasarımda sol üst)
            ve stok. Aralarında seçim YAPILMADI, alt alta konuldular.
            Biri diğerini gizleseydi ekran duruma göre yalan söylerdi:
            indirim rozeti stok rozetini bastırsaydı "son 2 ürün"
            uyarısı tam da aciliyetin en yüksek olduğu üründe
            kaybolurdu.

            ⚠️ İNDİRİM ÜSTTE. Dolu kırmızı hap, yumuşak zeminli stok
            rozetinden görsel olarak ağır; ağır olan üstte durunca
            sütun dengeli okunuyor.

            ⚠️ TÜKENMİŞ ÜRÜNDE DE ÇİZİLİYOR. "Şu an alınamaz" ile
            "fiyatı düştü" farklı iki gerçek; ikincisi stok gelince
            hâlâ geçerli olacak ve müşteri "stoka gelince haber ver"
            kararını buna bakarak veriyor. */}
        {(indirimliMi && yuzde > 0) || tukendi || azKaldi ? (
          <View style={styles.rozetYeri}>
            {indirimliMi && yuzde > 0 && (
              <Rozet tip="indirim" yazi={yuzdeYazisi(yuzde)} />
            )}

            {(tukendi || azKaldi) && (
              <Rozet
                tip={tukendi ? 'notr' : 'uyari'}
                yazi={tukendi ? 'Tükendi' : `Son ${urun.kalanAdet} ürün`}
              />
            )}
          </View>
        ) : null}
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

        {/* ---------- FİYAT + SEPET BUTONU (TEK SATIR) ----------

            ⭐ DEĞİŞTİ (GV/Faz 2.1) — ikisi artık aynı satırda.

            Eskiden fiyat tek başına bir satır, sepet butonu ise
            altında ayrı bir satırdı. Fiyatın sağındaki ~50dp
            bilerek boş bırakılmıştı; kullanıcının ekran görüntüsünde
            kırmızıyla işaretlediği ölü alan tam olarak orasıydı.

            ⚠️ ESKİ GEREKÇE HÂLÂ GEÇERLİ AMA ARTIK BAĞLAYICI DEĞİL.
            AdetKontrolu'nda "fiyat + sayaç yan yana taşar" diye
            yazılıydı ve doğruydu: sayaç HAPI ~68dp. Ama hap yalnızca
            ürün SEPETTEYKEN çiziliyor; sepette olmayan üründe 36dp'lik
            bir daire var. Tipik listede kartların çoğu ikinci
            durumda.

            ⚠️ Taşma riski fiyata "flex: 1 + minWidth: 0 +
            numberOfLines" ile değil, SATIRIN KENDİSİYLE çözülüyor:
            fiyat esneyip küçülmüyor (flexShrink: 0), buton sağa
            yaslanıyor. Sepetteki üründe hap sığmazsa satır büyür,
            fiyat KIRPILMAZ. Karttaki en kritik bilgiyi kırpmak
            kabul edilebilir değil — o kural değişmedi.

            Tükenmiş üründe AdetKontrolu null dönüyor; satırda
            yalnızca fiyat kalıyor. */}
        {/* ⭐ DEĞİŞTİ (B1) — SOLDAKİ FİYAT ARTIK BİR SÜTUN.

            İndirimli üründe eski fiyat GÜNCELİN ÜSTÜNDE, altında
            değil. Tasarımda da böyle ve sebebi okuma sırası: göz
            önce küçük soluk sayıyı geçip kalın olanda duruyor,
            yani son okuduğu şey ödeyeceği tutar oluyor.

            ⚠️ YAN YANA KOYULMADI. Kart ~181dp, bilgi alanı ~157dp;
            iki fiyat + sepet hapı (~68dp) aynı satıra sığmıyordu.
            Sığdırmak için fiyatı daraltmak gerekirdi ve karttaki en
            kritik bilgiyi kırpmak kabul edilemez (Faz 2.1 kararı).

            ⚠️ İNDİRİMSİZ KARTTA FAZLADAN SATIR AÇILMIYOR — eski
            fiyat satırı için yer AYRILMIYOR. Yer ayırsaydık
            kartların çoğunda (indirimli ürün azınlıktır) yine ölü
            bir şerit oluşurdu; Faz 2.1'de kaldırdığımız hatanın
            aynısı. Izgarada kartlar satır kabında zaten aynı
            yüksekliğe geriliyor, hizasızlık kartın içinde kalıyor. */}
        <View style={styles.fiyatSatir}>
          <View style={styles.fiyatKutu}>
            {indirimliMi && (
              <Text style={styles.eskiFiyat}>{paraBicimle(eskiFiyat)}</Text>
            )}

            {/* ⚠️ İNDİRİMLİ FİYAT YEŞİL, TURUNCU DEĞİL.
                Turuncu bu uygulamada "eylem" demek ve fiyatın
                hemen yanında sepet butonu var; ikisi aynı renk
                olsaydı hangisinin basılabilir olduğu renkten
                okunamazdı. Yeşil "kazandın" der ve turuncuyu
                eyleme bırakır. */}
            <Text style={[styles.fiyat, indirimliMi && styles.fiyatIndirimli]}>
              {paraBicimle(urun.price)}
            </Text>
          </View>

          <AdetKontrolu urun={urun} boyut="kart" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ⭐ YENİ (GV/Faz 2.1) — LİSTE PERFORMANSI
//
// ⚠️ Cihazda şu uyarı düşüyordu:
//   "VirtualizedList: You have a large list that is slow to update"
//
// Sebep: FlatList her değişiklikte görünen TÜM kartları yeniden
// çiziyordu. 26 ürünlük listede bir favori değişince 26 kart birden
// render oluyordu.
//
// ⚠️ MEMO FAVORİ GÜNCELLEMESİNİ ENGELLEMİYOR — kritik ayrım.
// React.memo yalnızca EBEVEYNDEN gelen prop değişimini durdurur;
// context değişimini durdurmaz. Kalp durumu useFavorite() ile
// BİLEŞENİN İÇİNDEN okunuyor, yani favori değişince bu kart yine
// kendi başına render oluyor — ama sadece o kart, diğer 25'i değil.
//
// ⚠️ Bunun çalışması için ekranlardaki "onPress" fonksiyonunun her
// render'da yeniden yaratılmaması gerekiyor; ekranlarda useCallback
// ile sabitlendi. Aksi halde prop her seferinde değişir ve memo
// hiçbir işe yaramazdı.
export default React.memo(UrunKartiIc);

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
  /* ⭐ DEĞİŞTİ (GV/Faz 2.1) — SABİT 200px YÜKSEKLİK YERİNE KARE.

     ⚠️ KARTIN "ÇOK UZUN" GÖRÜNMESİNİN ASIL SEBEBİ BURASIYDI.

     Kart genişliği ekranın %48'i; 390dp'lik bir telefonda ~181dp.
     Sabit 200px yükseklik, bu genişlikte 1:1,10 DİKEY bir görsel
     demekti — göz bunu "uzun" diye okuyor. Tasarımın tamamı 1:1
     kare görsel üzerine kurulu.

     aspectRatio kullanmanın ikinci faydası: ekran genişliği ne
     olursa olsun oran sabit kalıyor. Sabit piksel, küçük ekranda
     daha da dikey, tablette daha da yatık bir kart üretiyordu. */
  resimAlan: {
    width: '100%',
    aspectRatio: 1,
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

    /* ⚠️ flexShrink: 0 — fiyat ASLA daralmaz.
       Sepetteki üründe sayaç hapı geniş; esnemeye izin verseydik
       daralan taraf fiyat olur ve "₺1.799,5…" diye kırpılırdı.
       Kırpılacaksa satır büyüsün, fiyat değil. */
    flexShrink: 0,
  },

  /* ⭐ YENİ (B1) — eski fiyat + güncel fiyat sütunu.

     ⚠️ flexShrink: 0 sütunun kendisinde de var. Eski fiyat
     satırı güncel fiyattan dar olduğu için sütunun genişliğini
     fiyat belirliyor; esnemeye izin verilseydi sepet hapı geniş
     olduğunda daralan taraf yine fiyat olurdu. */
  fiyatKutu: {
    flexShrink: 0,
  },

  /* ⭐ YENİ (B1) — indirim öncesi fiyat.

     ⚠️ ÜSTÜ ÇİZİLİ + SOLUK: iki işaret birden.
     Yalnızca soluk yapsaydık renk tek bilgi kanalı olurdu ve
     renk körü kullanıcı iki fiyattan hangisinin geçerli olduğunu
     ayırt edemezdi. Çizgi renkten bağımsız çalışıyor.
     (SepetSatiri'ndeki fiyat değişikliği satırıyla aynı desen.) */
  eskiFiyat: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    lineHeight: satir.kucuk,
    textDecorationLine: 'line-through',
  },

  /* ⭐ YENİ (B1) — indirimli güncel fiyat.
     Yalnızca RENK değişiyor; punto ve kalınlık aynı kalıyor ki
     indirimli ve indirimsiz kartların fiyatları ızgarada aynı
     ağırlıkta okunsun. */
  fiyatIndirimli: {
    color: renkler.basari,
  },

  /* ⭐ YENİ (GV/Faz 2.1) — fiyat ve sepet butonu aynı satırda.

     Fiyatın sağındaki boşluk artık butonun yeri. Rozet buradan
     görselin sol üstüne taşındı, o yüzden ayrı bir alt satıra
     gerek kalmadı — kart bir satır kısaldı.

     ⚠️ justifyContent: 'space-between' ile buton sağa yaslı; ek bir
     boşluk doldurucu View'a gerek yok. */
  fiyatSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.kucuk,
  },

  /* ⭐ YENİ (GV/Faz 2.1) — görselin sol üstündeki rozet yuvası.

     ⚠️ Konum mutlak: rozet görselin akışına girmiyor, dolayısıyla
     görselin oranını (aspectRatio: 1) bozmuyor. */
  rozetYeri: {
    position: 'absolute',
    top: bosluk.kucuk,
    left: bosluk.kucuk,

    /* ⭐ YENİ (B1) — iki rozet alt alta durabiliyor.

       ⚠️ alignItems: 'flex-start' şart. Rozet kendi genişliğinde
       (alignSelf: 'flex-start') ama sütun içinde varsayılan
       'stretch' onları en genişin boyuna gerdiriyordu; "-%18" ile
       "Son 3 ürün" yan yana gelince kısa olan hap uzayıp boş
       zeminli görünüyordu. */
    alignItems: 'flex-start',
    gap: bosluk.mikro,
  },
});