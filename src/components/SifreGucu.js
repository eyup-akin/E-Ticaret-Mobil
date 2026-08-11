import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

/* ⭐ YENİ (GV/Faz 7.11) — ŞİFRE GÜCÜ GÖSTERGESİ + KURAL LİSTESİ
 *
 * ⚠️ EN ÖNEMLİ KARAR: BURADAKİ KURALLARIN HANGİSİ ZORUNLU?
 *
 * Sunucu bugün yalnızca TEK bir kural uyguluyor: en az 6 karakter
 * (`[MinLength(6)]`). Büyük harf, rakam, sembol gibi kurallar
 * backend'de YOK.
 *
 * Ekranda "büyük harf içermeli" diye bir KURAL gösterip sunucuda
 * kontrol etmemek, olmayan bir güvenliği vaat etmek olurdu — üstelik
 * kullanıcı kuralı sağlamadan kaydedebildiğini fark ettiğinde geri
 * kalan kurallara da güvenmezdi. Yol haritasındaki açık teknik borç
 * tam olarak bu.
 *
 * Çözüm: ikisini AYIRMAK.
 *   · ZORUNLU kural (sunucuda var)  → ✓ / ✗ ile listelenir
 *   · ÖNERİ (sunucuda yok)          → yalnızca güç çubuğunu besler
 *
 * Yani ekran hiçbir zaman uygulanmayan bir kuralı "gerekli" diye
 * göstermiyor; öneriler açıkça öneri olarak duruyor.
 *
 * ⚠️ Güç çubuğu şifreyi ENGELLEMİYOR. Zayıf bir şifre yine
 * kaydedilebilir (sunucu kabul ediyor). Çubuk bir uyarı, bir kilit
 * değil — kilit olsaydı sunucuyla çelişirdi.
 *
 * İlk tüketici: Şifre Değiştir ekranı. Kayıt ekranı (Faz 8.2) aynı
 * bileşeni kullanacak; kuralın iki yerde ayrı yazılması, birinin
 * güncellenip diğerinin unutulması demekti.
 */

// Sunucudaki kuralla AYNI sayı. İki katmanda farklı olsaydı arayüzde
// kabul edilen şifre sunucuda reddedilirdi.
export const MIN_SIFRE = 6;

/* Güç puanı: 0–4.
 *
 * ⚠️ Uzunluk iki kez sayılıyor (8 ve 12 karakterde) çünkü pratikte
 * şifreyi kırılmaya karşı en çok koruyan şey uzunluk; karakter
 * çeşitliliği ikincil. Puanı yalnızca çeşitliliğe bağlasaydık
 * "Ab1!" gibi kısa ama "renkli" bir şifre güçlü görünürdü. */
export function sifreGucu(sifre) {
  if (!sifre) return 0;

  let puan = 0;

  if (sifre.length >= MIN_SIFRE) puan++;
  if (sifre.length >= 10) puan++;
  if (/[a-zçğıöşü]/.test(sifre) && /[A-ZÇĞİÖŞÜ]/.test(sifre)) puan++;
  if (/\d/.test(sifre) && /[^\wçğıöşüÇĞİÖŞÜ]/.test(sifre)) puan++;

  return puan;
}

