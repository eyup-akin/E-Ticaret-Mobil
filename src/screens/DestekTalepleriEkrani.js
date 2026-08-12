import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { tarihBicimle } from '../utils/bicimlendir';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

import Rozet from '../components/Rozet';
import BosDurum from '../components/BosDurum';
import { SatirListesiIskeleti } from '../components/Iskelet';

// ============================================================
//  ⭐ YENİ (Aşama 8.4) — DESTEK TALEPLERİM
//
//  ⚠️ FİLTRE / SEKME YOK — bilinçli.
//  Admin ekranında durum sekmeleri var çünkü orada yüzlerce talep
//  arasından "bana bakan"ı bulmak gerekiyor. Müşterinin ömür boyu
//  açacağı talep sayısı bir elin parmakları kadar; ona sekme
//  vermek, üç kayıt için filtre paneli koymak olurdu.
//  ("İşi olmayan ekran yapılmaz" kuralının küçük hâli.)
// ============================================================
export default function DestekTalepleriEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [talepler, setTalepler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [agHatasi, setAgHatasi] = useState(false);

  // ⚠️ useFocusEffect — useEffect DEĞİL. Müşteri yeni talep açıp ya
  // da bir talebe mesaj yazıp geri döndüğünde liste güncel olmalı;
  // useEffect yalnızca ilk kuruluşta çalışırdı.
  useFocusEffect(
    useCallback(() => {
      let iptal = false;

      (async () => {
        try {
          setAgHatasi(false);
          const veri = await apiGet('/support');
          if (!iptal) setTalepler(veri);
        } catch (hata) {
          // ⚠️ "Boş liste" ile "bağlanamadık" AYRI durumlar ve ayrı
          // cevapları var: birinde talep açmak, diğerinde tekrar
          // denemek gerekiyor.
          if (!iptal) {
            setTalepler([]);
            setAgHatasi(true);
          }
          console.log('Destek talepleri alınamadı:', hata.message);
        } finally {
          if (!iptal) setYukleniyor(false);
        }
      })();

      return () => { iptal = true; };
    }, [])
  );

  /* Durum → rozet tipi.
   *
   * ⚠️ Renk BİLGİ TAŞIYOR ve buradaki bilgi "sıra kimde":
   *   acik       → mağaza cevap yazacak  (uyarı/turuncu)
   *   yanitlandi → cevap geldi, oku      (vurgu)
   *   kapali     → iş bitti              (nötr)
   *
   * ⚠️ Metinler ADMİN PANELİYLE AYNI DEĞİL ve olmak zorunda da
   * değil: admin "Cevap Bekliyor" görüyor (yapacağı iş var),
   * müşteri "Yanıt bekleniyor" görüyor (bekleyen o). Aynı veri, iki
   * farklı okuyucu.
   */
  function durumBilgisi(durum) {
    if (durum === 'acik') return { tip: 'uyari', yazi: 'Yanıt bekleniyor' };
    if (durum === 'yanitlandi') return { tip: 'vurgu', yazi: 'Yanıtlandı' };
    return { tip: 'notr', yazi: 'Kapalı' };
  }

  function talepKarti({ item }) {
    const d = durumBilgisi(item.durum);

    return (
      <TouchableOpacity
        style={styles.kart}
        onPress={() => navigation.navigate('TalepDetay', { talepId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.kartUst}>
          <Text style={styles.konu} numberOfLines={2}>{item.konu}</Text>
          <Ionicons name="chevron-forward" size={18} color={renkler.yaziGri} />
        </View>

        <View style={styles.kartAlt}>
          <Rozet tip={d.tip} yazi={d.yazi} />

          {/* ⚠️ Sipariş numarası YALNIZCA bağlıysa. Boş bir "—"
              koymak, olmayan bir bağlantıyı varmış gibi gösterirdi. */}
          {item.siparisNo ? (
            <Text style={styles.meta}>{item.siparisNo}</Text>
          ) : null}

          <Text style={styles.meta}>{tarihBicimle(item.updatedAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <Text style={styles.ustBaslik}>Destek</Text>

        {/* ⚠️ "Yeni talep" üst barda, listenin altında değil: liste
            uzarsa buton ekranın dışında kalırdı ve bu ekranın ana
            eylemi tam olarak o. */}
        <TouchableOpacity
          onPress={() => navigation.navigate('YeniTalep')}
          style={styles.yeniButon}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Yeni destek talebi"
        >
          <Ionicons name="add" size={22} color={renkler.anaRenkUstuYazi} />
        </TouchableOpacity>
      </View>

      {yukleniyor ? (
        <View style={styles.icerik}>
          <SatirListesiIskeleti />
        </View>
      ) : agHatasi ? (
        <BosDurum
          ikon="cloud-offline-outline"
          baslik="Bağlanamadık"
          aciklama="Taleplerini getiremedik. Bağlantını kontrol edip tekrar dene."
        />
      ) : talepler.length === 0 ? (
        <BosDurum
          ikon="chatbubbles-outline"
          baslik="Henüz talebin yok"
          aciklama="Siparişin, ürünlerin ya da ödemenle ilgili bir sorun varsa bize yazabilirsin."
          eylemYazisi="Talep Oluştur"
          onEylem={() => navigation.navigate('YeniTalep')}
        />
      ) : (
        <FlatList
          data={talepler}
          keyExtractor={(t) => t.id.toString()}
          renderItem={talepKarti}
          contentContainerStyle={styles.icerik}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },

  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    paddingHorizontal: sayfaKenari,
    paddingVertical: bosluk.orta,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  geriButon: {
    width: 32,
  },

  ustBaslik: {
    flex: 1,
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  /* Dolu turuncu: bu ekranın ASIL eylemi. Uygulamada dolu turuncu
     "asıl eylem" demek ve burada başka dolu buton yok. */
  yeniButon: {
    width: 36,
    height: 36,
    borderRadius: kose.tam,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
  },

  icerik: {
    padding: sayfaKenari,
    gap: bosluk.orta,
  },

  kart: {
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
    ...renkler.golgeSm,
  },

  kartUst: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.kucuk,
  },

  konu: {
    flex: 1,
    fontSize: yazi.orta,
    lineHeight: satir.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  kartAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    marginTop: bosluk.orta,
    flexWrap: 'wrap',
  },

  meta: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
  },
});
