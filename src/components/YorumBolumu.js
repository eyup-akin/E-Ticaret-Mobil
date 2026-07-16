import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiGet, apiPost } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { tarihBicimle } from '../utils/bicimlendir';
import Yildizlar from './Yildizlar';

// Ürün detayındaki tüm yorum işleri burada.
// urunId: hangi ürün · onDegisti: yorum eklenince parent ürünü tazelesin (ortalama puan / favori sayısı)
export default function YorumBolumu({ urunId, onDegisti }) {
  const { token } = useAuth();
  const { renkler } = useTema();
  const navigation = useNavigation();
  const styles = stilOlustur(renkler);

  const [yorumlar, setYorumlar] = useState([]);
  const [durum, setDurum] = useState(null);
  const [yeniPuan, setYeniPuan] = useState(0);
  const [yeniYorum, setYeniYorum] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function yorumlariGetir() {
    try {
      const veri = await apiGet('/products/' + urunId + '/reviews');
      setYorumlar(veri);
    } catch {}
  }

  async function durumuGetir() {
    if (!token) { setDurum(null); return; }
    try {
      const veri = await apiGet('/products/' + urunId + '/reviews/durum');
      setDurum(veri);
    } catch { setDurum(null); }
  }

  useEffect(() => { yorumlariGetir(); }, [urunId]);
  useEffect(() => { durumuGetir(); }, [urunId, token]);

  async function yorumGonder() {
    if (yeniPuan < 1) { Alert.alert('Uyarı', 'Lütfen yıldızlara dokunarak bir puan seç.'); return; }
    if (yeniYorum.trim().length === 0) { Alert.alert('Uyarı', 'Lütfen yorumunu yaz.'); return; }
    try {
      setGonderiliyor(true);
      await apiPost('/products/' + urunId + '/reviews', { rating: yeniPuan, comment: yeniYorum.trim() });
      setYeniPuan(0);
      setYeniYorum('');
      await yorumlariGetir();
      await durumuGetir();
      if (onDegisti) onDegisti();   // parent ürünü tazeler → ortalama puan güncellenir
      Alert.alert('Teşekkürler', 'Yorumun eklendi biladerim!');
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  function form() {
    if (!token) {
      return (
        <TouchableOpacity style={styles.girisUyari} onPress={() => navigation.navigate('Giris')}>
          <Text style={styles.girisUyariYazi}>Yorum yapmak için giriş yap</Text>
        </TouchableOpacity>
      );
    }
    if (!durum) return null;
    if (durum.zatenYorumladi) return <Text style={styles.durumNot}>Bu ürüne zaten yorum yaptın. Teşekkürler!</Text>;
    if (!durum.teslimAlindi) {
      return <Text style={styles.durumNot}>Yorum yapabilmek için önce ürünü satın alıp teslim almış olman gerekiyor.</Text>;
    }

    return (
      <View style={styles.form}>
        <Text style={styles.formBaslik}>Puanın</Text>
        <Yildizlar deger={yeniPuan} boyut={32} secilebilir onSec={setYeniPuan} />
        <TextInput
          style={styles.formInput}
          placeholder="Ürün hakkındaki düşüncelerin..."
          placeholderTextColor={renkler.yaziGri}
          value={yeniYorum}
          onChangeText={setYeniYorum}
          multiline
        />
        <TouchableOpacity style={[styles.formButon, gonderiliyor && styles.formButonPasif]} onPress={yorumGonder} disabled={gonderiliyor}>
          {gonderiliyor ? <ActivityIndicator color={renkler.anaRenkUstuYazi} /> : <Text style={styles.formButonYazi}>Yorumu Gönder</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.bolumBaslik}>Değerlendirmeler</Text>
      {form()}
      {yorumlar.length === 0 ? (
        <Text style={styles.yorumYok}>Bu ürüne henüz yorum yapılmamış.</Text>
      ) : (
        yorumlar.map((y) => (
          <View key={y.id} style={styles.yorumKart}>
            <View style={styles.yorumUst}>
              <Text style={styles.yorumKisi}>{y.userName}</Text>
              <Text style={styles.yorumTarih}>{tarihBicimle(y.createdAt)}</Text>
            </View>
            <Yildizlar deger={y.rating} boyut={14} />
            <Text style={styles.yorumMetin}>{y.comment}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  bolumBaslik: { fontSize: 18, fontWeight: 'bold', color: renkler.yaziKoyu, marginBottom: 14 },
  durumNot: { fontSize: 14, color: renkler.yaziOrta, backgroundColor: renkler.acikKart, padding: 12, borderRadius: 10, marginBottom: 16 },
  girisUyari: { backgroundColor: renkler.acikKart, padding: 12, borderRadius: 10, marginBottom: 16, alignItems: 'center' },
  girisUyariYazi: { fontSize: 14, fontWeight: '600', color: renkler.anaRenk },
  form: { backgroundColor: renkler.acikKart, padding: 14, borderRadius: 12, marginBottom: 16 },
  formBaslik: { fontSize: 14, fontWeight: '600', color: renkler.yaziKoyu, marginBottom: 8 },
  formInput: { borderWidth: 1, borderColor: renkler.inputKenar, borderRadius: 8, padding: 10, marginTop: 12, marginBottom: 12, minHeight: 70, textAlignVertical: 'top', color: renkler.yaziKoyu, backgroundColor: renkler.kartArka },
  formButon: { backgroundColor: renkler.anaRenk, height: 46, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  formButonPasif: { backgroundColor: renkler.pasif },
  formButonYazi: { color: renkler.anaRenkUstuYazi, fontSize: 15, fontWeight: 'bold' },
  yorumYok: { fontSize: 14, color: renkler.yaziGri, fontStyle: 'italic' },
  yorumKart: { backgroundColor: renkler.kartArka, borderWidth: 1, borderColor: renkler.kenarlik, borderRadius: 12, padding: 12, marginBottom: 10 },
  yorumUst: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  yorumKisi: { fontSize: 14, fontWeight: '600', color: renkler.yaziKoyu },
  yorumTarih: { fontSize: 12, color: renkler.yaziGri },
  yorumMetin: { fontSize: 14, color: renkler.yaziOrta, marginTop: 6, lineHeight: 20 },
});