import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

/* ⭐ YENİ (GV/Faz 2.6) — ORTAK BOŞ DURUM İSKELETİ
 *
 * Yumuşak daire + çizgi ikon + başlık + açıklama + tek eylem.
 *
 * ⚠️ Faz 2'de yazılmadı, BUGÜNE bırakıldı: ilk tüketicisi Faz 6.7
 * (boş sepet). Tüketicisi olmayan bileşeni erken yazmak, gerçek
 * ihtiyaç ortaya çıkınca ikinci kez elden geçirmek demekti —
 * `UrunKartiKompakt` da aynı sebeple Faz 4.5'e ertelenmişti.
 *
 * ⚠️ `GirisGerekliEkrani` ile KARIŞTIRMA. O da daire + başlık +
 * buton çiziyor ama farklı bir soruyu cevaplıyor: "bu ekranı görmek
 * için giriş gerek". Bu ise "buradasın, yetkin var, ama içerik yok".
 * İkisini tek bileşende toplamak, birinin butonlarını değiştirince
 * diğerini bozmak olurdu — `Rozet`/`Chip` ayrımının aynısı.
 *
 * Kullanımı:
 *   <BosDurum
 *     ikon="cart-outline"
 *     baslik="Sepetin boş"
 *     aciklama="Hemen alışverişe başla ve favori ürünlerini ekle."
 *     eylemYazisi="Alışverişe Başla"
 *     onEylem={() => navigation.navigate('AnaSayfa')}
 *   />
 *
 * Eylem isteğe bağlı: `onEylem` verilmezse buton hiç çizilmez.
 * Gidilecek bir yer yoksa (arama sonucu boş) buton koymak,
 * müşteriyi hiçbir şeye götürmeyen bir düğmeye baktırmak olurdu.
 */
export default function BosDurum({
  ikon,
  baslik,
  aciklama,
  eylemYazisi,
  onEylem,
}) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  return (
    <View style={styles.kap}>
      {/* ⚠️ Daire zemini acikKart, anaRenk DEĞİL.
          Turuncu bir daire "burada bir eylem var" derdi; oysa bu
          daire sadece ikonu tutan bir yüzey. Faz 1'de dört yerde
          düzeltilen dekoratif ana renk hatasının aynısı olurdu.

          ⚠️ İkon çizgi (outline) hâli: dolu ikon vurgu demek ve
          burada vurgulanacak bir şey yok — boşluğu anlatıyoruz. */}
      <View style={styles.daire}>
        <Ionicons
          name={ikon || 'file-tray-outline'}
          size={44}
          color={renkler.yaziGri}
        />
      </View>

      <Text style={styles.baslik}>{baslik}</Text>

      {aciklama ? <Text style={styles.aciklama}>{aciklama}</Text> : null}

      {/* ⚠️ Buton ÇERÇEVELİ (ikincil), dolu değil.
          Boş durum bir hata hâli değil, bir dinlenme hâli; dolu
          turuncu buton ekranın tek nesnesi olarak fazla bağırırdı.
          Aynı gerekçe ürün detayındaki "Şimdi Al"da da yazılı. */}
      {onEylem && eylemYazisi ? (
        <TouchableOpacity
          style={styles.eylem}
          onPress={onEylem}
          activeOpacity={0.85}
        >
          <Text style={styles.eylemYazi}>{eylemYazisi}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const stilOlustur = (renkler) =>
  StyleSheet.create({
    kap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: bosluk.dev,
      paddingVertical: bosluk.genis,
    },

    /* 96dp: tasarım 128 çiziyor ama orada daire tek başına bir
       masaüstü sayfasını dolduruyor. Telefonda 128'lik daire
       başlığı katlanan klavyeli ekranlarda aşağı itiyordu. */
    daire: {
      width: 96,
      height: 96,
      borderRadius: kose.tam,
      backgroundColor: renkler.acikKart,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: bosluk.normal,
    },

    baslik: {
      fontSize: yazi.buyuk,
      lineHeight: satir.buyuk,
      fontWeight: agirlik.kalin,
      fontFamily: font.kalin,
      color: renkler.yaziKoyu,
      textAlign: 'center',
    },

    aciklama: {
      fontSize: yazi.normal,
      lineHeight: satir.normal,
      color: renkler.yaziOrta,
      textAlign: 'center',
      marginTop: bosluk.kucuk,

      /* ⚠️ Genişlik sınırı: ortalanmış metin satır satır aynı
         uzunlukta olursa blok gibi okunuyor. Dar tutunca göz
         satır sonlarını yakalıyor. */
      maxWidth: 280,
    },

    eylem: {
      marginTop: bosluk.genis,
      borderWidth: 1.5,
      borderColor: renkler.anaRenk,
      borderRadius: kose.tam,
      paddingVertical: bosluk.orta,
      paddingHorizontal: bosluk.dev,
    },

    eylemYazi: {
      fontSize: yazi.orta,
      fontWeight: agirlik.kalin,
      fontFamily: font.kalin,
      color: renkler.anaRenk,
    },
  });
