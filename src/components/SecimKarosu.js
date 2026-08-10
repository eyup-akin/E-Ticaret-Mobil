import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

// ============================================================
//  SEÇİM KAROSU — ikon üstte, etiket altta, kutulu seçim
//
//  ikon    : Ionicons adı ('shirt-outline' gibi) — isteğe bağlı
//  etiket  : altta yazan metin
//  secili  : seçili mi
//  onBas   : basılınca çağrılır
//  cocuk   : ikon yerine özel içerik (yıldız şeridi gibi)
//
//  ⚠️ NEDEN Chip VARKEN BİR DE BU?
//
//  İkisi de "tıklanabilir seçim" ama farklı işler yapıyorlar:
//
//    Chip  → tek satır, yalnızca metin. Yatay şeritte çok sayıda
//            seçenek sığdırmak için. Sıralama şeridi böyle.
//    Karo  → iki satır, üstte görsel bir ipucu. Seçenek sayısı az
//            ve seçenekler GÖZLE TARANIYORSA. Kategori filtresinde
//            müşteri "Elektronik" yazısını okumadan önce ikonu
//            görüyor.
//
//  Tek bileşende toplayıp "ikon varsa iki satır" deseydik, çağrı
//  yerine bakan biri hangi görünümün çıkacağını kestiremezdi.
//
//  ⚠️ SEÇİLİ DURUM İKİ SİNYAL TAŞIYOR: renk (turuncu dolgu +
//  kenarlık) ve BİÇİM (köşedeki onay rozeti). Yalnızca renk
//  kullansaydık güneş altında, küçük ekranda ve renk körü bir
//  kullanıcı için seçim belirsiz kalırdı.
// ============================================================
export default function SecimKarosu({ ikon, etiket, secili = false, onBas, cocuk }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  return (
    <TouchableOpacity
      style={[styles.karo, secili && styles.karoSecili]}
      onPress={onBas}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: secili }}
    >
      {/* ⚠️ Üst bölge SABİT YÜKSEKLİKTE. İkonlu ve içerikli (yıldız
          şeritli) karolar yan yana kullanılıyor; sabit yükseklik
          olmasaydı bir satırdaki karolar farklı boylarda çıkar ve
          etiketleri hizasız olurdu. */}
      <View style={styles.ustBolge}>
        {cocuk ?? (
          <Ionicons
            name={ikon}
            size={24}
            color={secili ? renkler.anaRenk : renkler.yaziOrta}
          />
        )}
      </View>

      <Text
        style={[styles.etiket, secili && styles.etiketSecili]}
        numberOfLines={2}
      >
        {etiket}
      </Text>

      {secili && (
        <View style={styles.onayRozeti}>
          <Ionicons name="checkmark" size={11} color={renkler.anaRenkUstuYazi} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  karo: {
    width: 84,
    paddingVertical: bosluk.orta,
    paddingHorizontal: bosluk.kucuk,
    borderRadius: kose.orta,
    backgroundColor: renkler.kartArka,
    alignItems: 'center',
    position: 'relative',

    /* ⭐ YENİ — İÇERİK DİKEY ORTADA.
       ⚠️ Cihazda görülen bir hatanın düzeltmesi.

       Karolar yatay bir şeritte yan yana duruyor ve ScrollView
       çocuklarını varsayılan olarak GERİYOR (alignItems: stretch):
       yani hepsi, en uzun karo kadar uzuyor. "Spor & Outdoor"
       etiketi iki satır olduğu için o karo diğerlerinden yüksek
       ve hepsini birden uzatıyordu.

       justifyContent olmadan içerik uzayan kutunun ÜSTÜNDE kalıyor
       ve tek satırlık karolarda (Elektronik, Giyim…) ikon ile
       etiket yukarı yapışık, altta boşluk kalmış görünüyordu.

       'center' bunu etiket kaç satır olursa olsun çözüyor — sabit
       bir yükseklik vermeye gerek yok. */
    justifyContent: 'center',

    /* ⚠️ Kenarlık iki durumda da var, sadece rengi ve kalınlığı
       değişiyor... DEĞİŞMİYOR: kalınlık da sabit 1.5.

       Seçilide 1.5, seçilmemişte 1 yapsaydık karo seçilince yarım
       piksel büyür ve yanındaki karolar kayardı. Kalınlık sabit,
       yalnızca renk konuşuyor. */
    borderWidth: 1.5,
    borderColor: renkler.inputKenar,
  },

  karoSecili: {
    backgroundColor: renkler.yumusakVurgu,
    borderColor: renkler.anaRenk,
  },

  ustBolge: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: bosluk.kucuk,
  },

  etiket: {
    fontSize: yazi.kucuk,
    fontWeight: agirlik.orta,
    fontFamily: font.orta,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
    textAlign: 'center',
  },

  etiketSecili: {
    color: renkler.anaRenk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },

  onayRozeti: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: kose.tam,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',

    // Panel zemininden ayırmak için halka — rozet karonun
    // kenarlığına biniyor.
    borderWidth: 2,
    borderColor: renkler.kartArka,
  },
});
