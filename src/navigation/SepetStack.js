import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SepetEkrani from '../screens/SepetEkrani';
import AdresSecEkrani from '../screens/AdresSecEkrani';
import KartSecEkrani from '../screens/KartSecEkrani';

// ⭐ YENİ — gerekçe HesabimStack'te: aynı ekranlar iki stack'te de
// kayıtlı olmak zorunda.
import AdresEkleEkrani from '../screens/AdresEkleEkrani';
import KartEkleEkrani from '../screens/KartEkleEkrani';
import NumaralarimEkrani from '../screens/NumaralarimEkrani';   // ⭐ YENİ (4.9)
import SiparisOnayEkrani from '../screens/SiparisOnayEkrani';
import SiparisBasariliEkrani from '../screens/SiparisBasariliEkrani';

const Stack = createNativeStackNavigator();

export default function SepetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SepetMain" component={SepetEkrani} />
      <Stack.Screen name="AdresSec" component={AdresSecEkrani} />
      <Stack.Screen name="KartSec" component={KartSecEkrani} />
      <Stack.Screen name="AdresEkle" component={AdresEkleEkrani} />
      <Stack.Screen name="KartEkle" component={KartEkleEkrani} />

      {/* ⭐ YENİ (4.9) — adres formundaki "Numaralarımı yönet"
          bağlantısı buraya gidiyor. AdresSec iki stack'te birden
          yaşadığı için ekran İKİSİNE DE kaydedilmek zorunda:
          yalnızca HesabimStack'te kalsaydı sipariş akışında aynı
          bağlantı çalışmaz, uygulama "böyle bir rota yok" diye
          patlardı. */}
      <Stack.Screen name="Numaralarim" component={NumaralarimEkrani} />
      <Stack.Screen name="SiparisOnay" component={SiparisOnayEkrani} />
      <Stack.Screen name="SiparisBasarili" component={SiparisBasariliEkrani} />
    </Stack.Navigator>
  );
}