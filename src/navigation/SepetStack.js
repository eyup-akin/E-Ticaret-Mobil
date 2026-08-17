import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SepetEkrani from '../screens/SepetEkrani';
import AdresSecEkrani from '../screens/AdresSecEkrani';

// ⭐ YENİ — gerekçe HesabimStack'te: aynı ekranlar iki stack'te de
// kayıtlı olmak zorunda.
import AdresEkleEkrani from '../screens/AdresEkleEkrani';
import NumaralarimEkrani from '../screens/NumaralarimEkrani';   // ⭐ YENİ (4.9)
import SiparisOnayEkrani from '../screens/SiparisOnayEkrani';
import OdemeEkrani from '../screens/OdemeEkrani';               // ⭐ YENİ
import SiparisBasariliEkrani from '../screens/SiparisBasariliEkrani';

const Stack = createNativeStackNavigator();

export default function SepetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SepetMain" component={SepetEkrani} />
      <Stack.Screen name="AdresSec" component={AdresSecEkrani} />

      {/* ⛔ KartSec ve KartEkle BU STACK'TEN KALDIRILDI.
          Kart artık iyzico'nun ödeme sayfasında seçiliyor/ekleniyor;
          sipariş akışında kart seçme adımı yok. Kartlarım ekranı
          yalnızca Hesabım altında (listeleme + silme) kaldı. */}

      <Stack.Screen name="AdresEkle" component={AdresEkleEkrani} />

      {/* ⭐ YENİ (4.9) — adres formundaki "Numaralarımı yönet"
          bağlantısı buraya gidiyor. AdresSec iki stack'te birden
          yaşadığı için ekran İKİSİNE DE kaydedilmek zorunda:
          yalnızca HesabimStack'te kalsaydı sipariş akışında aynı
          bağlantı çalışmaz, uygulama "böyle bir rota yok" diye
          patlardı. */}
      <Stack.Screen name="Numaralarim" component={NumaralarimEkrani} />
      <Stack.Screen name="SiparisOnay" component={SiparisOnayEkrani} />

      {/* ⭐ YENİ — ödeme WebView'i. Siparişlerim ekranından da
          açılıyor, o yüzden HesabimStack'e de kayıtlı. */}
      <Stack.Screen name="OdemeEkrani" component={OdemeEkrani} />

      <Stack.Screen name="SiparisBasarili" component={SiparisBasariliEkrani} />
    </Stack.Navigator>
  );
}