export default function SifreGucu({ sifre }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const puan = sifreGucu(sifre);

  // ⚠️ Boş kutuda hiçbir şey çizilmiyor. Kullanıcı daha yazmaya
  // başlamadan "Çok zayıf" yazan kırmızı bir çubuk göstermek, hata
  // yapmadan azarlamak olurdu.
  if (!sifre) return null;

  const seviyeler = [
    { etiket: 'Çok zayıf', renk: renkler.hata },
    { etiket: 'Zayıf', renk: renkler.hata },
    { etiket: 'Orta', renk: renkler.uyari },
    { etiket: 'İyi', renk: renkler.basari },
    { etiket: 'Güçlü', renk: renkler.basari },
  ];

  const seviye = seviyeler[puan];

  return (
    <View style={styles.kap}>
      {/* Dört bölmeli çubuk: doluluk oranı yerine BÖLME sayısı,
          çünkü puan zaten 0–4 arası bir tam sayı. Sürekli bir çubuk
          olsaydı ara değerler gerçek bir hassasiyet varmış gibi
          görünürdü. */}
      <View style={styles.cubukSatir}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.bolme,
              i < puan && { backgroundColor: seviye.renk },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.seviyeYazi, { color: seviye.renk }]}>
        Şifre gücü: {seviye.etiket}
      </Text>

      {/* ---- ZORUNLU KURAL ---- */}
      <View style={styles.kuralSatir}>
        <Ionicons
          name={sifre.length >= MIN_SIFRE ? 'checkmark-circle' : 'ellipse-outline'}
          size={16}
          color={sifre.length >= MIN_SIFRE ? renkler.basari : renkler.yaziGri}
        />
        <Text style={styles.kuralYazi}>En az {MIN_SIFRE} karakter (zorunlu)</Text>
      </View>

      {/* ---- ÖNERİLER ----
          ⚠️ "Öneri" başlığı şart: bu satırlar sunucuda kontrol
          edilmiyor ve kullanıcı bunları sağlamadan da şifresini
          değiştirebiliyor. Zorunluymuş gibi göstermek yalan olurdu. */}
      <Text style={styles.oneriBaslik}>Daha güçlü yapmak için</Text>

      <View style={styles.kuralSatir}>
        <Ionicons
          name={sifre.length >= 10 ? 'checkmark-circle' : 'ellipse-outline'}
          size={16}
          color={sifre.length >= 10 ? renkler.basari : renkler.yaziGri}
        />
        <Text style={styles.kuralYazi}>10 karakter veya daha uzun</Text>
      </View>

      <View style={styles.kuralSatir}>
        <Ionicons
          name={
            /[a-zçğıöşü]/.test(sifre) && /[A-ZÇĞİÖŞÜ]/.test(sifre)
              ? 'checkmark-circle'
              : 'ellipse-outline'
          }
          size={16}
          color={
            /[a-zçğıöşü]/.test(sifre) && /[A-ZÇĞİÖŞÜ]/.test(sifre)
              ? renkler.basari
              : renkler.yaziGri
          }
        />
        <Text style={styles.kuralYazi}>Büyük ve küçük harf birlikte</Text>
      </View>

      <View style={styles.kuralSatir}>
        <Ionicons
          name={
            /\d/.test(sifre) && /[^\wçğıöşüÇĞİÖŞÜ]/.test(sifre)
              ? 'checkmark-circle'
              : 'ellipse-outline'
          }
          size={16}
          color={
            /\d/.test(sifre) && /[^\wçğıöşüÇĞİÖŞÜ]/.test(sifre)
              ? renkler.basari
              : renkler.yaziGri
          }
        />
        <Text style={styles.kuralYazi}>Rakam ve sembol</Text>
      </View>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kap: {
    backgroundColor: renkler.acikKart,
    borderRadius: kose.orta,
    padding: bosluk.orta,
    gap: bosluk.mikro,
  },

  cubukSatir: {
    flexDirection: 'row',
    gap: bosluk.mikro,
    marginBottom: bosluk.kucuk,
  },

  /* Boş bölme: görünür ama nötr. Tamamen saydam olsaydı kaç
     bölmenin doldurulabileceği anlaşılmazdı — yani "daha iyisi
     mümkün" bilgisi kaybolurdu. */
  bolme: {
    flex: 1,
    height: 4,
    borderRadius: kose.tam,
    backgroundColor: renkler.kenarlik,
  },

  seviyeYazi: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    marginBottom: bosluk.mikro,
  },

  kuralSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
  },

  kuralYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
  },

  oneriBaslik: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziGri,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: bosluk.kucuk,
  },
});
