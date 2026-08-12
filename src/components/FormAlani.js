import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

/* ⭐ YENİ (GV/Faz 8) — ETİKETLİ FORM ALANI
 *
 *   etiket        : kutunun üstündeki yazı
 *   ikon          : kutunun solundaki Ionicons adı (isteğe bağlı)
 *   hata          : doluysa kutu kırmızıya döner ve altına yazılır
 *   sagIkon       : sağdaki basılabilir ikon (şifre göster/gizle)
 *   onSagIkonBas  : ona basılınca
 *   ...kalanı doğrudan TextInput'a geçiyor (value, onChangeText,
 *      placeholder, secureTextEntry, keyboardType...)
 *
 * ⚠️ NEDEN ORTAK BİLEŞEN?
 *
 * Aynı kutu dört ekranda var: Giriş, Kayıt, Şifremi Unuttum, Şifre
 * Değiştir. Dördü de kendi `StyleSheet`'inde kenarlık, yükseklik ve
 * köşe yazsaydı — ki üçü öyleydi — biri değiştirildiğinde diğerleri
 * eski görünümde kalırdı. Kural tek yerde: kutunun nasıl göründüğü
 * artık bu dosyanın sorunu.
 *
 * ⚠️ HATA KUTUNUN ALTINDA, PENCEREDE DEĞİL.
 *
 * Eskiden hatalar `Alert.alert` ile çıkıyordu: ekranı kaplıyor,
 * kapatmak için bir dokunuş istiyor ve kapandığında HANGİ ALANIN
 * yanlış olduğunu söylemiyordu. Yazının hatalı kutunun hemen altında
 * durması düzeltmeyi tek adıma indiriyor.
 *
 * ⚠️ Kenarlık rengi hatada değişiyor ama KALINLIK değişmiyor.
 * 1→2px kalınlaşma kutuyu büyütür ve hata çıktığında formun tamamı
 * bir piksel zıplar (adres kartlarında verilen kararın aynısı).
 */
export default function FormAlani({
  etiket,
  ikon,
  hata,
  sagIkon,
  onSagIkonBas,
  sagIkonEtiket,
  ...girdiOzellikleri
}) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const hataliMi = Boolean(hata);

  return (
    <View style={styles.alan}>
      {etiket ? <Text style={styles.etiket}>{etiket}</Text> : null}

      <View style={[styles.sarmal, hataliMi && styles.sarmalHatali]}>
        {ikon ? (
          <Ionicons
            name={ikon}
            size={18}
            color={hataliMi ? renkler.hata : renkler.yaziGri}
            style={styles.solIkon}
          />
        ) : null}

        <TextInput
          style={styles.girdi}
          placeholderTextColor={renkler.yaziGri}
          {...girdiOzellikleri}
        />

        {sagIkon ? (
          /* hitSlop: ikon 20dp ama parmak 44dp'lik bir alan istiyor.
             Kutuyu büyütmek yerine dokunma alanını büyütüyoruz. */
          <TouchableOpacity
            onPress={onSagIkonBas}
            hitSlop={12}
            style={styles.sagIkonKutu}
            accessibilityRole="button"
            accessibilityLabel={sagIkonEtiket}
          >
            <Ionicons name={sagIkon} size={20} color={renkler.yaziGri} />
          </TouchableOpacity>
        ) : null}
      </View>

      {hataliMi ? <Text style={styles.hataYazi}>{hata}</Text> : null}
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  alan: {
    marginBottom: bosluk.normal,
  },

  etiket: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.mikro,
  },

  sarmal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    paddingHorizontal: bosluk.normal,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    backgroundColor: renkler.kartArka,
  },

  sarmalHatali: {
    borderColor: renkler.hata,
  },

  solIkon: {
    // Metin kutusuyla aynı hizada dursun diye ayrı bir dolgu yok;
    // hizalama sarmalın alignItems'ından geliyor.
  },

  /* height sabit: çok satırlı olmayan bir kutunun yüksekliği
     platformun varsayılan dolgusuna bırakılırsa iOS ve Android'de
     farklı çıkıyor ve iki cihazda iki farklı form görünüyor. */
  girdi: {
    flex: 1,
    height: 48,
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
  },

  sagIkonKutu: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  hataYazi: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.hata,
    marginTop: bosluk.mikro,
  },
});
