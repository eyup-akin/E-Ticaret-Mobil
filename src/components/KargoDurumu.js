import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { tarihBicimle } from '../utils/bicimlendir';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

/* Sipariş iptalse kırmızı iptal kutusu, değilse DİKEY ZAMAN ÇİZELGESİ.
 *
 * ⭐ DEĞİŞTİ (GV/Faz 7.4) — yatay ikon listesi yerine dikey çizelge.
 *
 * Eskiden her aşama bir satırdı ve aralarında görsel bir bağ yoktu;
 * üç bağımsız onay kutusu gibi duruyordu. Tasarımdaki dikey çizgi
 * aşamaların BİR AKIŞ olduğunu söylüyor: nokta = an, çizgi = geçen
 * süre.
 *
 * ⚠️ Çizgi noktaların ARASINDA, satırın tamamı boyunca değil. Son
 * noktadan sonra çizgi devam etseydi "daha gelecek bir adım var"
 * derdi; teslim edilmiş bir siparişte bu yanlış olurdu.
 */
export default function KargoDurumu({ siparis }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const iptalMi = siparis.status === 'iptal';

  /* ⭐ DEĞİŞTİ (GV/Faz 7.4 · B9 + B10) — DÖRT ADIM.
   *
   * ⚠️ B9 — "Sipariş Alındı" ayrı bir DURUM DEĞİL, türetilmiş bir
   * adım. Durum makinemizde üç durum + iptal var; buraya dördüncü
   * bir durum eklemek backend'i, admin panelini ve raporları
   * ilgilendirirdi. Oysa gereken tek şey `createdAt`: sipariş kaydı
   * varsa alınmıştır. Sıfır maliyetle çizilebilen bir adım için
   * durum makinesi değiştirilmez.
   *
   * ⚠️ Bu adım HER ZAMAN geçilmiş sayılıyor — sipariş ekranda
   * duruyorsa alınmış demektir.
   *
   * ⚠️ B10 — "Hazırlanıyor" adımının kendi zaman damgası YOK.
   * `ShippedAt` ve `DeliveredAt` var ama hazırlanmaya geçiş anı
   * tutulmuyor. `createdAt`'i buraya da yazmak cazip ama YANLIŞ
   * olurdu: iki farklı olayı aynı ana bağlamak, veriyi uydurmak
   * demek. Tarih null bırakılıyor ve ekranda "—" görünüyor —
   * "yanlış sayı, eksik sayıdan tehlikelidir".
   *
   * Her aşamanın kendi tarih kaynağı var:
   *   alindi        → createdAt   (sipariş oluşturulduğu an)
   *   hazirlaniyor  → yok         (B10)
   *   kargoda       → shippedAt   (admin kargoya verdiği an)
   *   teslim_edildi → deliveredAt (admin teslim işaretlediği an)
   */
  const asamalar = [
    { kod: 'alindi',        etiket: 'Sipariş Alındı', tarih: siparis.createdAt },
    { kod: 'hazirlaniyor',  etiket: 'Hazırlanıyor',   tarih: null },
    { kod: 'kargoda',       etiket: 'Kargoda',        tarih: siparis.shippedAt },
    { kod: 'teslim_edildi', etiket: 'Teslim Edildi',  tarih: siparis.deliveredAt },
  ];

  // ⚠️ "alindi" bir durum kodu olmadığı için listede bulunamaz ve
  // findIndex -1 döner. O yüzden kendi indeksini +1 ile kaydırıyoruz:
  // sunucudan gelen durum ne olursa olsun ilk adım geçilmiş sayılır.
  const suankiIndex = asamalar.findIndex((a) => a.kod === siparis.status);
  const gecilenSonIndex = suankiIndex === -1 ? 0 : suankiIndex;

  if (iptalMi) {
    return (
      <View style={styles.iptalKutu}>
        <View style={styles.iptalUst}>
          {/* ⚠️ Renk artık token. Bu dosyada üç yerde elle '#e74c3c'
              yazılıydı: koyu temada değişmiyordu ve tasarım sisteminin
              sabit renk yasağını çiğniyordu. */}
          <Ionicons name="close-circle" size={20} color={renkler.hata} />
          <Text style={styles.iptalBaslik}>Sipariş İptal Edildi</Text>
        </View>

        {siparis.cancelledAt ? (
          <Text style={styles.iptalTarih}>{tarihBicimle(siparis.cancelledAt)}</Text>
        ) : null}

        {siparis.cancelReason ? (
          <Text style={styles.iptalSebep}>Sebep: {siparis.cancelReason}</Text>
        ) : null}

        <Text style={styles.iptalIade}>Ödemeniz iade edildi.</Text>
      </View>
    );
  }

  return (
    <View style={styles.kutu}>
      {asamalar.map((asama, i) => {
        const gecti = i <= gecilenSonIndex;
        const suanki = i === gecilenSonIndex;
        const sonMu = i === asamalar.length - 1;

        return (
          <View key={asama.kod} style={styles.asama}>
            {/* SOL SÜTUN: nokta + bağlantı çizgisi */}
            <View style={styles.sol}>
              <View
                style={[
                  styles.nokta,
                  gecti && styles.noktaGecti,
                  /* ⚠️ Şu anki adım halkalı: geçmiş adımlarla aynı dolu
                     nokta olsaydı "şu an neredeyim" sorusu cevapsız
                     kalırdı. Renk tek başına bunu söylemiyor. */
                  suanki && styles.noktaSuanki,
                ]}
              >
                {gecti && !suanki && (
                  <Ionicons name="checkmark" size={12} color={renkler.anaRenkUstuYazi} />
                )}
              </View>

              {/* Çizgi son noktadan sonra çizilmiyor. Geçilmiş kısmı
                  dolu renkte: müşteri nereye kadar geldiğini çizginin
                  rengiyle de okuyor. */}
              {!sonMu && (
                <View style={[styles.cizgi, i < gecilenSonIndex && styles.cizgiGecti]} />
              )}
            </View>

            {/* SAĞ SÜTUN: etiket + zaman damgası */}
            <View style={[styles.orta, sonMu && styles.ortaSon]}>
              <Text style={[styles.asamaYazi, gecti && styles.asamaYaziAktif]}>
                {asama.etiket}
              </Text>

              {/* ⚠️ Tarih İKİ koşula bağlı:
                  gecti      → henüz ulaşılmamış aşamanın tarihi olamaz
                  asama.tarih → ulaşılmış ama tarih boş olabilir
                    (B10'daki "Hazırlanıyor" ve bu alanlar eklenmeden
                     önce kargoya verilmiş eski siparişler)

                  ⚠️ Geçilmiş ama tarihi olmayan adımda "—" yazılıyor,
                  satır boş bırakılmıyor: boşluk "burada bir şey
                  eksik/bozuk" gibi okunur, "—" ise "bu bilgi
                  tutulmuyor" der. */}
              {gecti ? (
                <Text style={styles.asamaTarih}>
                  {asama.tarih ? tarihBicimle(asama.tarih) : '—'}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kutu: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
  },

  asama: {
    flexDirection: 'row',
    gap: bosluk.orta,
  },

  sol: {
    alignItems: 'center',
  },

  nokta: {
    width: 20,
    height: 20,
    borderRadius: kose.tam,
    borderWidth: 2,
    borderColor: renkler.kenarlik,
    backgroundColor: renkler.arkaPlan,
    justifyContent: 'center',
    alignItems: 'center',
  },

  noktaGecti: {
    backgroundColor: renkler.anaRenk,
    borderColor: renkler.anaRenk,
  },

  /* Şu anki adım: içi boş ama kenarlığı kalın ve renkli halka. */
  noktaSuanki: {
    backgroundColor: renkler.arkaPlan,
    borderWidth: 5,
    borderColor: renkler.anaRenk,
  },

  /* ⚠️ flex: 1 — çizgi, sağdaki metnin yüksekliği kadar uzuyor.
     Sabit yükseklik verseydik iki satırlık bir adımda çizgi kısa
     kalır ve noktalar arasında kopukluk görünürdü. */
  cizgi: {
    flex: 1,
    width: 2,
    backgroundColor: renkler.kenarlik,
    marginVertical: bosluk.mikro,
  },

  cizgiGecti: {
    backgroundColor: renkler.anaRenk,
  },

  orta: {
    flex: 1,
    paddingBottom: bosluk.normal,
  },

  /* Son adımın altında boşluk yok; kartın kendi dolgusu yetiyor. */
  ortaSon: {
    paddingBottom: 0,
  },

  asamaYazi: {
    fontSize: yazi.orta,
    color: renkler.yaziGri,
  },

  asamaYaziAktif: {
    color: renkler.yaziKoyu,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },

  asamaTarih: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },


  /* ---------- İPTAL ---------- */

  iptalKutu: {
    backgroundColor: renkler.yumusakHata,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.hata,
    padding: bosluk.normal,
  },

  iptalUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    marginBottom: bosluk.kucuk,
  },

  iptalBaslik: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.hata,
  },

  iptalTarih: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginBottom: bosluk.kucuk,
  },

  iptalSebep: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.kucuk,
  },

  iptalIade: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
  },
});
