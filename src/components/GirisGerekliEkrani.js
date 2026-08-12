import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

// ============================================================
//  MİSAFİR KAPISI  (GV/Faz 8.4)
//
//  Tasarım: `ifremi_unuttum_ve_giri_gerekli` (alttaki kart)
//
//  Giriş yapmamış kullanıcı korumalı bir sekmeye girdiğinde bu
//  ekranı görür: Sepet, Siparişlerim, Favorilerim.
//
//  Kullanımı:
//    <GirisGerekliEkrani
//      ikon="cart-outline"
//      baslik="Sepetini görmek için giriş yap"
//      aciklama="Sepetine ürün ekleyip sipariş verebilirsin."
//    />
//
//  ⚠️ `BosDurum` İLE BİRLEŞTİRİLMEDİ (Faz 2.6'daki karar).
//  O "burada içerik yok" diyor, bu "kapı kilitli" diyor. İkisi
//  farklı sorunlar ve farklı çözümler öneriyor; tek bileşende
//  toplasaydık yarın birinin metnini değiştirmek diğerini bozardı.
//
//  ⚠️ İKONUN ZEMİNİ TURUNCU DEĞİL. Dekoratif bir daireyi ana renge
//  boyamak Faz 1'de düzeltilen hatanın ta kendisi; turuncu bu
//  ekranda yalnızca "Giriş Yap" butonunda.
//
//  ⚠️ Buton çifti Hesabım'ın misafir görünümüyle AYNI: dolu
//  "Giriş Yap" + çerçeveli "Kayıt Ol" + dipnot. Tasarım burada
//  "Kayıt Ol"u düz yazı çiziyor ama iki ekran aynı seçimi sunuyor;
//  farklı çizmek "bunlar farklı şeyler mi?" sorusunu doğururdu.
// ============================================================
export default function GirisGerekliEkrani({ ikon, baslik, aciklama }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  // Bu bir EKRAN değil, BİLEŞEN.
  // O yüzden navigation prop olarak gelmez, hook ile çekiyoruz.
  const navigation = useNavigation();

  return (
    <View style={styles.kap}>
      <View style={styles.ikonDaire}>
        <Ionicons
          name={ikon || 'lock-closed-outline'}
          size={40}
          color={renkler.yaziOrta}
        />
      </View>

      <Text style={styles.baslik}>
        {baslik || 'Bu sayfa için giriş yapmalısın'}
      </Text>

      {aciklama ? <Text style={styles.aciklama}>{aciklama}</Text> : null}

      <TouchableOpacity
        style={styles.anaButon}
        onPress={() => navigation.navigate('Giris')}
        activeOpacity={0.85}
      >
        <Text style={styles.anaButonYazi}>Giriş Yap</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.ikincilButon}
        onPress={() => navigation.navigate('Kayit')}
        activeOpacity={0.85}
      >
        <Text style={styles.ikincilButonYazi}>Kayıt Ol</Text>
      </TouchableOpacity>

      <Text style={styles.dipnot}>
        Giriş yapmadan ürünleri gezmeye devam edebilirsin.
      </Text>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kap: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: bosluk.dev,
  },

  /* 96dp — BosDurum'daki daireyle aynı ölçü. İki boş ekran yan yana
     görülmüyor ama aynı uygulamada iki farklı "büyük daire" boyu
     olması, ölçeğin tesadüfi seçildiğini gösterirdi. */
  ikonDaire: {
    width: 96,
    height: 96,
    borderRadius: kose.tam,
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: bosluk.genis,
  },

  baslik: {
    fontSize: yazi.buyuk,
    lineHeight: satir.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    textAlign: 'center',
    marginBottom: bosluk.kucuk,
  },

  aciklama: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.yaziOrta,
    textAlign: 'center',
    marginBottom: bosluk.genis,
  },

  anaButon: {
    backgroundColor: renkler.anaRenk,
    height: 48,
    borderRadius: kose.orta,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: bosluk.orta,
  },

  anaButonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  ikincilButon: {
    height: 48,
    borderWidth: 1.5,
    borderColor: renkler.anaRenk,
    borderRadius: kose.orta,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: bosluk.genis,
  },

  ikincilButonYazi: {
    color: renkler.anaRenk,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  dipnot: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziGri,
    textAlign: 'center',
  },
});
