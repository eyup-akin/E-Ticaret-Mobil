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
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

import FormAlani from '../components/FormAlani';

// ⚠️ Değerler SUNUCUDAKİ beyaz listeyle birebir aynı olmak zorunda
// (`DestekKategorisi`). Etiketler ekran için, değerler veri için.
const KATEGORILER = [
  { deger: 'kargo', etiket: 'Kargo', ikon: 'cube-outline' },
  { deger: 'urun', etiket: 'Ürün', ikon: 'pricetag-outline' },
  { deger: 'odeme', etiket: 'Ödeme', ikon: 'card-outline' },
  { deger: 'diger', etiket: 'Diğer', ikon: 'ellipsis-horizontal' },
];

const MESAJ_SINIRI = 2000;   // ⚠️ Backend DTO'sundaki sayıyla AYNI

// ============================================================
//  ⭐ YENİ (Aşama 8.4) — YENİ DESTEK TALEBİ
//
//  Sipariş detayından da açılıyor: `route.params.orderId` doluysa
//  talep o siparişe bağlanıyor ve müşteri "hangi sipariş?" diye
//  sorulmaktan kurtuluyor.
// ============================================================
export default function YeniTalepEkrani({ route, navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  // Sipariş detayından geldiyse hazır gelir.
  const bagliSiparisId = route.params?.orderId ?? null;

  const [kategori, setKategori] = useState(bagliSiparisId ? 'kargo' : '');
  const [konu, setKonu] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [alanHatasi, setAlanHatasi] = useState({});

  // Bağlı siparişin numarası — ekranda id değil numara yazmalı.
  const [siparisNo, setSiparisNo] = useState(null);

  useEffect(() => {
    if (!bagliSiparisId) return;

    let iptal = false;

    (async () => {
      try {
        const veri = await apiGet('/orders/' + bagliSiparisId);
        if (!iptal) setSiparisNo(veri.orderNumber ?? veri.siparisNo ?? null);
      } catch (hata) {
        // ⚠️ Sessizce geçiliyor: numara İKİNCİL bilgi. Alınamazsa
        // talep yine açılabilmeli — bağlantı zaten id ile kuruluyor.
        console.log('Sipariş numarası alınamadı:', hata.message);
      }
    })();

    return () => { iptal = true; };
  }, [bagliSiparisId]);

  async function gonder() {
    const hatalar = {};

    if (!kategori) hatalar.kategori = 'Bir konu başlığı seç.';
    if (konu.trim().length < 3) hatalar.konu = 'Konu en az 3 karakter olmalı.';
    if (mesaj.trim().length < 5) hatalar.mesaj = 'Biraz daha ayrıntı yaz (en az 5 karakter).';

    if (Object.keys(hatalar).length > 0) {
      setAlanHatasi(hatalar);
      return;
    }

    setAlanHatasi({});

    try {
      setGonderiliyor(true);

      const cevap = await apiPost('/support', {
        konu: konu.trim(),
        kategori,
        mesaj: mesaj.trim(),
        orderId: bagliSiparisId,
      });

      // ⚠️ `replace`, `navigate` DEĞİL: geri tuşuna basan müşteri
      // az önce gönderdiği formu tekrar görmemeli — ikinci kez
      // gönderme riski doğar.
      navigation.replace('TalepDetay', { talepId: cevap.id });
    } catch (hata) {
      Alert.alert('Gönderilemedi', hata.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <Text style={styles.ustBaslik}>Yeni Talep</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.kapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.icerik}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ⚠️ Bağlı sipariş bir BİLGİ satırı, seçilebilir bir alan
              değil: müşteri buraya zaten sipariş detayından geldi.
              Değiştirilebilir yapsaydık "hangi siparişti?" sorusunu
              geri sormuş olurduk. */}
          {bagliSiparisId ? (
            <View style={styles.siparisKutu}>
              <Ionicons name="receipt-outline" size={16} color={renkler.anaRenkKoyu} />
              <Text style={styles.siparisYazi}>
                {siparisNo
                  ? `${siparisNo} numaralı siparişin hakkında`
                  : 'Seçtiğin sipariş hakkında'}
              </Text>
            </View>
          ) : null}

          <Text style={styles.alanBaslik}>Konu başlığı</Text>

          {/* ⚠️ Chip bileşeni KULLANILMADI: o tek seçimli bir filtre
              şeridi için yazıldı ve ikon taşımıyor. Burada dört
              seçenek ikonlarıyla birlikte ızgarada duruyor —
              ortak bileşene ikon prop'u eklemek, sıralama şeridini
              de değiştirme riski demekti. */}
          <View style={styles.kategoriIzgara}>
            {KATEGORILER.map((k) => {
              const secili = kategori === k.deger;

              return (
                <TouchableOpacity
                  key={k.deger}
                  style={[styles.kategoriKaro, secili && styles.kategoriKaroSecili]}
                  onPress={() => setKategori(k.deger)}
                  activeOpacity={0.85}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: secili }}
                >
                  <Ionicons
                    name={k.ikon}
                    size={20}
                    color={secili ? renkler.anaRenk : renkler.yaziOrta}
                  />
                  <Text style={[styles.kategoriYazi, secili && styles.kategoriYaziSecili]}>
                    {k.etiket}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {alanHatasi.kategori ? (
            <Text style={styles.hataYazi}>{alanHatasi.kategori}</Text>
          ) : null}

          <FormAlani
            etiket="Başlık"
            placeholder="Kısaca konu (örn: Kargom gelmedi)"
            value={konu}
            onChangeText={(m) => {
              setKonu(m);
              if (alanHatasi.konu) setAlanHatasi((o) => ({ ...o, konu: '' }));
            }}
            hata={alanHatasi.konu}
            maxLength={150}
            editable={!gonderiliyor}
          />

          <Text style={styles.alanBaslik}>Mesajın</Text>

          {/* ⚠️ FormAlani KULLANILMADI: o tek satırlık bir kutu ve
              `height: 48` sabit. Çok satırlı bir metin alanını oraya
              sıkıştırmak, dört ekranda kullanılan ortak bileşeni
              tek bir ekran için esnetmek olurdu. */}
          <TextInput
            style={[styles.mesajAlan, alanHatasi.mesaj && styles.mesajAlanHatali]}
            value={mesaj}
            onChangeText={(m) => {
              setMesaj(m);
              if (alanHatasi.mesaj) setAlanHatasi((o) => ({ ...o, mesaj: '' }));
            }}
            placeholder="Ne olduğunu anlat. Ayrıntı ne kadar çoksa o kadar hızlı çözeriz."
            placeholderTextColor={renkler.yaziGri}
            multiline
            textAlignVertical="top"
            maxLength={MESAJ_SINIRI}
            editable={!gonderiliyor}
          />

          {alanHatasi.mesaj ? (
            <Text style={styles.hataYazi}>{alanHatasi.mesaj}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.gonderButon, gonderiliyor && styles.butonPasif]}
            onPress={gonder}
            disabled={gonderiliyor}
            activeOpacity={0.85}
          >
            {gonderiliyor
              ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
              : <Text style={styles.gonderYazi}>Talebi Gönder</Text>}
          </TouchableOpacity>

          <Text style={styles.altNot}>
            Talebini aldıktan sonra buradan yazışmaya devam edebilirsin.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: bosluk.dev,
  },

  siparisKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    backgroundColor: renkler.yumusakVurgu,
    borderRadius: kose.orta,
    padding: bosluk.orta,
    marginBottom: bosluk.genis,
  },

  siparisYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziOrta,
  },

  alanBaslik: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.kucuk,
  },

  kategoriIzgara: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: bosluk.kucuk,
    marginBottom: bosluk.genis,
  },

  /* ⚠️ Genişlik yüzdeyle DEĞİL, esneme ile: dört karo iki satıra
     bölünüyor ve sabit yüzde, farklı ekran genişliklerinde son
     karoyu alt satıra düşürüyordu. */
  kategoriKaro: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    paddingVertical: bosluk.orta,
    paddingHorizontal: bosluk.normal,
    backgroundColor: renkler.kartArka,
  },

  /* Seçilince KALINLIK değil renk ve zemin değişiyor — kalınlık
     değişseydi karo 1px büyüyüp ızgarayı zıplatırdı (adres ve kart
     kartlarında verilen kararın aynısı). */
  kategoriKaroSecili: {
    borderColor: renkler.anaRenk,
    backgroundColor: renkler.yumusakVurgu,
  },

  kategoriYazi: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
  },

  kategoriYaziSecili: {
    color: renkler.anaRenk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },

  mesajAlan: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.orta,
    padding: bosluk.normal,
    fontSize: yazi.orta,
    lineHeight: satir.orta,
    color: renkler.yaziKoyu,
    backgroundColor: renkler.kartArka,
  },

  mesajAlanHatali: {
    borderColor: renkler.hata,
  },

  hataYazi: {
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.hata,
    marginTop: bosluk.mikro,
    marginBottom: bosluk.kucuk,
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
