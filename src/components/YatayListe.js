import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { bosluk, sayfaKenari } from '../theme/olculer';
import BolumBasligi from './BolumBasligi';
import UrunKartiKompakt from './UrunKartiKompakt';

// ============================================================
//  ⭐ YENİ (7.5) — YATAY BÖLÜM ŞERİDİ
//
//  baslik      : bölüm başlığı
//  urunler     : gösterilecek ürünler
//  onUrunBas   : bir karta basıldı
//  onTumunuBas : verilirse başlıkta "Tümünü gör" çıkar
//
//  ⚠️ NEDEN BİLEŞENE ÇIKARILDI?
//  Bu kalıp (başlık + yatay kaydırma + kompakt kart) "son gezdiğin
//  ürünler" bölümünde ana sayfanın içine SATIR İÇİ yazılmıştı. Aşama
//  7'de üç bölüm daha gelince dört kopya olacaktı; ikinci tüketici
//  çıktığı an ortak yere taşınır.
//
//  ⚠️ VERİ ÇEKMİYOR. Ürünleri prop olarak alıyor çünkü hepsi tek bir
//  ana sayfa isteğinden geliyor (7.4). Kendi isteğini atsaydı beş
//  bölüm beş istek demek olurdu.
//
//  ⚠️ BOŞ LİSTEDE HİÇ ÇİZMİYOR. Asıl eleme sunucuda (boş bölüm
//  cevaba girmiyor) ama burada da bir kapı var: başlığı olan, içi
//  boş bir şerit ekranı uzatmaktan başka bir şey yapmaz.
//
//  ⚠️ FlatList DEĞİL ScrollView. Bölüm başına en fazla 10 ürün var;
//  sanallaştırmanın kazancı yok, üstelik dikey FlatList'in içinde
//  yatay FlatList React Native'de uyarı üretiyor.
// ============================================================
export default function YatayListe({ baslik, urunler, onUrunBas, onTumunuBas }) {
  if (!urunler || urunler.length === 0) {
    return null;
  }

  return (
    <View style={styles.bolum}>
      <BolumBasligi baslik={baslik} onTumunuBas={onTumunuBas} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.serit}
        style={styles.seritKap}
        /* Dikey kaydırma listeye kalsın: bu olmadan parmak hafif
           eğik kaydığında şerit sayfayı da sürüklüyor. */
        directionalLockEnabled
      >
        {urunler.map((u) => (
          <UrunKartiKompakt key={u.id} urun={u} onPress={() => onUrunBas(u)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bolum: {
    marginTop: bosluk.normal,
  },

  /* ⚠️ flexGrow/flexShrink 0 — yatay ScrollView dikey kapsayıcının
     içinde kendini esnetmeye çalışıyor ve bölümler arası boşluk
     bozuluyordu. */
  seritKap: {
    flexGrow: 0,
    flexShrink: 0,
  },

  /* sayfaKenari: banner, arama ve kategori şeridiyle aynı dikey
     çizgi. Farklı bir değer kartları yarım piksel kaydırır ve
     ekranın sol kenarı testere gibi görünür. */
  serit: {
    paddingHorizontal: sayfaKenari,
    gap: bosluk.orta,
  },
});
