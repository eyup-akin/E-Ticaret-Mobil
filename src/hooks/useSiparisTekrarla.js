import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';

import { apiPost } from '../services/api';
import { useSepet } from '../context/SepetContext';
import OnayPenceresi from '../components/OnayPenceresi';

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
//
// ⚠️ NEDEN Alert.alert DEĞİL?
//
// İlk yazımda Alert.alert kullanılmıştı ve cihazda görülünce
// "iğrenç" bulundu — haklı olarak: sistem penceresi uygulamanın
// temasını bilmiyor, koyu temada bile beyaz çıkıyor, butonları
// Android'de BÜYÜK HARFLE ve sistemin mavisiyle çiziyor. Projede bu
// karar zaten verilmiş ve OnayPenceresi'nin başında yazılıydı;
// burada gözden kaçmıştı.
//
// ⚠️ HOOK JSX DÖNDÜRÜYOR (`pencere`). Pencerenin durumu akışın
// parçası — hangi adımda olduğunu hook biliyor. Ekranlara "şu state'i
// tut, şu pencereyi çiz" dedirtseydik aynı üç adım iki ekranda ayrı
// ayrı kurulurdu ve taşımanın anlamı kalmazdı. Ekran yalnızca
// `{pencere}` yazıyor.
export function useSiparisTekrarla() {
  const navigation = useNavigation();

  // Sepeti tazelemek ŞART: tekrarlama sepeti sunucuda değiştiriyor,
  // rozet ve sepet ekranı ondan besleniyor.
  const { sepetiYukle } = useSepet();

  // ⚠️ Butonu kilitlemek için: iki hızlı dokunuş adetleri iki katına
  // çıkarırdı.
  const [islemde, setIslemde] = useState(false);

  // Açık pencere. null = pencere yok.
  //
  //   { tur: 'onay',  siparisId }        → Vazgeç / Sepete ekle
  //   { tur: 'sonuc', mesaj }            → Kapat / Sepete git
  //   { tur: 'bilgi', baslik, mesaj }    → tek buton (Tamam)
  const [pencereDurumu, setPencereDurumu] = useState(null);

  function kapat() {
    setPencereDurumu(null);
  }

  // ⚠️ ÖNCE ONAY SORULUYOR: sepette hâlihazırda ürün olabilir ve bu
  // işlem onların ÜSTÜNE ekliyor. Habersiz büyüyen bir sepet,
  // müşterinin ödeme adımında fark edeceği bir sürprizdir.
  function sor(siparisId) {
    setPencereDurumu({ tur: 'onay', siparisId });
  }

  async function tekrarla(siparisId) {
    // Onay penceresini hemen kapat — istek sürerken açık kalması
    // "basmadım mı?" hissi verirdi. Butonun kendisi zaten kilitli.
    setPencereDurumu(null);

    try {
      setIslemde(true);

      const cevap = await apiPost('/orders/' + siparisId + '/tekrarla', {});

      // ⚠️ Sepet SUNUCUDAN tazeleniyor; adetleri burada hesaplayıp
      // state'e yazsaydık 99 kırpması ve mevcut sepetle birleşme
      // mobilde ikinci kez yazılmış olurdu.
      await sepetiYukle();

      // ⚠️ Mesajı SUNUCU kuruyor (hepsi eklendi / bir kısmı eklendi /
      // hiçbiri eklenemedi). Hiçbiri eklenemediyse sepete gitmek
      // anlamsız — müşteriyi değişmemiş bir ekrana göndermiyoruz,
      // o yüzden tek butonlu bilgi penceresi.
      if (cevap.eklenen === 0) {
        setPencereDurumu({
          tur: 'bilgi',
          baslik: 'Sepete eklenemedi',
          mesaj: cevap.mesaj,
        });
        return;
      }

      setPencereDurumu({ tur: 'sonuc', mesaj: cevap.mesaj });
    } catch (hata) {
      setPencereDurumu({
        tur: 'bilgi',
        baslik: 'Bir sorun oldu',
        mesaj: hata.message,
      });
    } finally {
      setIslemde(false);
    }
  }

  // ---- PENCERE ----
  //
  // ⚠️ Tek bir OnayPenceresi, üç farklı görev. Üç ayrı bileşen
  // çizseydik üçü de aynı anda ağaçta durur ve hangisinin açık olduğu
  // ayrıca yönetilirdi. Props'u duruma göre hesaplamak daha az yer
  // tutuyor ve pencerenin "aynı pencere" olduğunu koruyor.
  const tur = pencereDurumu?.tur;

  const pencere = (
    <OnayPenceresi
      acik={pencereDurumu !== null}
      baslik={
        tur === 'onay' ? 'Siparişi tekrarla'
          : tur === 'sonuc' ? 'Sepete eklendi'
            : pencereDurumu?.baslik ?? ''
      }
      mesaj={
        tur === 'onay'
          ? 'Bu siparişteki ürünler sepetine eklenecek. Sepetindekiler silinmez, üstüne eklenir.'
          : pencereDurumu?.mesaj ?? ''
      }
      ikon={
        tur === 'onay' ? 'repeat'
          : tur === 'sonuc' ? 'cart'
            : 'alert-circle-outline'
      }
      /* 'bilgi' tek butonlu: geri alınacak bir şey yok, işlem
         zaten oldu (ya da olamadı). "Vazgeç" yazan bir buton
         kullanıcıya olmayan bir seçim sunardı. */
      tekButon={tur === 'bilgi'}
      onayYazisi={
        tur === 'onay' ? 'Sepete ekle'
          : tur === 'sonuc' ? 'Sepete git'
            : 'Tamam'
      }
      vazgecYazisi={tur === 'sonuc' ? 'Kapat' : 'Vazgeç'}
      onOnayla={() => {
        if (tur === 'onay') {
          tekrarla(pencereDurumu.siparisId);
          return;
        }

        kapat();

        if (tur === 'sonuc') {
          navigation.navigate('Sepet', { screen: 'SepetMain' });
        }
      }}
      onVazgec={kapat}
    />
  );

  return { sor, islemde, pencere };
}
