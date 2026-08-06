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
import { bosluk, kose, yazi, agirlik } from '../theme/olculer';
import Rozet from './Rozet';

export default function UrunKarti({ urun, onPress }) {
  const { favoriMi, favoriDegistir } = useFavorite();
  const { token } = useAuth();
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);
  const navigation = useNavigation();

  const favori = favoriMi(urun.id);
  const resim = resimUrl(urun.mainImageUrl);
  const tukendi = urun.stock <= 0;

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

        {/* ⭐ Puan satırı — sadece yorum varsa */}
        {puanVar && (
          <View style={styles.puanSatir}>
            <Ionicons name="star" size={13} color="#f5a623" />
            <Text style={styles.puanYazi}>{Number(urun.averageRating).toFixed(1)}</Text>
            <Text style={styles.puanAdet}>({urun.reviewCount})</Text>
          </View>
        )}

        <Text style={styles.fiyat}>{paraBicimle(urun.price)}</Text>

        {/* ⭐ DEĞİŞTİ — elle kurulan "nokta + yazı" yerine ortak Rozet.

            Eski hali her kartta bir View + bir Text + iki koşullu
            renk hesabı kuruyordu. Aynı desen sipariş durumlarında da
            tekrarlanıyor; ortak bileşene çıkarınca ikisi de tek
            yerden değişiyor.

            ⚠️ Renk artık koşullu HESAPLANMIYOR, TİP seçiliyor.
            "tukendi ? renkler.yaziGri : renkler.basari" yazmak,
            rengin ne anlama geldiğini çağrı yerinde saklıyordu.
            Tip adı ("notr" / "basari") niyeti okunur kılıyor. */}
        <Rozet
          tip={tukendi ? 'notr' : 'basari'}
          yazi={tukendi ? 'Tükendi' : 'Stokta var'}
        />
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
  resimYok: {
    width: '100%',
    height: '100%',
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resimHarf: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 56,
    fontWeight: 'bold',
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
    color: renkler.yaziKoyu,
    marginLeft: 3,
  },
  puanAdet: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginLeft: 3,
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
    color: renkler.yaziKoyu,
    marginBottom: bosluk.kucuk,
  },
});