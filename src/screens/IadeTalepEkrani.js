import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

import { apiGet, apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';
import { paraBicimle } from '../utils/bicimlendir';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

// Değerler sunucudaki beyaz listeyle aynı olmak zorunda.
const SEBEPLER = [
  { deger: 'hatali_urun', etiket: 'Ürün hatalı / çalışmıyor' },
  { deger: 'hasarli_geldi', etiket: 'Hasarlı geldi' },
  { deger: 'farkli_urun_geldi', etiket: 'Farklı ürün geldi' },
  { deger: 'bedene_uymadi', etiket: 'Bedene / ölçüye uymadı' },
  { deger: 'vazgectim', etiket: 'Vazgeçtim' },
  { deger: 'diger', etiket: 'Diğer' },
];

// ⭐ YENİ (Aşama 9.4) — İADE TALEBİ OLUŞTURMA
export default function IadeTalepEkrani({ route, navigation }) {
  const { siparisId } = route.params;

  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [uygunluk, setUygunluk] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  // null = tüm sipariş
  const [seciliKalem, setSeciliKalem] = useState(null);
  const [sebep, setSebep] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    let iptal = false;

    (async () => {
      try {
        const veri = await apiGet('/returns/uygunluk/' + siparisId);
        if (!iptal) setUygunluk(veri);
      } catch (hata) {
        if (!iptal) setUygunluk({ uygunMu: false, sebep: hata.message });
      } finally {
        if (!iptal) setYukleniyor(false);
      }
    })();

    return () => { iptal = true; };
  }, [siparisId]);

  async function gonder() {
    if (!sebep) {
      Alert.alert('Sebep seç', 'İade sebebini seçmen gerekiyor.');
      return;
    }

    try {
      setGonderiliyor(true);

      await apiPost('/returns', {
        orderId: siparisId,
        orderItemId: seciliKalem,
        sebep,
        aciklama: aciklama.trim() || null,
      });

      // replace: geri tuşuna basan müşteri formu tekrar görmesin.
      navigation.replace('Iadelerim');
    } catch (hata) {
      Alert.alert('Gönderilemedi', hata.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  const secilenTutar = seciliKalem === null
    ? uygunluk?.tumSiparisTutari
    : uygunluk?.kalemler?.find((k) => k.orderItemId === seciliKalem)?.tutar;

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <Text style={styles.ustBaslik}>İade Talebi</Text>
      </View>

      {/* Uygun değilse form hiç çizilmiyor: doldurup reddedilmektense
          sebebi baştan söylemek daha dürüst. */}
      {!uygunluk?.uygunMu ? (
        <View style={styles.ortala}>
          <Ionicons name="information-circle-outline" size={40} color={renkler.yaziGri} />
          <Text style={styles.uygunDegilYazi}>{uygunluk?.sebep ?? 'İade yapılamıyor.'}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.kapsayici}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.icerik}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sureKutu}>
              <Ionicons name="time-outline" size={16} color={renkler.anaRenkKoyu} />
              <Text style={styles.sureYazi}>
                İade hakkın {uygunluk.kalanGun} gün daha geçerli.
              </Text>
            </View>

            <Text style={styles.alanBaslik}>Ne iade edeceksin?</Text>

            {uygunluk.tumSiparisUygun && (
              <TouchableOpacity
                style={[styles.secim, seciliKalem === null && styles.secimSecili]}
                onPress={() => setSeciliKalem(null)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={seciliKalem === null ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={seciliKalem === null ? renkler.anaRenk : renkler.yaziGri}
                />
                <Text style={styles.secimYazi}>Siparişin tamamı</Text>
                <Text style={styles.secimTutar}>{paraBicimle(uygunluk.tumSiparisTutari)}</Text>
              </TouchableOpacity>
            )}

            {uygunluk.kalemler?.map((k) => {
              const secili = seciliKalem === k.orderItemId;

              return (
                <TouchableOpacity
                  key={k.orderItemId}
                  style={[styles.secim, secili && styles.secimSecili]}
                  onPress={() => setSeciliKalem(k.orderItemId)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={secili ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={secili ? renkler.anaRenk : renkler.yaziGri}
                  />
                  <Text style={styles.secimYazi} numberOfLines={2}>
                    {k.urunAdi}{k.adet > 1 ? ` (${k.adet} adet)` : ''}
                  </Text>
                  <Text style={styles.secimTutar}>{paraBicimle(k.tutar)}</Text>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.alanBaslik, { marginTop: bosluk.genis }]}>Sebep</Text>

            {SEBEPLER.map((s) => {
              const secili = sebep === s.deger;

              return (
                <TouchableOpacity
                  key={s.deger}
                  style={[styles.secim, secili && styles.secimSecili]}
                  onPress={() => setSebep(s.deger)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={secili ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={secili ? renkler.anaRenk : renkler.yaziGri}
                  />
                  <Text style={styles.secimYazi}>{s.etiket}</Text>
                </TouchableOpacity>
              );
            })}

            <Text style={[styles.alanBaslik, { marginTop: bosluk.genis }]}>
              Açıklama (isteğe bağlı)
            </Text>

            <TextInput
              style={styles.aciklamaAlan}
              value={aciklama}
              onChangeText={setAciklama}
              placeholder="Ayrıntı yazarsan daha hızlı sonuçlanır."
              placeholderTextColor={renkler.yaziGri}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              editable={!gonderiliyor}
            />

            {/* Tutar gönderilmeden ÖNCE gösteriliyor: müşteri ne kadar
                geri alacağını bilerek onaylasın. */}
            <View style={styles.tutarKutu}>
              <Text style={styles.tutarEtiket}>İade edilecek tutar</Text>
              <Text style={styles.tutarDeger}>{paraBicimle(secilenTutar ?? 0)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.gonderButon, gonderiliyor && styles.butonPasif]}
              onPress={gonder}
              disabled={gonderiliyor}
              activeOpacity={0.85}
            >
              {gonderiliyor
                ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
                : <Text style={styles.gonderYazi}>İade Talebi Oluştur</Text>}
            </TouchableOpacity>

            <Text style={styles.altNot}>
              Talebin onaylanınca ürünü kargoya vermen istenecek. Para, ürün bize
              ulaştıktan sonra iade edilir.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
    gap: bosluk.orta,
    padding: sayfaKenari,
    backgroundColor: renkler.arkaPlan,
  },

  uygunDegilYazi: {
    fontSize: yazi.normal,
    lineHeight: satir.orta,
    color: renkler.yaziOrta,
    textAlign: 'center',
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
    paddingBottom: bosluk.dev,
  },

  sureKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    backgroundColor: renkler.yumusakVurgu,
    borderRadius: kose.orta,
    padding: bosluk.orta,
    marginBottom: bosluk.genis,
  },

  sureYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    color: renkler.yaziOrta,
  },

  alanBaslik: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.kucuk,
  },

  secim: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    paddingHorizontal: bosluk.normal,
    paddingVertical: bosluk.orta,
    marginBottom: bosluk.kucuk,
    backgroundColor: renkler.kartArka,
  },

  // Seçilince kalınlık değil renk değişiyor: 1px büyüme listeyi zıplatır.
  secimSecili: {
    borderColor: renkler.anaRenk,
    backgroundColor: renkler.yumusakVurgu,
  },

  secimYazi: {
    flex: 1,
    fontSize: yazi.normal,
    color: renkler.yaziKoyu,
  },

  secimTutar: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  aciklamaAlan: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    padding: bosluk.normal,
    fontSize: yazi.orta,
    lineHeight: satir.orta,
    color: renkler.yaziKoyu,
    backgroundColor: renkler.kartArka,
  },

  tutarKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: bosluk.genis,
    padding: bosluk.normal,
    borderRadius: kose.orta,
    backgroundColor: renkler.acikKart,
  },

  tutarEtiket: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
  },

  tutarDeger: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  gonderButon: {
    marginTop: bosluk.genis,
    height: 48,
    borderRadius: kose.orta,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
  },

  butonPasif: {
    backgroundColor: renkler.pasif,
  },

  gonderYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  altNot: {
    marginTop: bosluk.orta,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziGri,
    textAlign: 'center',
  },
});
