import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

import Rozet from '../components/Rozet';
import BosDurum from '../components/BosDurum';
import { SatirListesiIskeleti } from '../components/Iskelet';

const SEBEP_YAZI = {
  hatali_urun: 'Ürün hatalı',
  bedene_uymadi: 'Bedene uymadı',
  farkli_urun_geldi: 'Farklı ürün geldi',
  hasarli_geldi: 'Hasarlı geldi',
  vazgectim: 'Vazgeçtim',
  diger: 'Diğer',
};

// Durum → rozet + müşteriye ne söylüyor.
// ⚠️ Metinler admin panelindekiyle aynı değil: admin "yapılacak iş"
// görüyor, müşteri "başıma ne geliyor" görüyor.
const DURUM_BILGI = {
  talep_edildi: { tip: 'uyari', yazi: 'İnceleniyor', not: 'Talebini aldık, en kısa sürede döneceğiz.' },
  onaylandi: { tip: 'vurgu', yazi: 'Onaylandı', not: 'Ürünü kargoya verebilirsin.' },
  teslim_alindi: { tip: 'vurgu', yazi: 'Ürün bize ulaştı', not: 'Ödemen kısa süre içinde iade edilecek.' },
  para_iade_edildi: { tip: 'basari', yazi: 'İade edildi', not: 'Tutarın hesabına birkaç iş günü içinde geçer.' },
  reddedildi: { tip: 'hata', yazi: 'Reddedildi', not: null },
};

// ⭐ YENİ (Aşama 9.4) — İADELERİM
export default function IadelerimEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [iadeler, setIadeler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [agHatasi, setAgHatasi] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;

      (async () => {
        try {
          setAgHatasi(false);
          const veri = await apiGet('/returns');
          if (!iptal) setIadeler(veri);
        } catch (hata) {
          if (!iptal) { setIadeler([]); setAgHatasi(true); }
          console.log('İadeler alınamadı:', hata.message);
        } finally {
          if (!iptal) setYukleniyor(false);
        }
      })();

      return () => { iptal = true; };
    }, [])
  );

  function kart({ item }) {
    const d = DURUM_BILGI[item.durum] ?? { tip: 'notr', yazi: item.durum, not: null };

    return (
      <TouchableOpacity
        style={styles.kart}
        onPress={() => navigation.navigate('SiparisDetay', { siparisId: item.orderId })}
        activeOpacity={0.85}
      >
        <View style={styles.kartUst}>
          <Text style={styles.siparisNo}>{item.siparisNo}</Text>
          <Rozet tip={d.tip} yazi={d.yazi} />
        </View>

        <Text style={styles.kapsam} numberOfLines={2}>
          {item.urunAdi ?? 'Siparişin tamamı'}
        </Text>

        <Text style={styles.meta}>
          {SEBEP_YAZI[item.sebep] ?? item.sebep} · {tarihBicimle(item.talepTarihi)}
        </Text>

        {/* Reddedildiyse sebep, diğer durumlarda sıradaki adım. */}
        {item.redNedeni ? (
          <View style={styles.redKutu}>
            <Text style={styles.redYazi}>{item.redNedeni}</Text>
          </View>
        ) : d.not ? (
          <Text style={styles.durumNot}>{d.not}</Text>
        ) : null}

        <View style={styles.tutarSatir}>
          <Text style={styles.tutarEtiket}>
            {item.iadeTutari != null ? 'İade edilen' : 'İade edilecek'}
          </Text>
          <Text style={styles.tutarDeger}>
            {paraBicimle(item.iadeTutari ?? item.tutar)}
          </Text>
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

        <Text style={styles.ustBaslik}>İadelerim</Text>
      </View>

      {yukleniyor ? (
        <View style={styles.icerik}><SatirListesiIskeleti /></View>
      ) : agHatasi ? (
        <BosDurum
          ikon="cloud-offline-outline"
          baslik="Bağlanamadık"
          aciklama="İadelerini getiremedik. Bağlantını kontrol edip tekrar dene."
        />
      ) : iadeler.length === 0 ? (
        <BosDurum
          ikon="arrow-undo-outline"
          baslik="İade talebin yok"
          aciklama="Teslim aldığın bir siparişte sorun varsa sipariş detayından iade talebi açabilirsin."
        />
      ) : (
        <FlatList
          data={iadeler}
          keyExtractor={(x) => x.id.toString()}
          renderItem={kart}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.kucuk,
  },

  siparisNo: {
    fontSize: yazi.normal,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  kapsam: {
    marginTop: bosluk.kucuk,
    fontSize: yazi.normal,
    color: renkler.yaziKoyu,
  },

  meta: {
    marginTop: 2,
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
  },

  durumNot: {
    marginTop: bosluk.kucuk,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
  },

  redKutu: {
    marginTop: bosluk.kucuk,
    backgroundColor: renkler.yumusakHata,
    borderRadius: kose.kucuk,
    padding: bosluk.orta,
  },

  redYazi: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.hata,
  },

  tutarSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: bosluk.orta,
    paddingTop: bosluk.orta,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
  },

  tutarEtiket: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
  },

  tutarDeger: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },
});
