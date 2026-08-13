import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { apiPost } from '../services/api';
import { useSepet } from '../context/SepetContext';

// ⭐ YENİ — "SİPARİŞİ TEKRARLA" AKIŞI, TEK YERDE
//
// ⚠️ NEDEN ORTAK YERE TAŞINDI?
//
// Akış SiparisDetayEkrani'nın içinde yazılıydı ve tek tüketicisi
// vardı. "Hızlı Siparişlerim" ekranı ikinci tüketici oldu.
//
// Kopyalasaydık ayrışacak yer belliydi ve sessiz olurdu:
//   • Onay metni — biri "sepetindekiler silinmez" der, diğeri demez
//   • sepetiYukle() — biri çağırmayı unutur, sepet rozeti bayat kalır
//   • eklenen === 0 dalı — biri müşteriyi değişmemiş sepete gönderir
// Üçü de patlamayan, yalnızca yanlış davranan hatalar.
//
// ⚠️ Bu bir HOOK, düz fonksiyon değil: sepet bağlamına ve gezinmeye
// ihtiyacı var, ikisi de yalnızca bileşen içinden okunabiliyor.
//
// ⚠️ SEPETE NE EKLENECEĞİNE SUNUCU KARAR VERİYOR.
//
// Kalemleri burada tek tek /cart'a yollamak da mümkündü ama o zaman
// "hangi ürün artık satışta değil" kuralı mobile taşınır ve satırlar
// arasında kısmi başarı yönetmek gerekirdi. Tek istek, tek cevap,
// tek mesaj.
export function useSiparisTekrarla() {
  const navigation = useNavigation();

  // Sepeti tazelemek ŞART: tekrarlama sepeti sunucuda değiştiriyor,
  // rozet ve sepet ekranı ondan besleniyor.
  const { sepetiYukle } = useSepet();

  // ⚠️ Butonu kilitlemek için: iki hızlı dokunuş adetleri iki katına
  // çıkarırdı.
  const [islemde, setIslemde] = useState(false);

  // ⚠️ ÖNCE ONAY SORULUYOR: sepette hâlihazırda ürün olabilir ve bu
  // işlem onların ÜSTÜNE ekliyor. Habersiz büyüyen bir sepet,
  // müşterinin ödeme adımında fark edeceği bir sürprizdir.
  function sor(siparisId) {
    Alert.alert(
      'Siparişi tekrarla',
      'Bu siparişteki ürünler sepetine eklenecek. Sepetindekiler silinmez, ' +
      'üstüne eklenir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sepete ekle', onPress: () => tekrarla(siparisId) },
      ]
    );
  }

  async function tekrarla(siparisId) {
    try {
      setIslemde(true);

      const cevap = await apiPost('/orders/' + siparisId + '/tekrarla', {});

      // ⚠️ Sepet SUNUCUDAN tazeleniyor; adetleri burada hesaplayıp
      // state'e yazsaydık 99 kırpması ve mevcut sepetle birleşme
      // mobilde ikinci kez yazılmış olurdu.
      await sepetiYukle();

      // ⚠️ Mesajı SUNUCU kuruyor (hepsi eklendi / bir kısmı eklendi /
      // hiçbiri eklenemedi). Hiçbiri eklenemediyse sepete gitmek
      // anlamsız — müşteriyi değişmemiş bir ekrana göndermiyoruz.
      if (cevap.eklenen === 0) {
        Alert.alert('Sepete eklenemedi', cevap.mesaj);
        return;
      }

      Alert.alert('Sepete eklendi', cevap.mesaj, [
        { text: 'Kapat', style: 'cancel' },
        {
          text: 'Sepete git',
          onPress: () => navigation.navigate('Sepet', { screen: 'SepetMain' }),
        },
      ]);
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setIslemde(false);
    }
  }

  return { sor, islemde };
}
