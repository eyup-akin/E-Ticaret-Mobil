import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { resimUrl } from '../utils/resim';
import { paraBicimle } from '../utils/bicimlendir';
// ⭐ YENİ (5.4) — tasarım sistemi ölçüleri.
//
// ⚠️ Bu dosyanın ESKİ stilleri hâlâ ham sayı kullanıyor (fontSize: 15,
// borderRadius: 14 ...). Onları bu turda topluca token'a çevirmedik —
// fiyat uyarısıyla ilgisi olmayan 20 satırı değiştirmek, değişikliği
// gözden geçirilemez hale getirirdi. Yeni eklenen stiller token
// kullanıyor; dosyanın tamamı Aşama 4.7'de elden geçecek.
import { bosluk, kose, yazi, agirlik, font } from '../theme/olculer';

// Sepetteki TEK bir satırın görünümü. Veri işi yok, sadece çizim + tıklama.
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
        <Text
          style={[styles.urunAd, pasif && styles.yaziPasif]}
          numberOfLines={2}
        >
          {item.productName}
        </Text>

        {/* ⭐ DEĞİŞTİ (5.4) — fiyat değiştiyse ESKİ fiyat da gösteriliyor.

            Üstü çizili eski fiyat + güncel fiyat yan yana. Sadece
            "fiyat değişti" yazmak müşteriye ne kadar değiştiğini
            söylemezdi; iki sayıyı yan yana koymak farkı tek bakışta
            anlatıyor.

            ⚠️ Güncel fiyat SAĞDA ve normal renkte — ödenecek olan o.
            Eski fiyat soluk ve üstü çizili: bilgi veriyor ama
            "geçersiz" olduğunu da söylüyor. */}
        <View style={[styles.fiyatSatir, !fiyatDegisti && styles.fiyatSatirTekBasina]}>
          {fiyatDegisti && (
            <Text style={styles.eskiFiyat}>
              {paraBicimle(item.eklenmeFiyati)}
            </Text>
          )}

          <Text style={[styles.birimFiyat, pasif && styles.soluk]}>
            {paraBicimle(item.productPrice)}
          </Text>
        </View>

        {/* ⭐ YENİ (5.4) — fiyat değişikliği rozeti.

            ⚠️ DÜŞÜŞ DE GÖSTERİLİYOR, SADECE ARTIŞ DEĞİL.
            Yalnızca artışı gösterseydik uyarı bir "kötü haber
            bildirimi" olurdu; müşteri fiyat düştüğünde bunu hiç
            öğrenmezdi. Aynı mekanizma iyi haberi de taşıyor —
            ve rozetin rengi hangisi olduğunu söylüyor. */}
        {fiyatDegisti && (
          <View
            style={[
              styles.fiyatRozet,
              { borderColor: fiyatArtti ? renkler.uyari : renkler.basari },
            ]}
          >
            <Ionicons
              name={fiyatArtti ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={fiyatArtti ? renkler.uyari : renkler.basari}
            />
            <Text
              style={[
                styles.fiyatRozetYazi,
                { color: fiyatArtti ? renkler.uyari : renkler.basari },
              ]}
            >
              {fiyatArtti ? 'Fiyat arttı' : 'Fiyat düştü'}
            </Text>
          </View>
        )}

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
          <View style={styles.adetKutu}>
            <TouchableOpacity
              style={styles.adetButon}
              onPress={() => onAdetDegistir(item, item.quantity - 1)}
            >
              <Ionicons name="remove" size={18} color={renkler.yaziKoyu} />
            </TouchableOpacity>

            <Text style={styles.adetYazi}>{item.quantity}</Text>

            <TouchableOpacity
              style={styles.adetButon}
              onPress={() => onAdetDegistir(item, item.quantity + 1)}
            >
              <Ionicons name="add" size={18} color={renkler.yaziKoyu} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Çöp kutusu — pasif satırda BİLEREK açık bırakıldı.
          Müşterinin yapması gereken tek eylem bu; kapatmak onu
          çıkmaza sokardı. */}
      <TouchableOpacity
        style={styles.silButon}
        onPress={() => onSil(item)}
      >
        <Ionicons name="trash-outline" size={22} color="#e74c3c" />
      </TouchableOpacity>

    </TouchableOpacity>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renkler.kartArka,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: renkler.kenarlik
  },

  /* ⭐ YENİ — pasif satırın kenarlığı kırmızıya döner.
     
     Neden tüm satıra opacity vermiyoruz?
     Uyarı rozetinin ve çöp kutusunun TAM görünür kalması lazım —
     müşterinin görmesi ve basması gereken şeyler onlar. Soluklaştırmayı
     sadece "artık önemsiz" olan parçalara (resim, fiyat) uyguluyoruz. */
  satirPasif: {
    borderColor: renkler.hata,
    backgroundColor: renkler.acikKart
  },

  /* Tek bir öğeyi soluklaştırmak için ortak yardımcı stil */
  soluk: {
    opacity: 0.45
  },

  /* Ürün adı: soluk + üstü çizili.
     İki ayrı sinyal veriyoruz çünkü renk/opaklık tek başına bilgi
     taşımamalı — renk körü ya da güneş altında bakan kullanıcı
     çizgiyi yine de görür. */
  yaziPasif: {
    opacity: 0.45,
    textDecorationLine: 'line-through'
  },

  resim: {
    width: 84,
    height: 84,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: renkler.acikGri
  },
  // ⭐ DEĞİŞTİ (GV/Faz 1) — ana renk zemin olmaktan çıkarıldı.
  // Gerekçe UrunKarti.resimYok'ta yazılı.
  harfKutu: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  harfYazi: {
    color: renkler.yaziGri,
    fontSize: 30,
    fontWeight: 'bold',
    fontFamily: font.kalin,
  },
  orta: {
    flex: 1
  },
  urunAd: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: 4
  },
  birimFiyat: {
    fontSize: 13,
    color: renkler.yaziGri
  },

  /* ⭐ YENİ (5.4) — eski fiyat + güncel fiyat aynı satırda.

     ⚠️ Alt boşluk buradan KALKTI (eskiden birimFiyat'taydı) çünkü
     artık iki farklı durum var: rozet varsa boşluğu rozet veriyor,
     yoksa fiyatSatirTekBasina veriyor. Boşluğu fiyat metninin
     üstünde bırakırsak rozetli durumda 10 + 8 = 18px'lik bir
     kopukluk oluşurdu. */
  fiyatSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    marginBottom: bosluk.mikro
  },

  /* Rozet çizilmediğinde satırın eski alt boşluğu korunuyor —
     fiyat değişmeyen satırların yerleşimi hiç değişmesin diye. */
  fiyatSatirTekBasina: {
    marginBottom: 10
  },

  /* Eski fiyat: soluk + üstü çizili.
     Ürün adındaki pasif stilin aynı mantığı — renk tek başına bilgi
     taşımamalı, çizgi renkten bağımsız olarak "bu geçersiz" diyor. */
  eskiFiyat: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    opacity: 0.7,
    textDecorationLine: 'line-through'
  },

  /* ⭐ YENİ (5.4) — fiyat değişikliği rozeti.

     Kenarlık rengi çağrı yerinden geliyor (artış turuncu, düşüş
     yeşil); burada yalnızca renkten BAĞIMSIZ olan ölçüler duruyor.
     Rengi buraya sabitleseydik iki ayrı stil objesi gerekirdi. */
  fiyatRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.mikro,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: kose.kucuk,
    paddingVertical: 3,
    paddingHorizontal: bosluk.kucuk,
    marginBottom: 10
  },
  fiyatRozetYazi: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },

  /* ⭐ YENİ — "Satıştan kaldırıldı" rozeti.
     
     Adet kontrolünün kapladığı dikey alanla benzer yükseklikte
     tutuyoruz ki satır yükseklikleri listede zıplamasın. */
  pasifRozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: renkler.arkaPlan,
    borderWidth: 1,
    borderColor: renkler.hata,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 9
  },
  pasifRozetYazi: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.hata
  },

  adetKutu: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  adetButon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    justifyContent: 'center',
    alignItems: 'center'
  },
  adetYazi: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginHorizontal: 14,
    minWidth: 20,
    textAlign: 'center'
  },
  sag: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 8
  },
  silButon: {
    padding: 4
  },
  satirToplam: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: font.kalin,
    color: renkler.anaRenk
  }
});