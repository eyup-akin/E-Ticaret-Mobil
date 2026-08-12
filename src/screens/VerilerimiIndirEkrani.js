import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { apiPost } from '../services/api';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

import FormAlani from '../components/FormAlani';

// ⭐ YENİ (Aşama 10) — KVKK md. 11: verilerimin bir kopyasını istiyorum
export default function VerilerimiIndirEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [sifre, setSifre] = useState('');
  const [gizli, setGizli] = useState(true);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [ozet, setOzet] = useState(null);
  const [veri, setVeri] = useState(null);

  async function indir() {
    if (!sifre) {
      setHata('Devam etmek için şifreni yaz.');
      return;
    }

    try {
      setYukleniyor(true);
      setHata('');

      const cevap = await apiPost('/hesap/verilerimi-indir', { sifre });

      setVeri(cevap);
      setOzet({
        siparis: cevap.siparisler?.length ?? 0,
        adres: cevap.adresler?.length ?? 0,
        numara: cevap.numaralar?.length ?? 0,
        yorum: cevap.yorumlar?.length ?? 0,
        favori: cevap.favoriler?.length ?? 0,
        destek: cevap.destekTalepleri?.length ?? 0,
        iade: cevap.iadeler?.length ?? 0,
        onay: cevap.sozlesmeOnaylari?.length ?? 0,
      });

      // ⚠️ Şifre hafızada tutulmuyor: iş bitti.
      setSifre('');
    } catch (e) {
      setHata(e.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // ⚠️ Dosyaya yazmak yerine paylaşım sayfası: `expo-file-system` +
  // `expo-sharing` iki yeni bağımlılık demekti. Share ile müşteri
  // veriyi kendi seçtiği yere (mail, notlar, buluta) gönderiyor.
  async function paylas() {
    try {
      await Share.share({
        title: 'Satık - kişisel verilerim',
        message: JSON.stringify(veri, null, 2),
      });
    } catch (e) {
      Alert.alert('Paylaşılamadı', e.message);
    }
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>

        <Text style={styles.ustBaslik}>Verilerimi İndir</Text>
      </View>

      <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">
        <View style={styles.bilgiKutu}>
          <Ionicons name="shield-checkmark-outline" size={18} color={renkler.anaRenkKoyu} />
          <Text style={styles.bilgiYazi}>
            KVKK kapsamında, hakkında tuttuğumuz bilgilerin bir kopyasını
            isteyebilirsin. Kart bilgilerin ve şifren bu kopyaya dahil
            değildir — onlar zaten saklanmıyor.
          </Text>
        </View>

        {ozet === null ? (
          <>
            <Text style={styles.alanBaslik}>Şifreni doğrula</Text>

            <FormAlani
              placeholder="Şifren"
              value={sifre}
              onChangeText={(m) => { setSifre(m); if (hata) setHata(''); }}
              hata={hata}
              secureTextEntry={gizli}
              autoCapitalize="none"
              editable={!yukleniyor}
              ikon="lock-closed-outline"
              sagIkon={gizli ? 'eye-outline' : 'eye-off-outline'}
              sagIkonEtiket={gizli ? 'Şifreyi göster' : 'Şifreyi gizle'}
              onSagIkonBas={() => setGizli(!gizli)}
            />

            <TouchableOpacity
              style={[styles.anaButon, yukleniyor && styles.butonPasif]}
              onPress={indir}
              disabled={yukleniyor}
              activeOpacity={0.85}
            >
              {yukleniyor
                ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
                : <Text style={styles.anaButonYazi}>Verilerimi Hazırla</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.hazirKutu}>
              <Ionicons name="checkmark-circle" size={20} color={renkler.basari} />
              <Text style={styles.hazirYazi}>Verilerin hazır.</Text>
            </View>

            {/* Ne indirildiğini sayıyla göstermek, "boş bir dosya mı
                geldi?" sorusunu baştan cevaplıyor. */}
            <View style={styles.ozetKutu}>
              {[
                ['Sipariş', ozet.siparis],
                ['Adres', ozet.adres],
                ['Telefon', ozet.numara],
                ['Yorum', ozet.yorum],
                ['Favori', ozet.favori],
                ['Destek talebi', ozet.destek],
                ['İade talebi', ozet.iade],
                ['Sözleşme onayı', ozet.onay],
              ].map(([etiket, adet]) => (
                <View key={etiket} style={styles.ozetSatir}>
                  <Text style={styles.ozetEtiket}>{etiket}</Text>
                  <Text style={styles.ozetDeger}>{adet}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.anaButon} onPress={paylas} activeOpacity={0.85}>
              <Text style={styles.anaButonYazi}>
                {Platform.OS === 'ios' ? 'Paylaş / Kaydet' : 'Dışa Aktar'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.altNot}>
              Veriler JSON biçiminde paylaşılır. Kendine mail atarak ya da
              notlarına kaydederek saklayabilirsin.
            </Text>
          </>
        )}
      </ScrollView>
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

  bilgiKutu: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.kucuk,
    backgroundColor: renkler.yumusakVurgu,
    borderRadius: kose.orta,
    padding: bosluk.normal,
    marginBottom: bosluk.genis,
  },

  bilgiYazi: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.orta,
    color: renkler.yaziOrta,
  },

  alanBaslik: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.kucuk,
  },

  anaButon: {
    height: 48,
    borderRadius: kose.orta,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
  },

  butonPasif: {
    backgroundColor: renkler.pasif,
  },

  anaButonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  hazirKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    marginBottom: bosluk.normal,
  },

  hazirYazi: {
    fontSize: yazi.orta,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  ozetKutu: {
    backgroundColor: renkler.kartArka,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    borderRadius: kose.buyuk,
    paddingHorizontal: bosluk.normal,
    marginBottom: bosluk.genis,
  },

  ozetSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: bosluk.orta,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },

  ozetEtiket: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
  },

  ozetDeger: {
    fontSize: yazi.normal,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  altNot: {
    marginTop: bosluk.orta,
    fontSize: yazi.kucuk,
    lineHeight: satir.kucuk,
    color: renkler.yaziGri,
    textAlign: 'center',
  },
});
