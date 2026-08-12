import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import UrunKartiKompakt from './UrunKartiKompakt';

/* ⭐ YENİ (B12, 2026-08-12) — "SANA ÖZEL" ŞERİDİ
 *
 *   urunler   : gösterilecek ürünler (öneri mantığı ÇAĞIRANDA)
 *   onUrunBas : bir karta basıldı
 *
 * ⚠️ ÖNERİ MANTIĞI BURADA DEĞİL. Bu bileşen yalnızca çiziyor;
 * "kime ne önerilir" sorusu ana sayfada cevaplanıyor çünkü cevabı
 * oradaki veriden (son gezilenler + yüklü ürün listesi) çıkıyor.
 * Mantığı buraya koysaydık bileşen kendi verisini çekmek zorunda
 * kalır ve "bölüm başına ayrı istek atma" kuralını (7.4) çiğnerdi.
 *
 * ⚠️ ÖNERİ YOKSA ÇAĞIRAN ÇİZMİYOR — burada boş dizi kontrolü var
 * ama asıl karar orada. Boş bir "Sana özel" başlığı, olmayan bir
 * kişiselleştirmeyi vaat etmek olurdu (B12 uzun süre tam da bu
 * yüzden çizilmemişti).
 *
 * ⚠️⚠️ TURUNCU ZEMİN — DEKORATİF ANA RENK KURALININ TEK İSTİSNASI.
 *
 * Faz 1'de dört yerde "ana renk bir zemin değildir, bir eylem
 * işaretidir" diye düzeltme yapılmıştı. Burada bilerek zemin
 * yapılıyor ve gerekçesi şu: bu bölüm vitrinin geri kalanından
 * AYRI bir şey olduğunu söylemek zorunda. Ama tonu %8–14 arası —
 * yani buton turuncusuyla karışacak bir doygunlukta değil; şeridin
 * içindeki hiçbir öğe turuncu değil, dolayısıyla "neye
 * basabilirim" sorusu bulanmıyor.
 *
 * ⚠️ GRADYAN KULLANILMADI. `expo-linear-gradient` kurulu değil ve
 * tek bir şerit için bağımlılık eklemeye değmezdi. "Ambiyans"
 * bunun yerine üst üste binen iki yumuşak daireyle yapılıyor —
 * saf View, sıfır bağımlılık, iki temada da çalışıyor.
 */
export default function SanaOzelSerit({ urunler, onUrunBas }) {
  const { renkler, koyuMu } = useTema();
  const styles = stilOlustur(renkler, koyuMu);

  if (!urunler || urunler.length === 0) {
    return null;
  }

  return (
    <View style={styles.kap}>
      {/* Ambiyans daireleri.
          ⚠️ pointerEvents 'none': dekorasyon dokunmayı yutmamalı,
          altındaki kartlar basılabilir kalmalı. */}
      <View style={[styles.isik, styles.isikSag, { pointerEvents: 'none' }]} />
      <View style={[styles.isik, styles.isikSol, { pointerEvents: 'none' }]} />

      <View style={styles.baslikSatir}>
        <Ionicons name="sparkles" size={16} color={renkler.anaRenkKoyu} />
        <Text style={styles.baslik}>Sana özel</Text>
      </View>

      {/* ⚠️ Alt satır bir VAAT değil bir AÇIKLAMA: neye göre
          seçildiğini söylüyor. "Sana özel" tek başına sihirli bir
          öneri motoru ima ederdi; oysa mantık basit ve dürüst. */}
      <Text style={styles.altYazi}>Son baktıklarına benzeyen ürünler</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.serit}
        style={styles.seritKap}
        directionalLockEnabled
      >
        {urunler.map((u) => (
          <UrunKartiKompakt
            key={u.id}
            urun={u}
            onPress={() => onUrunBas(u)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const stilOlustur = (renkler, koyuMu) => StyleSheet.create({
  /* overflow: 'hidden' — ambiyans daireleri kutunun dışına taşmasın.
     Taşsaydı komşu bölümlerin üstüne turuncu lekeler düşerdi. */
  kap: {
    backgroundColor: renkler.yumusakVurgu,
    borderRadius: kose.dev,
    marginHorizontal: sayfaKenari,
    paddingVertical: bosluk.normal,
    overflow: 'hidden',
  },

  /* İki yumuşak ışık lekesi. Değerler elle yazılı rgba ve bilerek:
     ikisi de TURUNCUNUN aynı tonu, yalnızca saydamlıkları farklı.
     Tema token'ı yapmadık çünkü bu bir rol değil, tek bir şeridin
     dekoru. Koyu temada biraz daha güçlü — koyu zeminde düşük
     saydamlıktaki turuncu hiç görünmüyor. */
  isik: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: kose.tam,
    backgroundColor: koyuMu
      ? 'rgba(255, 107, 53, 0.16)'
      : 'rgba(255, 107, 53, 0.14)',
  },

  isikSag: {
    right: -80,
    top: -110,
  },

  isikSol: {
    left: -90,
    bottom: -130,
    backgroundColor: koyuMu
      ? 'rgba(255, 107, 53, 0.10)'
      : 'rgba(255, 107, 53, 0.08)',
  },

  baslikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    paddingHorizontal: bosluk.normal,
  },

  baslik: {
    fontSize: yazi.buyuk,
    lineHeight: satir.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  altYazi: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
    paddingHorizontal: bosluk.normal,
    marginTop: 2,
    marginBottom: bosluk.orta,
  },

  seritKap: {
    flexGrow: 0,
    flexShrink: 0,
  },

  serit: {
    paddingHorizontal: bosluk.normal,
    gap: bosluk.orta,
  },
});
