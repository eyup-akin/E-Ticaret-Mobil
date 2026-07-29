import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { useSepet } from '../context/SepetContext';

import { useAuth } from '../context/AuthContext';
import GirisGerekliEkrani from '../components/GirisGerekliEkrani';

import AramaCubugu from '../components/AramaCubugu';
import SepetSatiri from '../components/SepetSatiri';
import { paraBicimle } from '../utils/bicimlendir';

export default function SepetEkrani({ navigation }) {

  const { token } = useAuth();

  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const {
    sepet,
    yukleniyor,
    toplamTutar,
    sepetiYukle,
    adetGuncelle,
    sepettenCikar,

    // ⭐ YENİ — kupon
    kupon,
    kuponYukleniyor,
    kuponUyari,
    indirimTutari,
    odenecekTutar,
    kuponUygula,
    kuponuKaldir,
    kuponUyariyiTemizle,
  } = useSepet();

  const [aramaMetni, setAramaMetni] = useState('');

  // ⭐ YENİ — kupon giriş kutusundaki metin
  const [kuponGirdi, setKuponGirdi] = useState('');

  // ⭐ YENİ — deneme sonucu mesajı: { tip: 'basari' | 'hata', metin }
  //
  // Bunu context'te DEĞİL burada tutuyoruz çünkü bu bir EKRAN olayı:
  // "az önceki denemenin sonucu". Başka ekranı ilgilendirmiyor ve
  // ekrandan çıkıp dönünce sıfırlanması doğru davranış.
  const [kuponMesaj, setKuponMesaj] = useState(null);

  // Ekran her odağa geldiğinde sepeti yenile
  useFocusEffect(
    useCallback(() => {
      // Misafirse veri çekme — 401 hatası basmasın
      if (!token) return;
      sepetiYukle();
    }, [token])
  );

  // Silmeden önce onay sor
  function silmeyiOnayla(item) {
    Alert.alert(
      'Sepetten çıkar',
      `"${item.productName}" sepetten çıkarılsın mı?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Çıkar', style: 'destructive', onPress: () => sepettenCikar(item) },
      ]
    );
  }

  // ⭐ YENİ — kuponu dene
  async function kuponuDene() {
    const sonuc = await kuponUygula(kuponGirdi);

    setKuponMesaj({
      tip: sonuc.basarili ? 'basari' : 'hata',
      metin: sonuc.mesaj,
    });

    if (sonuc.basarili) {
      // Başarılıysa kutuyu boşalt — kupon artık aşağıda kartta görünüyor,
      // kutuda da durması gereksiz tekrar olurdu.
      setKuponGirdi('');
    }
  }

  // ⭐ YENİ — kuponu kaldır
  function kuponuCikar() {
    kuponuKaldir();
    setKuponMesaj(null);
    setKuponGirdi('');
  }

  // Arama sadece GÖRÜNÜMÜ süzer, toplamı etkilemez
  const filtreliSepet = aramaMetni
    ? sepet.filter((s) => s.productName.toLowerCase().includes(aramaMetni.toLowerCase()))
    : sepet;


  // 🔒 MİSAFİR KAPISI — tüm hook'lardan SONRA, ilk return'den ÖNCE
  if (!token) {
    return (
      <GirisGerekliEkrani
        ikon="cart-outline"
        baslik="Sepetini görmek için giriş yap"
        aciklama="Sepetine ürün ekleyip kolayca sipariş verebilirsin."
      />
    );
  }

  if (yukleniyor) {
    return (
      <View style={styles.ortala}>
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      {/* KeyboardAvoidingView: kupon kutusu ekranın altında olduğu için
          klavye açılınca üstünü kapatabilir.
          iOS'ta 'padding' davranışı gerekir; Android'de sistem zaten
          pencereyi yeniden boyutlandırdığı için undefined bırakıyoruz —
          ikisini birden verirsek Android'de çift kaydırma olur. */}
      <KeyboardAvoidingView
        style={styles.kapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.baslik}>Sepetim</Text>

        {sepet.length > 0 && (
          <AramaCubugu
            value={aramaMetni}
            onChangeText={setAramaMetni}
            onSubmit={() => {}}
            placeholder="Sepette ara..."
          />
        )}

        {sepet.length === 0 ? (
          <View style={styles.ortala}>
            <Ionicons name="cart-outline" size={64} color={renkler.yaziGri} />
            <Text style={styles.bosYazi}>Sepetin boş.</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={filtreliSepet}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <SepetSatiri
                  item={item}
                  onAdetDegistir={adetGuncelle}
                  onSil={silmeyiOnayla}
                  onBas={(it) =>
                    navigation.navigate('AnaSayfa', {
                      screen: 'UrunDetay',
                      params: { urunId: it.productId },
                    })
                  }
                />
              )}
              contentContainerStyle={styles.liste}
              ListEmptyComponent={
                <Text style={styles.bosYazi}>Sepetinde eşleşen ürün yok.</Text>
              }
            />

            {/* ============ ALT PANEL ============ */}
            <View style={styles.altPanel}>

              {/* ---- OTOMATİK KALDIRMA UYARISI ---- */}
              {/* Sepet değişince kupon geçersizleştiyse burada çıkar.
                  Sessizce kaldırsaydık müşteri indirimin nereye
                  gittiğini anlamazdı. */}
              {kuponUyari !== '' && (
                <View style={styles.uyariKutu}>
                  <Ionicons name="alert-circle" size={18} color={renkler.uyari} />
                  <Text style={styles.uyariYazi}>{kuponUyari}</Text>
                  <TouchableOpacity onPress={kuponUyariyiTemizle}>
                    <Ionicons name="close" size={18} color={renkler.yaziGri} />
                  </TouchableOpacity>
                </View>
              )}

              {/* ---- KUPON ALANI ---- */}
              {/* Türetilmiş görünüm: kupon varsa kart, yoksa giriş kutusu.
                  Ayrı bir "kuponKutusuAcik" state'i tutmuyoruz —
                  gerçek durum zaten kupon nesnesinin kendisi. */}
              {kupon === null ? (
                <View style={styles.kuponSatir}>
                  <View style={styles.kuponInputSarmal}>
                    <Ionicons name="pricetag-outline" size={18} color={renkler.yaziGri} />
                    <TextInput
                      style={styles.kuponInput}
                      value={kuponGirdi}
                      onChangeText={(metin) => {
                        setKuponGirdi(metin);
                        // Kullanıcı yazmaya başlayınca eski hata mesajını sil —
                        // düzeltmeye çalışırken hâlâ kırmızı yazı görmesin.
                        if (kuponMesaj) setKuponMesaj(null);
                      }}
                      placeholder="Kupon kodu"
                      placeholderTextColor={renkler.yaziGri}
                      /* Kupon kodları hep büyük harf — klavyeyi de öyle aç.
                         autoCorrect kapalı çünkü kodlar sözlükte yok,
                         telefon "düzeltmeye" kalkarsa kod bozulur. */
                      autoCapitalize="characters"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={kuponuDene}
                      editable={!kuponYukleniyor}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.kuponButon,
                      /* Kutu boşken veya istek sürerken buton soluk */
                      (kuponGirdi.trim() === '' || kuponYukleniyor) && styles.kuponButonPasif,
                    ]}
                    onPress={kuponuDene}
                    disabled={kuponGirdi.trim() === '' || kuponYukleniyor}
                  >
                    {kuponYukleniyor ? (
                      <ActivityIndicator size="small" color={renkler.anaRenkUstuYazi} />
                    ) : (
                      <Text style={styles.kuponButonYazi}>Uygula</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.kuponKart}>
                  <Ionicons name="checkmark-circle" size={20} color={renkler.basari} />

                  <View style={styles.kuponKartOrta}>
                    <Text style={styles.kuponKod}>{kupon.kod}</Text>
                    <Text style={styles.kuponAciklama} numberOfLines={1}>
                      {kupon.aciklama}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={kuponuCikar} style={styles.kuponKaldirButon}>
                    <Text style={styles.kuponKaldirYazi}>Kaldır</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ---- DENEME SONUCU MESAJI ---- */}
              {kuponMesaj !== null && (
                <Text
                  style={[
                    styles.kuponMesaj,
                    { color: kuponMesaj.tip === 'basari' ? renkler.basari : renkler.hata },
                  ]}
                >
                  {kuponMesaj.metin}
                </Text>
              )}

              {/* ---- ÖZET ---- */}
              <View style={styles.ozet}>
                <View style={styles.ozetSatir}>
                  <Text style={styles.ozetEtiket}>Ara toplam</Text>
                  <Text style={styles.ozetDeger}>{paraBicimle(toplamTutar)}</Text>
                </View>

                {/* İndirim satırı SADECE indirim varsa görünür.
                    "İndirim: 0,00 ₺" yazmak gereksiz gürültü olurdu.
                    Türetilmiş koşul — ayrı state yok. */}
                {indirimTutari > 0 && (
                  <View style={styles.ozetSatir}>
                    <Text style={styles.ozetEtiket}>İndirim</Text>
                    <Text style={[styles.ozetDeger, { color: renkler.basari }]}>
                      −{paraBicimle(indirimTutari)}
                    </Text>
                  </View>
                )}

                <View style={styles.ayirac} />

                <View style={styles.ozetSatir}>
                  <Text style={styles.odenecekEtiket}>Ödenecek</Text>
                  <Text style={styles.odenecekTutar}>{paraBicimle(odenecekTutar)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.siparisButon}
                onPress={() => navigation.navigate('AdresSec', { siparisAkisi: true })}
              >
                <Text style={styles.siparisYazi}>Sipariş Ver</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
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
  baslik: {
    fontSize: 24,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  liste: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  bosYazi: {
    fontSize: 16,
    color: renkler.yaziGri,
    marginTop: 12,
    textAlign: 'center',
  },


  /* ---------- ALT PANEL ---------- */

  altPanel: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },


  /* ---------- OTOMATİK KALDIRMA UYARISI ---------- */

  uyariKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: renkler.acikKart,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: renkler.uyari,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  uyariYazi: {
    flex: 1,
    fontSize: 12,
    color: renkler.yaziOrta,
    lineHeight: 17,
  },


  /* ---------- KUPON GİRİŞİ ---------- */

  kuponSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kuponInputSarmal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: renkler.arkaPlan,
  },
  kuponInput: {
    flex: 1,
    fontSize: 15,
    color: renkler.yaziKoyu,
    /* Android'de TextInput varsayılan iç boşluk ekler,
       sıfırlamazsak metin dikeyde ortalanmaz */
    padding: 0,
  },
  kuponButon: {
    backgroundColor: renkler.anaRenk,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 88,
  },
  kuponButonPasif: {
    opacity: 0.5,
  },
  kuponButonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 15,
    fontWeight: 'bold',
  },


  /* ---------- UYGULANMIŞ KUPON KARTI ---------- */

  kuponKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: renkler.acikKart,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: renkler.basari,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  kuponKartOrta: {
    flex: 1,
  },
  kuponKod: {
    fontSize: 15,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
    /* Kodlar karakter karakter okunur — eşit genişlikli font
       "1" ile "l", "0" ile "O" ayrımını kolaylaştırır */
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    letterSpacing: 0.5,
  },
  kuponAciklama: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginTop: 2,
  },
  kuponKaldirButon: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  kuponKaldirYazi: {
    fontSize: 13,
    fontWeight: '600',
    color: renkler.hata,
  },

  kuponMesaj: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },


  /* ---------- ÖZET ---------- */

  ozet: {
    marginTop: 14,
  },
  ozetSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ozetEtiket: {
    fontSize: 14,
    color: renkler.yaziOrta,
  },
  ozetDeger: {
    fontSize: 14,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  ayirac: {
    height: 1,
    backgroundColor: renkler.kenarlik,
    marginVertical: 8,
  },
  odenecekEtiket: {
    fontSize: 15,
    fontWeight: 'bold',
    color: renkler.yaziKoyu,
  },
  odenecekTutar: {
    fontSize: 22,
    fontWeight: 'bold',
    color: renkler.anaRenk,
  },


  /* ---------- SİPARİŞ BUTONU ---------- */

  siparisButon: {
    backgroundColor: renkler.anaRenk,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  siparisYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
});