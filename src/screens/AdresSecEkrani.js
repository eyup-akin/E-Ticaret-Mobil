import React, { useState, useCallback } from 'react';
import { font } from '../theme/olculer';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { apiGet, apiPost, apiDelete } from '../services/api';



export default function AdresSecEkrani({ route, navigation }) {
  // siparisAkisi parametresi varsa SEÇİM modu, yoksa YÖNETİM modu
  const secimModu = route.params?.siparisAkisi === true;
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [adresler, setAdresler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliId, setSeciliId] = useState(null);

  // Yeni adres formu
  const [formAcik, setFormAcik] = useState(false);
  const [baslik, setBaslik] = useState('');
  const [acikAdres, setAcikAdres] = useState('');
  const [sehir, setSehir] = useState('');
  const [telefon, setTelefon] = useState('');      // ⭐ YENİ
  const [kaydediliyor, setKaydediliyor] = useState(false);

  

  async function adresleriGetir() {
    try {
      const veri = await apiGet('/addresses');
      setAdresler(veri);
      // Tek adres varsa otomatik seç
      if (secimModu && veri.length === 1) setSeciliId(veri[0].id);
    } catch (hata) {
      console.log('Adresler alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      adresleriGetir();
    }, [])
  );

  async function adresEkle() {
    if (!baslik || !acikAdres || !sehir || !telefon) {
      Alert.alert('Eksik bilgi', 'Tüm alanları doldur.');
      return;
    }
    try {
      setKaydediliyor(true);
      await apiPost('/addresses', {
        title: baslik,
        fullAddress: acikAdres,
        city: sehir,
        phone: telefon,              // ⭐
      });
      setBaslik('');
      setAcikAdres('');
      setSehir('');
      setTelefon('');                // ⭐
      setFormAcik(false);
      await adresleriGetir();
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setKaydediliyor(false);
    }
  }


  function devamEt() {
    if (!seciliId) {
      Alert.alert('Adres seç', 'Devam etmek için bir teslimat adresi seçmelisin.');
      return;
    }
    navigation.navigate('KartSec', { adresId: seciliId });
  }


  function adresSil(item) {
    Alert.alert(
      'Adresi sil',
      `"${item.title}" adresi silinsin mi?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDelete('/addresses/' + item.id);
              await adresleriGetir();
            } catch (hata) {
              Alert.alert('Hata', hata.message);
            }
          },
        },
      ]
    );
  }


  function adresSatiri({ item }) {
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
          <Text style={styles.adresBaslik}>{item.title}</Text>
          <Text style={styles.adresMetin}>{item.fullAddress}</Text>
          <Text style={styles.adresSehir}>{item.city}</Text>
          {item.phone && (
            <Text style={styles.adresTelefon}>{item.phone}</Text>
          )}
        </View>

        {!secimModu && (
          <TouchableOpacity onPress={() => adresSil(item)} style={styles.silButon}>
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
          {secimModu ? 'Teslimat Adresi' : 'Adreslerim'}
        </Text>
      </View>

      {/* Adım göstergesi */}
      {secimModu && <Text style={styles.adimYazi}>1 / 3 — Adres seç</Text>}

      <ScrollView contentContainerStyle={styles.icerik}>
        <FlatList
          data={adresler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={adresSatiri}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.bosYazi}>Henüz adresin yok. Aşağıdan ekleyebilirsin.</Text>
          }
        />

        {/* Yeni adres ekleme */}
        {formAcik ? (
          <View style={styles.form}>
            <Text style={styles.formBaslik}>Yeni Adres</Text>

            <TextInput
              style={styles.input}
              placeholder="Başlık (Ev, İş...)"
              placeholderTextColor={renkler.yaziGri}
              value={baslik}
              onChangeText={setBaslik}
            />
            <TextInput
              style={[styles.input, styles.inputCok]}
              placeholder="Açık adres"
              placeholderTextColor={renkler.yaziGri}
              value={acikAdres}
              onChangeText={setAcikAdres}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Şehir"
              placeholderTextColor={renkler.yaziGri}
              value={sehir}
              onChangeText={setSehir}
            />

            <TextInput
              style={styles.input}
              placeholder="Telefon (örn: 0532 123 45 67)"
              placeholderTextColor={renkler.yaziGri}
              value={telefon}
              onChangeText={setTelefon}
              keyboardType="phone-pad"
              maxLength={20}
            />

            <View style={styles.formButonlar}>
              <TouchableOpacity style={styles.iptalButon} onPress={() => setFormAcik(false)}>
                <Text style={styles.iptalYazi}>Vazgeç</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.kaydetButon} onPress={adresEkle} disabled={kaydediliyor}>
                {kaydediliyor
                  ? <ActivityIndicator color={renkler.anaRenkUstuYazi} />
                  : <Text style={styles.kaydetYazi}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.ekleButon} onPress={() => setFormAcik(true)}>
            <Ionicons name="add" size={20} color={renkler.anaRenk} />
            <Text style={styles.ekleYazi}>Yeni adres ekle</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
  adresTelefon: {
    fontSize: 13,
    color: renkler.yaziGri,
    marginTop: 2
  },
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
    fontFamily: font.yari,
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
  silButon: {
    padding: 6,
  },
  satirSecili: {
    borderColor: renkler.anaRenk,
    borderWidth: 2,
  },
  satirIcerik: {
    flex: 1,
    marginLeft: 12,
  },
  adresBaslik: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: 4,
  },
  adresMetin: {
    fontSize: 14,
    color: renkler.yaziOrta,
    marginBottom: 2,
  },
  adresSehir: {
    fontSize: 13,
    color: renkler.yaziGri,
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
    fontFamily: font.yari,
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
    fontFamily: font.yari,
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
  inputCok: {
    height: 80,
    textAlignVertical: 'top',
  },
  formButonlar: {
    flexDirection: 'row',
    marginTop: 4,
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
    fontFamily: font.kalin,
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
    fontFamily: font.kalin,
  },
});