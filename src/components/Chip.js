import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

// ============================================================
//  CHIP — tıklanabilir seçim etiketi
//
//  etiket  : gösterilecek metin
//  secili  : seçili mi
//  onBas   : basılınca çağrılır
//
//  ⚠️ NEDEN Rozet'E BİR "onPress" EKLEMEDİK?
//
//  Rozet bir DURUM göstergesidir ("kargoda", "%20 indirim") —
//  kullanıcı ona basamaz. Chip bir SEÇİMDİR. Tek bileşende
//  toplasaydık, yarın rozetin dolgusunu değiştirdiğimizde
//  filtre seçimleri de değişir; ya da chip'e dokunma alanı
//  eklediğimizde rozetler sebepsiz yere büyürdü.
//
//  Görsel olarak birbirlerine benziyor olmaları tesadüf değil —
//  aynı tasarım dili. Ama benzemek, aynı olmak değil.
//
//  ⚠️ DOKUNMA ALANI: dikey padding rozetten (3) belirgin şekilde
//  büyük. Parmak hedefinin en az ~44px olması gerekiyor; rozet
//  ölçüsünde bir chip'e isabet ettirmek zor olurdu.
//
//  ⚠️ SEÇİLİ CHIP'TE ONAY ROZETİ YOK — denendi, kaldırıldı.
//
//  SecimKarosu'ndaki gibi köşeye küçük bir tik rozeti eklendi ve
//  ekranda görüldü: Chip'in tek gerçek kullanım yeri sıralama
//  şeridi ve orada BEŞ seçenekten biri zaten dolu turuncu duruyor.
//  "Hangisi seçili" sorusu sorulmuyor bile; rozet yalnızca gürültü
//  ekliyordu.
//
//  Ayrım şu: rozet, seçimin BELİRSİZ olduğu yerde işe yarar (çoklu
//  seçim, seçilmemiş de olabilir). Tek seçimli bir şeritte seçim
//  zaten kendini gösteriyor. Rozet SecimKarosu'nda kaldı.
// ============================================================
// ⭐ YENİ (GV/Faz 7.3) — `pasif` prop'u eklendi.
//
// İkinci tüketici çıktı: Siparişlerim ekranındaki durum şeridi,
// sayısı 0 olan durumu GÖRÜNÜR ama BASILAMAZ göstermek istiyor
// ("İptal (0)" bir bilgidir; basılabilir olsaydı boş listeye
// götüren bir çıkmaz olurdu).
//
// ⚠️ Prop bileşene, o ekrana özel bir kopya çıkarılarak değil
// buraya eklendi: "ikinci tüketici çıktığı an ortak yere taşınır"
// kuralının tersi de geçerli — ikinci tüketicinin ihtiyacı ortak
// bileşende karşılanır, yoksa şerit kendi Chip'ini yazar ve iki
// chip zamanla ayrışır.
export default function Chip({ etiket, secili = false, pasif = false, onBas }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  return (
    <TouchableOpacity
      style={[styles.chip, secili && styles.chipSecili, pasif && styles.chipPasif]}
      onPress={onBas}
      disabled={pasif}
      activeOpacity={0.7}
      // Ekran okuyucu "seçili mi" bilgisini görsel dolgudan
      // çıkaramaz; açıkça söylemek gerekiyor.
      accessibilityRole="button"
      accessibilityState={{ selected: secili, disabled: pasif }}
    >
      <Text style={[styles.yaziStil, secili && styles.yaziSecili]} numberOfLines={1}>
        {etiket}
      </Text>

    </TouchableOpacity>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  chip: {
    paddingHorizontal: bosluk.orta,
    paddingVertical: bosluk.kucuk,
    borderRadius: kose.tam,
    backgroundColor: renkler.acikGri,

    // ⚠️ Kenarlık seçili/seçisiz İKİ durumda da var, sadece rengi
    // değişiyor. Sadece seçilide verseydik chip seçilince 1px
    // büyür ve yanındaki chip'ler kayardı.
    borderWidth: 1,
    borderColor: renkler.acikGri,
  },

  chipSecili: {
    backgroundColor: renkler.yumusakVurgu,
    borderColor: renkler.anaRenk,
  },

  /* ⚠️ Görünür ama soluk. Tamamen gizleseydik "bu durumda hiç
     siparişim yok" bilgisi de kaybolurdu; soluk hâl hem sayıyı
     gösteriyor hem de tıklanacak bir şey olmadığını söylüyor. */
  chipPasif: {
    opacity: 0.4,
  },

  yaziStil: {
    fontSize: yazi.normal,
    fontWeight: agirlik.orta,
    fontFamily: font.orta,
    color: renkler.yaziOrta,

    // ⚠️ lineHeight AÇIKÇA veriliyor: verilmezse React Native
    // platforma göre farklı satır yüksekliği seçiyor ve aynı chip
    // iOS'ta bir, Android'de başka yükseklikte çıkıyor.
    // (Rozet'teki ile aynı tuzak.)
    lineHeight: satir.normal,
  },

  yaziSecili: {
    color: renkler.anaRenk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },
});
