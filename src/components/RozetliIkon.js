import React from 'react';
import { font } from '../theme/olculer';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';

// SAYAÇ ROZETLİ İKON
//
// Sekme çubuğundaki sepet ve favori ikonlarının ortak görsel iskeleti.
//
// ⚠️ BU BİLEŞEN VERİ BİLMİYOR — sadece verilen sayıyı çiziyor.
//    useSepet veya useFavorite çağırmıyor. Sebebi: aynı görünümü
//    yarın bildirim sayacı, mesaj sayacı gibi başka yerlerde de
//    kullanabilelim. Bileşen ne kadar az şey bilirse o kadar çok
//    yerde işe yarar.
//
// props:
//   ikon    : Ionicons adı ('cart', 'heart', ...)
//   sayi    : rozette gösterilecek sayı (0 veya altıysa rozet çizilmez)
//   color   : ikon rengi — sekme çubuğu aktif/pasif duruma göre veriyor
//   size    : ikon boyutu — sekme çubuğu veriyor
//   maxSayi : bu değerin üstündeki sayılar "N+" olarak gösterilir
export default function RozetliIkon({ ikon, sayi, color, size, maxSayi = 9 }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  // Rozette yazacak metin — türetilmiş değer, ayrı state yok.
  //
  // Neden sınır koyuyoruz?
  //   "127" gibi bir sayı rozeti üç katına çıkarır, ikonu iter ve
  //   sekme çubuğunun hizasını bozar. Üstelik kullanıcı için "127 mi
  //   128 mi" bilgisinin bir değeri yok — "çok" demek yeterli.
  //
  // Neden 9? Tek haneli sayılar rozeti dar tutuyor. Çoğu uygulama
  // (WhatsApp, Instagram) 9+ veya 99+ kullanıyor; sekme çubuğu gibi
  // dar bir alanda 9+ daha uygun.
  const rozetYazisi = sayi > maxSayi ? maxSayi + '+' : String(sayi);

  return (
    <View>
      <Ionicons name={ikon} size={size} color={color} />

      {/* Sayı 0 ise rozet HİÇ çizilmiyor.
          
          Alternatif: çizip "0" yazmak. Onu seçmedik çünkü boş sepet
          zaten bir bilgi değil — rozet ancak dikkat çekmesi gereken
          bir şey varken görünmeli. Sürekli duran rozet "gürültü"
          olur ve kullanıcı onu görmemeye başlar. */}
      {sayi > 0 && (
        <View style={styles.rozet}>
          <Text style={styles.rozetYazi}>{rozetYazisi}</Text>
        </View>
      )}
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  rozet: {
    // position: 'absolute' → ikonun üstüne biner, yer kaplamaz.
    // Kapsayıcı <View>'in boyutu ikon kadar kalır ve sekme hizası bozulmaz.
    position: 'absolute',
    top: -4,
    right: -8,

    // minWidth + paddingHorizontal ikilisi:
    //   tek haneli sayıda daire (16x16)
    //   "9+" gibi iki karakterde hafifçe genişleyip oval olur
    // Sabit width verseydik "9+" sığmazdı.
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,

    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rozetYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: font.kalin,
  },
});