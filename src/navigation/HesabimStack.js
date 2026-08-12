import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HesabimEkrani from '../screens/HesabimEkrani';
import SiparislerimEkrani from '../screens/SiparislerimEkrani';
import SiparisDetayEkrani from '../screens/SiparisDetayEkrani';
import AdresSecEkrani from '../screens/AdresSecEkrani';
import KartSecEkrani from '../screens/KartSecEkrani';
import NumaralarimEkrani from '../screens/NumaralarimEkrani';   // ⭐ YENİ (4.9)

// ⭐ YENİ (Aşama 8.4) — destek ekranları
import DestekTalepleriEkrani from '../screens/DestekTalepleriEkrani';
import YeniTalepEkrani from '../screens/YeniTalepEkrani';
import TalepDetayEkrani from '../screens/TalepDetayEkrani';

// ⭐ YENİ (Aşama 9.4) — iade ekranları
import IadelerimEkrani from '../screens/IadelerimEkrani';
import IadeTalepEkrani from '../screens/IadeTalepEkrani';

// ⭐ YENİ (Aşama 10)
import VerilerimiIndirEkrani from '../screens/VerilerimiIndirEkrani';
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

      {/* ⭐ YENİ (Aşama 8.4) — DESTEK EKRANLARI
          ⚠️ Yol haritası ayrı bir `DestekStack.js` diyordu; yazılmadı.
          Bu uygulamada stack'ler SEKME başına kuruluyor (AnaSayfa,
          Sepet, Hesabım) ve destek bir sekme değil. Sekmesiz bir
          stack hiçbir yere bağlanamaz, yani ölü dosya olurdu.
          Ekranlar Hesabım stack'inde: geri tuşu doğal olarak Hesabım'a
          dönüyor, alt sekme çubuğu kaybolmuyor ve sipariş detayından
          açılan "talep aç" kısayolu da aynı stack'te olduğu için
          çalışıyor. */}
      <Stack.Screen name="Destek" component={DestekTalepleriEkrani} />
      <Stack.Screen name="YeniTalep" component={YeniTalepEkrani} />
      <Stack.Screen name="TalepDetay" component={TalepDetayEkrani} />

      <Stack.Screen name="Iadelerim" component={IadelerimEkrani} />
      <Stack.Screen name="IadeTalep" component={IadeTalepEkrani} />
      <Stack.Screen name="VerilerimiIndir" component={VerilerimiIndirEkrani} />
      
    </Stack.Navigator>
  );
}