import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { bosluk, yazi, satir, sayfaKenari } from '../theme/olculer';
import {
  bosFiltre, varsayilanSiralama, filtreSorgusuKur, aktifFiltreSayisi,
} from '../services/urunFiltresi';
import { sonGezilenleriOku } from '../services/sonGezilenler';
import AramaCubugu from '../components/AramaCubugu';
import UrunKarti from '../components/UrunKarti';
import UrunKartiKompakt from '../components/UrunKartiKompakt';
import SiralamaSeridi from '../components/SiralamaSeridi';
import FiltrePaneli from '../components/FiltrePaneli';
import BannerSeridi from '../components/BannerSeridi';
import KategoriSeridi from '../components/KategoriSeridi';
import BolumBasligi from '../components/BolumBasligi';

// ============================================================
//  ANA SAYFA — vitrin
//
//  Sıra: arama → banner → kategoriler → son gezdiklerin →
//        tüm ürünler (sıralama şeridi + ızgara)
//
//  ⚠️ HAMBURGER MENÜSÜ KALDIRILDI.
//  Kategorilere erişim artık kategori şeridinin sonundaki "Tümü"
//  karosundan. Hamburger, içinde tek bir şey olan bir menüyü
//  açıyordu; şerit hem daha hızlı hem kategorileri GÖRÜNÜR
//  kılıyor.
//
//  ⚠️ ÜST BÖLÜMLER FlatList'İN "ListHeaderComponent"İNDE.
//
//  Izgara bir FlatList (numColumns=2) ve onu bir ScrollView'in
//  içine koysaydık React Native uyarı verirdi: iç içe aynı yönde
//  iki kaydırıcı, sanallaştırmayı bozar ve tüm kartlar bir anda
//  çizilir. Bölümleri başlık bileşenine koymak, tek bir
//  kaydırıcıyla çalışmak demek.
//
//  ⚠️ ARAMA ÇUBUĞU BAŞLIĞIN İÇİNDE DEĞİL, DIŞINDA.
//  İçinde olsaydı liste her yenilendiğinde başlık yeniden
//  render olur ve yazarken KLAVYE ODAĞI DÜŞERDİ. Ayrıca
//  yukarıda sabit kalması zaten doğru davranış.
// ============================================================
export default function AnaSayfaEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState('');
  const [uygulananArama, setUygulananArama] = useState('');

  const [filtre, setFiltre] = useState(bosFiltre);
  const [siralama, setSiralama] = useState(varsayilanSiralama);
  const [panelAcik, setPanelAcik] = useState(false);

  // ⭐ YENİ (GV/Faz 4)
  const [kategoriler, setKategoriler] = useState([]);
  const [sonGezilenler, setSonGezilenler] = useState([]);

  // ---- ÜRÜN IZGARASI ----
  async function urunleriGetir(arama, aktifFiltre, aktifSiralama) {
    try {
      setYukleniyor(true);

      const yol = '/products' + filtreSorgusuKur(aktifFiltre, {
        arama,
        siralama: aktifSiralama,
      });

      const veri = await apiGet(yol);
      setUrunler(veri);
    } catch (hata) {
      console.log('Ürünler alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // ⚠️ TEK EFEKT, ÜÇ TETİKLEYİCİ. Arama, filtre ve sıralama için
  // ayrı efektler yazsaydık ikisi aynı anda değiştiğinde iki
  // istek birden giderdi ve hangisinin cevabı sonra dönerse ekran
  // ona göre kalırdı.
  useEffect(() => {
    urunleriGetir(uygulananArama, filtre, siralama);
  }, [uygulananArama, filtre, siralama]);

  // ---- KATEGORİLER — bir kez ----
  useEffect(() => {
    let iptal = false;

    (async () => {
      try {
        const veri = await apiGet('/categories');
        if (!iptal) setKategoriler(veri);
      } catch (hata) {
        // ⚠️ Kategori şeridi çizilemezse ana sayfa yine çalışıyor:
        // bölüm hiç görünmüyor, ürün ızgarası yerinde duruyor.
        console.log('Kategoriler alınamadı:', hata.message);
      }
    })();

    return () => { iptal = true; };
  }, []);

  // ---- SON GEZİLENLER ----
  //
  // ⚠️ useFocusEffect — useEffect DEĞİL.
  //
  // Müşteri ürün detayına gidip geri döndüğünde şerit güncel
  // olmalı. useEffect yalnızca ekran ilk kurulduğunda çalışır;
  // sekmeler arası dönüşte ana sayfa bileşeni bellekte duruyor ve
  // efekt bir daha tetiklenmiyor. Sonuç: az önce baktığın ürün
  // şeritte görünmüyordu.
  //
  // ⚠️ İD SIRASI SUNUCUDAN GELMİYOR — burada geri kuruluyor.
  // Sunucuya "şu id'leri getir" diyoruz, o da veritabanı sırasında
  // döndürüyor. "En son bakılan başta" sırası cihazdaki listede;
  // gelen ürünleri o listeye göre diziyoruz. Sunucudan sıra
  // istemek (SQL'de CASE WHEN zinciri) hem çirkin hem gereksizdi.
  useFocusEffect(
    useCallback(() => {
      let iptal = false;

      (async () => {
        const idler = await sonGezilenleriOku();

        if (idler.length === 0) {
          if (!iptal) setSonGezilenler([]);
          return;
        }

        try {
          const veri = await apiGet('/products?idler=' + idler.join(','));
          if (iptal) return;

          // Cihazdaki sıraya diz. Silinmiş/pasifleşmiş ürünler
          // sunucudan hiç gelmiyor ve listeden kendiliğinden
          // düşüyor — ayrıca temizlemeye gerek yok.
          const sirali = idler
            .map((id) => veri.find((u) => u.id === id))
            .filter(Boolean);

          setSonGezilenler(sirali);
        } catch (hata) {
          if (!iptal) setSonGezilenler([]);
          console.log('Son gezilenler alınamadı:', hata.message);
        }
      })();

      return () => { iptal = true; };
    }, [])
  );

  // ---- KATEGORİYE BASILINCA ----
  //
  // ⚠️ Panelden farklı olarak ANINDA uygulanıyor. Panelde birden
  // çok ayar yapılıyor ve "göster"e basılıyor; burada tek dokunuş
  // var ve beklenti "tak diye o kategori gelsin".
  //
  // ⚠️ Seçiliye tekrar basmak seçimi KALDIRIYOR — aynı karoya
  // basıp filtreden çıkmak, panele girmeden geri dönmenin tek
  // yolu.
  const kategoriSec = useCallback((id) => {
    setFiltre((onceki) => ({
      ...onceki,
      kategoriler: onceki.kategoriler.includes(id)
        ? onceki.kategoriler.filter((x) => x !== id)
        : [...onceki.kategoriler, id],
    }));
  }, []);

  const kartCiz = useCallback(
    ({ item }) => (
      <UrunKarti
        urun={item}
        onPress={() => navigation.navigate('UrunDetay', { urunId: item.id })}
      />
    ),
    [navigation]
  );

  // ---- ÜST BÖLÜMLER ----
  const basliklar = (
    <View>
      <BannerSeridi
        onKampanyaBas={(k) =>
          navigation.navigate('KampanyaDetay', { kampanyaId: k.id })
        }
      />

      <View style={styles.bolum}>
        <BolumBasligi
          baslik="Kategoriler"
          onTumunuBas={() => navigation.navigate('Kategoriler')}
        />
        <KategoriSeridi
          kategoriler={kategoriler}
          seciliIdler={filtre.kategoriler}
          onSec={kategoriSec}
          onTumuBas={() => navigation.navigate('Kategoriler')}
        />
      </View>

      {/* ⚠️ Geçmiş yoksa bölüm TAMAMEN yok — boş yer tutucu ya da
          "henüz ürün gezmedin" yazısı değil. İlk kez açan
          müşteriye söylenecek bir şey yok; boş bir bölüm sadece
          ekranı uzatırdı. */}
      {sonGezilenler.length > 0 && (
        <View style={styles.bolum}>
          <BolumBasligi baslik="Son gezdiğin ürünler" />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kompaktSerit}
            style={styles.kompaktSeritKap}
            directionalLockEnabled
          >
            {sonGezilenler.map((u) => (
              <UrunKartiKompakt
                key={u.id}
                urun={u}
                onPress={() => navigation.navigate('UrunDetay', { urunId: u.id })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.bolum}>
        <BolumBasligi baslik="Tüm Ürünler" />
        <SiralamaSeridi secili={siralama} onSec={setSiralama} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <AramaCubugu
        value={aramaMetni}
        onChangeText={setAramaMetni}
        onSubmit={(metin) => setUygulananArama(metin)}
        onFiltreBas={() => setPanelAcik(true)}
        aktifFiltre={aktifFiltreSayisi(filtre)}
      />

      <FlatList
        data={yukleniyor ? [] : urunler}
        keyExtractor={(item) => item.id.toString()}
        renderItem={kartCiz}
        numColumns={2}
        columnWrapperStyle={styles.satir}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={basliklar}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          yukleniyor ? (
            <ActivityIndicator size="large" color={renkler.anaRenk} style={styles.cark} />
          ) : (
            <Text style={styles.bosYazi}>
              {aktifFiltreSayisi(filtre) > 0
                ? 'Seçtiğin filtrelere uyan ürün yok. Filtreleri gevşetmeyi dene.'
                : 'Ürün bulunamadı.'}
            </Text>
          )
        }
      />

      <FiltrePaneli
        acik={panelAcik}
        filtre={filtre}
        arama={uygulananArama}
        onKapat={() => setPanelAcik(false)}
        onUygula={(yeni) => { setFiltre(yeni); setPanelAcik(false); }}
      />
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },

  /* ⭐ DEĞİŞTİ — bölüm arası 24 → 16.
     ⚠️ Ayırıcı çizgi hâlâ YOK; çizgi çekseydik vitrin bir ayar
     ekranı gibi okunurdu. Ama 24dp cihazda fazla geldi: banner ile
     "Kategoriler", kategoriler ile "Tüm Ürünler" arasında ekranın
     boşa giden bir bölümü oluşuyordu.

     ⚠️ Görünen boşluk 16'dan FAZLA çünkü bölümlerin kendi dikey
     dolguları da var (kategori şeridinde onay rozetinin taşması
     için 8, başlıkta 12). Toplam ~32-36dp — nefes almaya yeter. */
  bolum: {
    marginTop: bosluk.normal,
  },

  kompaktSeritKap: {
    flexGrow: 0,
    flexShrink: 0,
  },

  kompaktSerit: {
    paddingHorizontal: sayfaKenari,
    gap: bosluk.orta,
  },

  cark: {
    marginTop: bosluk.dev,
  },

  // ⚠️ sayfaKenari — banner, arama ve kategori şeridiyle aynı
  // dikey çizgi. Önce bosluk.kucuk yazılıydı ve tesadüfen aynı
  // değerdeydi; token'a bağlamak, kenar boşluğu değişince hizanın
  // kendiliğinden korunmasını sağlıyor.
  liste: {
    paddingHorizontal: sayfaKenari,
    paddingBottom: bosluk.normal,
  },

  satir: {
    justifyContent: 'space-between',
  },

  bosYazi: {
    textAlign: 'center',
    marginTop: bosluk.dev,
    marginHorizontal: bosluk.genis,
    color: renkler.yaziGri,
    fontSize: yazi.orta,
    lineHeight: satir.orta,
  },
});
