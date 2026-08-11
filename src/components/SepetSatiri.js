import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { resimUrl } from '../utils/resim';
import { paraBicimle } from '../utils/bicimlendir';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

/* Sepetteki TEK bir satırın görünümü. Veri işi yok, sadece çizim + tıklama.
 *
 * ⭐ DEĞİŞTİ (GV/Faz 6.3) — SATIR ARTIK KENDİ KARTI DEĞİL.
 *
 * Eskiden her satır ayrı bir kart (zemin + kenarlık + köşe + alt
 * boşluk) çiziyordu. Tasarımda satırlar TEK bir kartın içinde,
 * aralarında ince ayraçlarla duruyor. Kartı ve ayracı çizme işi
 * artık listeye ait: gruplama listenin sorunu, satırın değil.
 * Satır kendi kabını çizseydi liste "kartın içindeki kart"
 * görünümünü düzeltmek için satırın stiline karışmak zorunda kalırdı.
 *
 * Yerleşim de tasarıma çevrildi:
 *   [72dp görsel] [ad ................................ (sil)]
 *                 [fiyat ....................... − n +]
 */
export default function SepetSatiri({ item, onAdetDegistir, onSil, onBas }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const resim = resimUrl(item.productImageUrl);

  // ⭐ YENİ — bu ürün satıştan kaldırılmış mı?
  //
  // "=== false" tercihinin sebebi SepetContext'te uzun uzun yazıldı:
  // alan hiç gelmediyse (undefined) ürünü satıştaymış gibi kabul ediyoruz.
  const pasif = item.isActive === false;

  // ⭐ YENİ (5.4) — sepete eklendiğinden beri fiyat değişti mi?
  //
  // ⚠️ KARŞILAŞTIRMA BURADA YAPILMIYOR.
  // "fiyatDegisti" sunucudan gelen hazır bir cevap. Burada
  // "item.eklenmeFiyati !== item.productPrice" yazsaydık aynı kural
  // ikinci kez tanımlanmış olurdu; kuruş yuvarlama gibi bir ayrıntıda
  // ikisi ayrışır ve satır uyarı gösterirken sipariş onayı
  // göstermezdi.
  //
  // "=== true": alan hiç gelmezse (eski API) undefined olur, uyarı
  // çizilmez. Emin olmadığımız bir şey için müşteriyi telaşlandırmayız.
  //
  // ⚠️ Pasif üründe gösterilmiyor: o satırda zaten "Satıştan
  // kaldırıldı" yazıyor ve müşterinin yapacağı tek şey silmek.
  // Satın alınamayan bir ürünün fiyatının değişmesi bilgi değil,
  // gürültü.
  const fiyatDegisti = item.fiyatDegisti === true && !pasif;

  // Pozitif fark = fiyat arttı (müşteri aleyhine).
  // İşaret zaten yönü söylüyor; ayrı bir "arttiMi" alanı istemedik.
  const fiyatArtti = fiyatDegisti && item.fiyatFarki > 0;

  return (
    <TouchableOpacity
      style={[styles.satir, pasif && styles.satirPasif]}
      activeOpacity={0.85}
      // ⭐ YENİ — pasif ürünün detayına GİDİLEMEZ.
      //
      // Backend'de GetProduct, pasif ürün için müşteriye 404 dönüyor.
      // Tıklamaya izin verseydik müşteri "Ürün bulunamadı" hata ekranıyla
      // karşılaşırdı — sepette duran bir şey için kafa karıştırıcı.
      // Tıklamayı baştan kapatmak dürüst davranış: gidecek yer yok.
      disabled={pasif}
      onPress={() => onBas && onBas(item)}
    >
      <View style={styles.ustSatir}>
        {resim ? (
          <Image
            source={{ uri: resim }}
            style={[styles.resim, pasif && styles.soluk]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.harfKutu, pasif && styles.soluk]}>
            <Text style={styles.harfYazi}>{item.productName.charAt(0)}</Text>
          </View>
        )}

        <View style={styles.orta}>
          {/* ⭐ DEĞİŞTİ (GV/Faz 6.3) — SİL BUTONU ADIN YANINA, SAĞ ÜSTE.
              Eskiden satırın en sağında, dikeyde ortadaydı ve adet
              kontrolüyle aynı hizaya düşüyordu; iki farklı ağırlıktaki
              eylem (adedi değiştir / tamamen çıkar) yan yana duruyordu.
              Tasarım silmeyi yukarı, adı kesen köşeye alıyor. */}
          <View style={styles.adSatir}>
            <Text
              style={[styles.urunAd, pasif && styles.yaziPasif]}
              numberOfLines={2}
            >
              {item.productName}
            </Text>

            {/* Çöp kutusu — pasif satırda BİLEREK açık bırakıldı.
                Müşterinin yapması gereken tek eylem bu; kapatmak onu
                çıkmaza sokardı.

                ⚠️ Renk artık token: burada elle yazılmış '#e74c3c'
                duruyordu. Koyu temada değişmiyordu ve tasarım
                sisteminin sabit renk yasağını çiğniyordu. */}
            <TouchableOpacity
              style={styles.silButon}
              onPress={() => onSil(item)}
              hitSlop={8}
              accessibilityLabel="Sepetten çıkar"
            >
              <Ionicons name="trash-outline" size={18} color={renkler.hata} />
            </TouchableOpacity>
          </View>

          {/* ⭐ DEĞİŞTİ (GV/Faz 6.3) — FİYAT VE ADET AYNI SATIRDA.
              Tasarımın yerleşimi: solda fiyat, sağda sayaç. Eskiden
              alt alta iki blok halindeydiler ve satır gereksiz
              uzuyordu.

              ⚠️ Eski fiyat, fiyat değiştiyse güncelin SOLUNDA ve üstü
              çizili. Sadece "fiyat değişti" demek ne kadar değiştiğini
              söylemezdi; iki sayı yan yana farkı tek bakışta anlatıyor. */}
          <View style={styles.altSatir}>
            <View style={styles.fiyatSatir}>
              {fiyatDegisti && (
                <Text style={styles.eskiFiyat}>
                  {paraBicimle(item.eklenmeFiyati)}
                </Text>
              )}

              <Text style={[styles.birimFiyat, pasif && styles.soluk]}>
                {paraBicimle(item.productPrice)}
              </Text>
            </View>

            {/* ⭐ YENİ — pasifse adet kontrolü yerine uyarı rozeti.

                Neden adet butonlarını gizliyoruz da sadece kilitlemiyoruz?
                Satın alınamayan bir ürünün adedini değiştirmenin hiçbir
                anlamı yok. Soluk ama duran butonlar "belki basarsam olur"
                hissi verir. Yerine yapılması GEREKEN şeyi söyleyen bir
                uyarı koyuyoruz — boşluk doldurmuyor, yön gösteriyor. */}
            {pasif ? (
              <View style={styles.pasifRozet}>
                <Ionicons name="close-circle" size={14} color={renkler.hata} />
                <Text style={styles.pasifRozetYazi}>Satıştan kaldırıldı</Text>
              </View>
            ) : (
              /* ⭐ DEĞİŞTİ (GV/Faz 6.3) — SAYAÇ TEK ÇERÇEVE İÇİNDE.
                 Eskiden iki ayrı kutulu buton ve aralarında boşlukta
                 duran bir sayı vardı. Tasarımda üçü tek bir çerçevenin
                 içinde, aralarında dikey ayraçlarla — üçünün tek bir
                 kontrol olduğu böyle okunuyor. */
              <View style={styles.adetKutu}>
                <TouchableOpacity
                  style={styles.adetButon}
                  onPress={() => onAdetDegistir(item, item.quantity - 1)}
                  accessibilityLabel="Adedi azalt"
                >
                  <Ionicons name="remove" size={16} color={renkler.yaziKoyu} />
                </TouchableOpacity>

                <Text style={styles.adetYazi}>{item.quantity}</Text>

                <TouchableOpacity
                  style={styles.adetButon}
                  onPress={() => onAdetDegistir(item, item.quantity + 1)}
                  accessibilityLabel="Adedi artır"
                >
                  <Ionicons name="add" size={16} color={renkler.yaziKoyu} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ⭐ DEĞİŞTİ (GV/Faz 6.3) — FİYAT DEĞİŞİKLİĞİ ARTIK YUMUŞAK
          ZEMİNLİ BİR NOT, çerçeveli küçük bir rozet değil.

          Tasarımda satırın altına tam genişlikte bir bilgi kutusu
          konuyor. Rozet, ad ve fiyatla aynı sütunda sıkışıyordu ve
          üç satırlık ürün adlarında kaybolabiliyordu.

          ⚠️ DÜŞÜŞ DE GÖSTERİLİYOR, SADECE ARTIŞ DEĞİL. Yalnızca
          artışı gösterseydik bu bir "kötü haber bildirimi" olurdu;
          müşteri fiyat düştüğünde bunu hiç öğrenmezdi. Renk hangisi
          olduğunu söylüyor: artış uyarı sarısı, düşüş başarı yeşili.

          ⚠️ Tasarım burada tek bir sarı kutu çiziyor çünkü yalnızca
          artışı düşünmüş. Yeşili biz ekledik; aynı mekanizmanın iyi
          haberi de taşıması gerekiyor. */}
      {fiyatDegisti && (
        <View
          style={[
            styles.fiyatNot,
            {
              backgroundColor: fiyatArtti
                ? renkler.yumusakUyari
                : renkler.yumusakBasari,
            },
          ]}
        >
          <Ionicons
            name={fiyatArtti ? 'trending-up' : 'trending-down'}
            size={14}
            color={fiyatArtti ? renkler.uyari : renkler.basari}
          />
          <Text
            style={[
              styles.fiyatNotYazi,
              { color: fiyatArtti ? renkler.uyari : renkler.basari },
            ]}
          >
            {fiyatArtti
              ? 'Sepete eklediğinden beri fiyatı arttı'
              : 'Sepete eklediğinden beri fiyatı düştü'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  /* ⭐ DEĞİŞTİ (GV/Faz 6.3) — kart kabuğu (zemin, kenarlık, köşe,
     alt boşluk) SİLİNDİ. Artık liste tarafında; bkz. dosya başı. */
  satir: {
    paddingVertical: bosluk.orta,
    paddingHorizontal: bosluk.normal,
  },

  /* ⭐ DEĞİŞTİ — pasif satırın işareti artık SOL KENAR ÇİZGİSİ.

     Tam çerçeve, kartın içindeki bir satıra kutu içinde kutu
     görünümü veriyordu. Sol kenar çizgisi sepet ekranındaki uyarı
     kutularının diliyle aynı: kırmızı şerit "burada bir engel var"
     demek.

     ⚠️ Tüm satıra opacity verilmiyor: uyarı rozetinin ve çöp
     kutusunun TAM görünür kalması lazım — müşterinin görmesi ve
     basması gereken şeyler onlar. Soluklaştırma sadece "artık
     önemsiz" olan parçalara (resim, fiyat) uygulanıyor. */
  satirPasif: {
    backgroundColor: renkler.acikKart,
    borderLeftWidth: 3,
    borderLeftColor: renkler.hata,
  },

  ustSatir: {
    flexDirection: 'row',
    gap: bosluk.orta,
  },

  /* Tek bir öğeyi soluklaştırmak için ortak yardımcı stil */
  soluk: {
    opacity: 0.45,
  },

  /* Ürün adı: soluk + üstü çizili.
     İki ayrı sinyal veriyoruz çünkü renk/opaklık tek başına bilgi
     taşımamalı — renk körü ya da güneş altında bakan kullanıcı
     çizgiyi yine de görür. */
  yaziPasif: {
    opacity: 0.45,
    textDecorationLine: 'line-through',
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 6.3) — 84 → 72dp, tasarımın ölçüsü.
     Satır artık kendi kartı olmadığı için görsel de küçüldü;
     84'lük kare, ayraçla bölünmüş bir listede fazla baskındı. */
  resim: {
    width: 72,
    height: 72,
    borderRadius: kose.orta,
    backgroundColor: renkler.acikGri,
  },

  // ⭐ DEĞİŞTİ (GV/Faz 1) — ana renk zemin olmaktan çıkarıldı.
  // Gerekçe UrunKarti.resimYok'ta yazılı.
  harfKutu: {
    width: 72,
    height: 72,
    borderRadius: kose.orta,
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
  },

  harfYazi: {
    color: renkler.yaziGri,
    fontSize: yazi.baslik,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  /* ⚠️ minWidth: 0 — flex çocuğu olmadan içeriğinden küçülmüyor ve
     numberOfLines devreye girmiyor; uzun bir ürün adı sil butonunu
     ekranın dışına iterdi. Aynı tuzağa yorum kartında düşülmüştü. */
  orta: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
  },

  adSatir: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.kucuk,
  },

  urunAd: {
    flex: 1,
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  silButon: {
    padding: bosluk.mikro,
  },

  /* Fiyat ile sayaç arasındaki mesafe: ürün adı iki satır olsa da
     olmasa da bu satır satırın dibinde kalıyor (orta:
     space-between). Sabit bir marginTop verseydik tek satırlık
     adlarda sayaç yukarı kayardı. */
  altSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.kucuk,
    marginTop: bosluk.kucuk,
  },

  fiyatSatir: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: bosluk.kucuk,
    flexShrink: 1,
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 6.3) — 13 → yazi.orta (15) ve kalın.
     Tasarımda satırın fiyatı ürün adından BÜYÜK; sepette müşterinin
     aradığı sayı o. Eskiden adın altında soluk gri bir yan bilgiydi. */
  birimFiyat: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  /* Eski fiyat: soluk + üstü çizili.
     Ürün adındaki pasif stilin aynı mantığı — renk tek başına bilgi
     taşımamalı, çizgi renkten bağımsız olarak "bu geçersiz" diyor. */
  eskiFiyat: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    textDecorationLine: 'line-through',
  },

  /* ⭐ YENİ — "Satıştan kaldırıldı" rozeti. */
  pasifRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.mikro,
    backgroundColor: renkler.yumusakHata,
    borderRadius: kose.kucuk,
    paddingVertical: bosluk.mikro,
    paddingHorizontal: bosluk.kucuk,
  },

  pasifRozetYazi: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.hata,
  },

  /* ⚠️ overflow: 'hidden' — içteki butonların basılı zemini
     çerçevenin yuvarlak köşelerinden taşmasın. */
  adetKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.kucuk,
    overflow: 'hidden',
  },

  adetButon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ⚠️ Sayının yanları dikey ayraçlı ve sabit genişlikte: adet
     1'den 10'a çıkınca kutu genişleyip satırı zıplatmasın. */
  adetYazi: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: renkler.inputKenar,
    paddingVertical: bosluk.kucuk,
  },

  /* ⭐ YENİ (GV/Faz 6.3) — fiyat değişikliği notu. */
  fiyatNot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    borderRadius: kose.kucuk,
    paddingVertical: bosluk.kucuk,
    paddingHorizontal: bosluk.orta,
    marginTop: bosluk.orta,
  },

  fiyatNotYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },
});
