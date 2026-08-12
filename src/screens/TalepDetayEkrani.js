import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { apiGet, apiPost, apiPut } from '../services/api';
import { useTema } from '../context/TemaContext';
import { tarihBicimle } from '../utils/bicimlendir';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

import Rozet from '../components/Rozet';
import OnayPenceresi from '../components/OnayPenceresi';

const MESAJ_SINIRI = 2000;   // ⚠️ Backend DTO'sundaki sayıyla AYNI

// ============================================================
//  ⭐ YENİ (Aşama 8.4) — TALEP DETAYI / YAZIŞMA
// ============================================================
export default function TalepDetayEkrani({ route, navigation }) {
  const { talepId } = route.params;

  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [talep, setTalep] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [kapatmaOnayi, setKapatmaOnayi] = useState(false);

  const kaydiriciRef = useRef(null);

  async function getir() {
    try {
      const veri = await apiGet('/support/' + talepId);
      setTalep(veri);
    } catch (hata) {
      console.log('Talep alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // ⚠️ useFocusEffect: müşteri ekrandan çıkıp dönerse (ya da bildirim
  // üzerinden gelirse) yeni cevabı görmeli.
  useFocusEffect(
    useCallback(() => {
      getir();
    }, [talepId])
  );

  async function mesajGonder() {
    const metin = mesaj.trim();
    if (!metin) return;

    try {
      setGonderiliyor(true);

      await apiPost('/support/' + talepId + '/mesaj', { mesaj: metin });

      // ⚠️ Kutu SUNUCU ONAYLADIKTAN SONRA temizleniyor: istek
      // patlarsa müşteri yazdığını kaybetmesin.
      setMesaj('');
      await getir();
    } catch (hata) {
      Alert.alert('Gönderilemedi', hata.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  async function talebiKapat() {
    setKapatmaOnayi(false);

    try {
      await apiPut('/support/' + talepId + '/kapat', {});
      await getir();
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    }
  }

  if (yukleniyor && talep === null) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  if (talep === null) {
    return (
      <View style={styles.ortala}>
        <Text style={styles.bosYazi}>Talep bulunamadı.</Text>
      </View>
    );
  }

  const kapaliMi = talep.durum === 'kapali';

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <View style={styles.ustOrta}>
          <Text style={styles.ustBaslik} numberOfLines={1}>{talep.konu}</Text>
          {talep.siparisNo ? (
            <Text style={styles.ustAlt}>{talep.siparisNo}</Text>
          ) : null}
        </View>

        {/* ⚠️ "Kapat" YALNIZCA açık talepte. Kapalı bir talebi
            kapatmak diye bir iş yok; buton orada dursaydı basınca
            hiçbir şey olmayan bir düğme olurdu. */}
        {!kapaliMi && (
          <TouchableOpacity
            onPress={() => setKapatmaOnayi(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Talebi kapat"
          >
            <Ionicons name="checkmark-done-outline" size={22} color={renkler.yaziOrta} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.kapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={kaydiriciRef}
          contentContainerStyle={styles.yazisma}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          /* ⚠️ İçerik büyüdükçe sona kaydır: en yeni mesaj en altta
             ve müşteri açtığında onu görmeli. `onLayout` yetmezdi —
             mesajlar geldikçe yükseklik değişiyor. */
          onContentSizeChange={() => kaydiriciRef.current?.scrollToEnd({ animated: false })}
        >
          {talep.mesajlar.map((m) => (
            <View
              key={m.id}
              /* ⚠️ Taraf ayrımı KONUMLA da yapılıyor (müşteri sağda,
                 mağaza solda), sadece renkle değil: renk körlüğü olan
                 biri için renk tek başına bilgi taşımaz.
                 ⚠️ Müşterinin kendi mesajı SAĞDA — mesajlaşma
                 uygulamalarının evrensel dili; tersi "bu benim
                 mesajım mı?" sorusunu doğururdu. */
              style={[
                styles.balon,
                m.gonderenAdminMi ? styles.balonMagaza : styles.balonBen,
              ]}
            >
              <Text style={styles.balonKim}>
                {m.gonderenAdminMi ? 'Satık Destek' : 'Sen'}
              </Text>

              <Text style={styles.balonMetin}>{m.mesaj}</Text>

              <Text style={styles.balonTarih}>{tarihBicimle(m.createdAt)}</Text>
            </View>
          ))}

          {kapaliMi && (
            <View style={styles.kapaliKutu}>
              <Rozet tip="notr" yazi="Kapalı" />
              <Text style={styles.kapaliYazi}>
                Bu talep kapatıldı. Yazmaya devam edersen tekrar açılır.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* ⚠️ Kapalı talepte de yazma kutusu DURUYOR — pasif değil.
            Sunucu kuralı şu: müşteri yazarsa talep yeniden açılır.
            Kutuyu kapatsaydık müşteri "kapandı, artık ulaşamıyorum"
            sanar ve aynı konu için ikinci bir talep açardı. */}
        <View style={styles.yazmaCubugu}>
          <TextInput
            style={styles.girdi}
            value={mesaj}
            onChangeText={setMesaj}
            placeholder={kapaliMi ? 'Yazarsan talep yeniden açılır...' : 'Mesajını yaz...'}
            placeholderTextColor={renkler.yaziGri}
            multiline
            maxLength={MESAJ_SINIRI}
            editable={!gonderiliyor}
          />

          <TouchableOpacity
            style={[styles.gonderButon, (gonderiliyor || !mesaj.trim()) && styles.butonPasif]}
            onPress={mesajGonder}
            disabled={gonderiliyor || !mesaj.trim()}
            accessibilityRole="button"
            accessibilityLabel="Gönder"
          >
            {gonderiliyor
              ? <ActivityIndicator color={renkler.anaRenkUstuYazi} size="small" />
              : <Ionicons name="send" size={18} color={renkler.anaRenkUstuYazi} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <OnayPenceresi
        acik={kapatmaOnayi}
        ikon="checkmark-done-outline"
        baslik="Talep kapatılsın mı?"
        mesaj="Sorunun çözüldüyse kapatabilirsin. Gerekirse tekrar yazarak yeniden açabilirsin."
        onayYazisi="Evet, Kapat"
        vazgecYazisi="Vazgeç"
        onVazgec={() => setKapatmaOnayi(false)}
        onOnayla={talebiKapat}
      />
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },

  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: renkler.arkaPlan,
  },

  bosYazi: {
    fontSize: yazi.normal,
    color: renkler.yaziGri,
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

  ustOrta: {
    flex: 1,
  },

  ustBaslik: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  ustAlt: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },

  yazisma: {
    padding: sayfaKenari,
    gap: bosluk.orta,
  },

  balon: {
    maxWidth: '84%',
    borderRadius: kose.buyuk,
    padding: bosluk.normal,
  },

  balonBen: {
    alignSelf: 'flex-end',
    backgroundColor: renkler.yumusakVurgu,
    borderBottomRightRadius: kose.kucuk,
  },

  balonMagaza: {
    alignSelf: 'flex-start',
    backgroundColor: renkler.kartArka,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    borderBottomLeftRadius: kose.kucuk,
  },

  balonKim: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziOrta,
    marginBottom: bosluk.mikro,
  },

  balonMetin: {
    fontSize: yazi.normal,
    lineHeight: satir.orta,
    color: renkler.yaziKoyu,
  },

  balonTarih: {
    fontSize: yazi.mikro,
    color: renkler.yaziGri,
    marginTop: bosluk.kucuk,
    alignSelf: 'flex-end',
  },

  kapaliKutu: {
    alignItems: 'center',
    gap: bosluk.kucuk,
    paddingVertical: bosluk.normal,
  },

  kapaliYazi: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziGri,
    textAlign: 'center',
  },

  yazmaCubugu: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: bosluk.kucuk,
    paddingHorizontal: sayfaKenari,
    paddingVertical: bosluk.orta,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  /* ⚠️ `maxHeight`: çok satırlı kutu uzun mesajda ekranın yarısını
     yiyordu; sınır olmadan yazışma tamamen görünmez oluyordu. */
  girdi: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.buyuk,
    paddingHorizontal: bosluk.normal,
    paddingTop: bosluk.orta,
    paddingBottom: bosluk.orta,
    fontSize: yazi.normal,
    color: renkler.yaziKoyu,
    backgroundColor: renkler.arkaPlan,
  },

  gonderButon: {
    width: 44,
    height: 44,
    borderRadius: kose.tam,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
  },

  butonPasif: {
    backgroundColor: renkler.pasif,
  },
});
