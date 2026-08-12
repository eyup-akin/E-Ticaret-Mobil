import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HesabimEkrani from '../screens/HesabimEkrani';
import SiparislerimEkrani from '../screens/SiparislerimEkrani';
import SiparisDetayEkrani from '../screens/SiparisDetayEkrani';
import AdresSecEkrani from '../screens/AdresSecEkrani';
import KartSecEkrani from '../screens/KartSecEkrani';
import NumaralarimEkrani from '../screens/NumaralarimEkrani';   // ⭐ YENİ (4.9)
import OdemelerimEkrani from '../screens/OdemelerimEkrani';

import ProfilDuzenleEkrani from '../screens/ProfilDuzenleEkrani';   // ⭐ YENİ
import SifreDegistirEkrani from '../screens/SifreDegistirEkrani';   // ⭐ YENİ

import HesapKapatEkrani from '../screens/HesapKapatEkrani';         // ⭐ YENİ

import OturumlarimEkrani from '../screens/OturumlarimEkrani';       // ⭐ YENİ

const Stack = createNativeStackNavigator();

export default function HesabimStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HesabimMain" component={HesabimEkrani} />
      <Stack.Screen name="Siparislerim" component={SiparislerimEkrani} />
      <Stack.Screen name="SiparisDetay" component={SiparisDetayEkrani} />
      <Stack.Screen name="Adreslerim" component={AdresSecEkrani} />
      <Stack.Screen name="Kartlarim" component={KartSecEkrani} />
      <Stack.Screen name="Numaralarim" component={NumaralarimEkrani} />{/* ⭐ YENİ (4.9) */}
      <Stack.Screen name="Odemelerim" component={OdemelerimEkrani} />

      {/* ⭐ YENİ — Aşama 6 hesap yönetimi ekranları.
          HesabimStack içinde olmaları önemli: geri tuşu doğal olarak
          Hesabım ekranına dönüyor, ayrıca alt sekme çubuğu kaybolmuyor. */}
      <Stack.Screen name="ProfilDuzenle" component={ProfilDuzenleEkrani} />
      <Stack.Screen name="SifreDegistir" component={SifreDegistirEkrani} />

      <Stack.Screen name="HesapKapat" component={HesapKapatEkrani} /> 

      <Stack.Screen name="Oturumlarim" component={OturumlarimEkrani} />
      
    </Stack.Navigator>
  );
}