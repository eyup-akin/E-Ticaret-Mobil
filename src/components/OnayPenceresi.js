import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

// ============================================================
//  ONAY PENCERESİ — tema uyumlu evet/hayır sorusu
//
//  acik        : görünür mü
//  baslik      : üstteki soru
//  mesaj       : açıklama (isteğe bağlı)
//  onayYazisi  : onay butonunun metni
//  yikici      : onay eylemi geri alınamaz mı (kırmızı buton)
//  ikon        : Ionicons adı (isteğe bağlı)
//  onOnayla()  : onay butonuna basıldı
//  onVazgec()  : vazgeçildi / dışarı basıldı / geri tuşu
//
//  ⚠️ NEDEN Alert.alert KULLANMIYORUZ?
//
//  Alert.alert işletim sisteminin penceresini açıyor. Sonuç:
//    • Uygulamanın temasını hiç bilmiyor — koyu temada bile beyaz,
//      turuncu markamız yerine sistemin mavisi
//    • Android'de büyük harfli "VAZGEÇ / ÇIKAR", iOS'ta bambaşka
//      bir yerleşim; aynı ekran iki platformda iki türlü
//    • Yıkıcı eylemi (silme) vurgulayacak bir yolu yok, iki buton
//      da aynı görünüyor
//
//  Cihazda görüldü ve "çok eski duruyor" denildi — haklı olarak:
//  uygulamanın geri kalanı yeni tasarım dilindeyken bu pencere
//  hâlâ 2015'ten kalma görünüyordu.
//
//  ⚠️ YIKICI EYLEM AYRI RENKTE.
//  "Çıkar", "Sil", "İptal et" gibi geri alınamaz eylemlerde onay
//  butonu kırmızı. Turuncu bırakılsaydı sepete ekleme ile sepetten
//  çıkarma aynı renkte olurdu — biri kazanç, diğeri kayıp.
//
//  ⚠️ VAZGEÇ SOLDA, ONAY SAĞDA ve vazgeç DÜZ bir buton.
//  Yanlışlıkla basılma ihtimali yüksek olan taraf, dikkat çeken
//  taraf olmamalı.
// ============================================================
export default function OnayPenceresi({
  acik,
  baslik,
  mesaj,
  onayYazisi = 'Onayla',
  vazgecYazisi = 'Vazgeç',
  yikici = false,
  tekButon = false,
  ikon,
  onOnayla,
  onVazgec,
}) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  return (
    <Modal visible={acik} transparent animationType="fade" onRequestClose={onVazgec}>
      {/* Karartma — dışarı basınca kapanıyor.
          ⚠️ Bu rgba elle yazılı ve bilerek: perde iki temada da
          siyah olmalı. (Filtre panelindeki gerekçenin aynısı.) */}
      <Pressable style={styles.karartma} onPress={onVazgec}>
        {/* ⚠️ İçteki Pressable dokunmayı YUTUYOR: pencerenin
            üstüne basmak pencereyi kapatmamalı. onPress'i boş
            bırakmak yeterli — olay yukarı çıkmıyor. */}
        <Pressable style={styles.pencere} onPress={() => {}}>
          {ikon && (
            <View style={[styles.ikonKutu, yikici && styles.ikonKutuYikici]}>
              <Ionicons
                name={ikon}
                size={24}
                color={yikici ? renkler.hata : renkler.anaRenk}
              />
            </View>
          )}

          <Text style={styles.baslik}>{baslik}</Text>

          {mesaj ? <Text style={styles.mesaj}>{mesaj}</Text> : null}

          <View style={styles.butonlar}>
            {/* ⭐ YENİ (GV/Faz 7.11) — `tekButon` ile vazgeç gizleniyor.

                ⚠️ Bazı pencereler bir SORU sormuyor, bir SONUÇ
                bildiriyor ("Şifren değişti"). Orada "Vazgeç" yazan
                bir buton anlamsız: geri alınacak bir şey yok, işlem
                zaten oldu. İki butonu zorla göstermek kullanıcıya
                olmayan bir seçim sunmak olurdu.

                Ayrı bir "BilgiPenceresi" bileşeni yazılmadı: pencere
                kabuğu, karartma, gölge ve ikon dili birebir aynı;
                ikinci bir kopya, birinde yapılan düzeltmenin
                diğerinde unutulması demekti. */}
            {!tekButon && (
              <TouchableOpacity style={styles.vazgecButon} onPress={onVazgec} activeOpacity={0.7}>
                <Text style={styles.vazgecYazi}>{vazgecYazisi}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.onayButon, yikici && styles.onayButonYikici]}
              onPress={onOnayla}
              activeOpacity={0.85}
            >
              <Text style={styles.onayYazi}>{onayYazisi}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  karartma: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: bosluk.genis,
  },

  pencere: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: renkler.kartArka,
    borderRadius: kose.dev,
    padding: bosluk.genis,
    alignItems: 'center',
    ...renkler.golgeLg,
  },

  ikonKutu: {
    width: 52,
    height: 52,
    borderRadius: kose.tam,
    backgroundColor: renkler.yumusakVurgu,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: bosluk.orta,
  },

  ikonKutuYikici: {
    backgroundColor: renkler.yumusakHata,
  },

  baslik: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    lineHeight: satir.buyuk,
    color: renkler.yaziKoyu,
    textAlign: 'center',
  },

  mesaj: {
    fontSize: yazi.normal,
    fontFamily: font.normal,
    lineHeight: satir.normal,
    color: renkler.yaziOrta,
    textAlign: 'center',
    marginTop: bosluk.kucuk,
  },

  butonlar: {
    flexDirection: 'row',
    gap: bosluk.orta,
    marginTop: bosluk.genis,

    // ⚠️ Butonlar tam genişlik: dar bir pencerede iki küçük buton
    // parmakla ayırt edilmesi zor hedefler olurdu.
    alignSelf: 'stretch',
  },

  vazgecButon: {
    flex: 1,
    minHeight: 48,
    borderRadius: kose.orta,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: renkler.inputKenar,
  },

  vazgecYazi: {
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.orta,
    color: renkler.yaziOrta,
  },

  onayButon: {
    flex: 1,
    minHeight: 48,
    borderRadius: kose.orta,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: renkler.anaRenk,
  },

  onayButonYikici: {
    backgroundColor: renkler.hata,
  },

  onayYazi: {
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    lineHeight: satir.orta,
    color: renkler.anaRenkUstuYazi,
  },
});
