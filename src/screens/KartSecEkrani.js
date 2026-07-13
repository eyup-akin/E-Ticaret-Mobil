import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiGet, apiPost, apiDelete } from '../services/api';
import { useTema } from '../context/TemaContext';
import { tarihFormatla, tarihiParcala, numaraFormatla, numarayiTemizle } from '../services/kartYardimci';

export default function KartSecEkrani({ route, navigation }) {
  // adresId varsa SİPARİŞ AKIŞINDAYIZ (seçim modu)
  // yoksa HESABIM'dan geldik (yönetim modu)
  const adresId = route.params?.adresId;
  const secimModu = adresId !== undefined;

  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [kartlar, setKartlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliId, setSeciliId] = useState(null);

  // Yeni kart formu
  const [formAcik, setFormAcik] = useState(false);
  const [sahip, setSahip] = useState('');
  const [numara, setNumara] = useState('');
  const [tarih, setTarih] = useState('');     // "05/31" formatında
  const [cvv, setCvv] = useState('');
  const [kaydediliyor, setKaydediliyor] = useState(false);

  async function kartlariGetir() {
    try {
      const veri = await apiGet('/cards');
      setKartlar(veri);
      if (secimModu && veri.length === 1) setSeciliId(veri[0].id);
    } catch (hata) {
      console.log('Kartlar alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      kartlariGetir();
    }, [])
  );

  async function kartEkle() {
    const temizNumara = numarayiTemizle(numara);
    const tarihBilgi = tarihiParcala(tarih);

    if (!sahip || !temizNumara || !tarih || !cvv) {
      Alert.alert('Eksik bilgi', 'Tüm alanları doldur.');
      return;
    }
    if (temizNumara.length !== 16) {
      Alert.alert('Geçersiz kart', 'Kart numarası 16 haneli olmalı.');
      return;
    }
    if (!tarihBilgi) {
      Alert.alert('Geçersiz tarih', 'Son kullanma tarihini AA/YY şeklinde gir (örnek: 05/31).');
      return;
    }

    try {
      setKaydediliyor(true);
      await apiPost('/cards', {
        cardHolderName: sahip,
        cardNumber: temizNumara,        // backend SADECE son 4 haneyi saklar
        expiryMonth: tarihBilgi.ay,
        expiryYear: tarihBilgi.yil,
        cvv: cvv,                       // backend ASLA saklamaz
      });

      // Formu temizle — hassas veri hafızada kalmasın
      setSahip('');
      setNumara('');
      setTarih('');
      setCvv('');
      setFormAcik(false);
      await kartlariGetir();
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setKaydediliyor(false);
    }
  }

  function kartSil(item) {
    Alert.alert(
      'Kartı sil',
      `**** ${item.last4Digits} numaralı kart silinsin mi?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDelete('/cards/' + item.id);
              await kartlariGetir();
            } catch (hata) {
              Alert.alert('Hata', hata.message);
            }
          },
        },
      ]
    );
  }

  function devamEt() {
    if (!seciliId) {
      Alert.alert('Kart seç', 'Devam etmek için bir kart seçmelisin.');
      return;
    }
    navigation.navigate('SiparisOnay', { adresId: adresId, kartId: seciliId });
  }

  function kartSatiri({ item }) {
    const secili = seciliId === item.id;
    return (
      <TouchableOpacity
        style={[styles.satir, secimModu && secili && styles.satirSecili]}
        onPress={() => secimModu && setSeciliId(item.id)}
        activeOpacity={secimModu ? 0.8 : 1}
      >
        {secimModu && (
          <Ionicons
            name={secili ? 'radio-button-on' : 'radio-button-off'}
            size={22}
            color={secili ? renkler.anaRenk : renkler.yaziGri}
          />
        )}

        <View style={[styles.satirIcerik, !secimModu && { marginLeft: 0 }]}>
          <Text style={styles.kartNumara}>**** **** **** {item.last4Digits}</Text>
          <Text style={styles.kartSahip}>{item.cardHolderName}</Text>
          <Text style={styles.kartBilgi}>
            {item.cardType} · {String(item.expiryMonth).padStart(2, '0')}/{String(item.expiryYear).slice(-2)}
          </Text>
        </View>

        {/* Yönetim modunda silme butonu */}
        {!secimModu && (
          <TouchableOpacity onPress={() => kartSil(item)} style={styles.silButon}>
            <Ionicons name="trash-outline" size={22} color={renkler.yaziGri} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
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
      <View style={styles.ustBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.geriButon}>
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>
          {secimModu ? 'Ödeme Yöntemi' : 'Kartlarım'}
        </Text>
      </View>

      {secimModu && <Text style={styles.adimYazi}>2 / 3 — Kart seç</Text>}

      <ScrollView contentContainerStyle={styles.icerik}>
        <FlatList
          data={kartlar}
          keyExtractor={(item) => item.id.toString()}
          renderItem={kartSatiri}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.bosYazi}>Henüz kartın yok. Aşağıdan ekleyebilirsin.</Text>
          }
        />

        {formAcik ? (
          <View style={styles.form}>
            <Text style={styles.formBaslik}>Yeni Kart</Text>

            <TextInput
              style={styles.input}
              placeholder="Kart üzerindeki isim"
              placeholderTextColor={renkler.yaziGri}
              value={sahip}
              onChangeText={setSahip}
              autoCapitalize="characters"
            />

            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={renkler.yaziGri}
              value={numara}
              onChangeText={(metin) => setNumara(numaraFormatla(metin))}
              keyboardType="number-pad"
              maxLength={19}   // 16 rakam + 3 boşluk
            />

            <View style={styles.satirForm}>
              <TextInput
                style={[styles.input, styles.inputYarim]}
                placeholder="AA/YY"
                placeholderTextColor={renkler.yaziGri}
                value={tarih}
                onChangeText={(metin) => setTarih(tarihFormatla(metin))}
                keyboardType="number-pad"
                maxLength={5}   // "05/31"
              />
              <TextInput
                style={[styles.input, styles.inputYarim, { marginRight: 0 }]}
                placeholder="CVV"
                placeholderTextColor={renkler.yaziGri}
                value={cvv}
                onChangeText={(metin) => setCvv(metin.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={3}
                secureTextEntry
              />
            </View>

            <Text style={styles.guvenlikNot}>
              Kart numaran ve CVV'n saklanmaz — sadece son 4 hane kaydedilir.
            </Text>

            <View style={styles.formButonlar}>
              <TouchableOpacity style={styles.iptalButon} onPress={() => setFormAcik(false)}>
                <Text style={styles.iptalYazi}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.kaydetButon} onPress={kartEkle} disabled={kaydediliyor}>
                {kaydediliyor
                  ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
                  : <Text style={styles.kaydetYazi}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.ekleButon} onPress={() => setFormAcik(true)}>
            <Ionicons name="add" size={20} color={renkler.anaRenk} />
            <Text style={styles.ekleYazi}>Yeni kart ekle</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Devam butonu SADECE seçim modunda */}
      {secimModu && (
        <View style={styles.altBar}>
          <TouchableOpacity
            style={[styles.devamButon, !seciliId && styles.devamButonPasif]}
            onPress={devamEt}
            disabled={!seciliId}
          >
            <Text style={styles.devamYazi}>Devam Et</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: renkler.arkaPlan,
  },
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
  },
  geriButon: {
    marginRight: 12,
  },
  ustBaslik: {
    fontSize: 18,
    fontWeight: '600',
    color: renkler.yaziKoyu,
  },
  adimYazi: {
    fontSize: 13,
    color: renkler.yaziOrta,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  icerik: {
    padding: 12,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renkler.kartArka,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
  },
  satirSecili: {
    borderColor: renkler.anaRenk,
    borderWidth: 2,
  },
  satirIcerik: {
    flex: 1,
    marginLeft: 12,
  },
  kartNumara: {
    fontSize: 16,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 4,
    letterSpacing: 1,
  },
  kartSahip: {
    fontSize: 14,
    color: renkler.yaziOrta,
    marginBottom: 2,
  },
  kartBilgi: {
    fontSize: 13,
    color: renkler.yaziGri,
  },
  silButon: {
    padding: 6,
  },
  bosYazi: {
    fontSize: 15,
    color: renkler.yaziGri,
    textAlign: 'center',
    marginVertical: 20,
  },
  ekleButon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: renkler.anaRenk,
  },
  ekleYazi: {
    fontSize: 15,
    color: renkler.anaRenk,
    fontWeight: '600',
    marginLeft: 6,
  },
  form: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14,
  },
  formBaslik: {
    fontSize: 16,
    fontWeight: '600',
    color: renkler.yaziKoyu,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 15,
    color: renkler.yaziKoyu,
    backgroundColor: renkler.kartArka,
  },
  satirForm: {
    flexDirection: 'row',
  },
  inputYarim: {
    flex: 1,
    marginRight: 10,
  },
  guvenlikNot: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  formButonlar: {
    flexDirection: 'row',
  },
  iptalButon: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    alignItems: 'center',
    marginRight: 10,
  },
  iptalYazi: {
    color: renkler.yaziOrta,
    fontSize: 15,
  },
  kaydetButon: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: renkler.anaRenk,
    alignItems: 'center',
  },
  kaydetYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 15,
    fontWeight: 'bold',
  },
  altBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },
  devamButon: {
    backgroundColor: renkler.anaRenk,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  devamButonPasif: {
    backgroundColor: renkler.pasif,
  },
  devamYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: 16,
    fontWeight: 'bold',
  },
});