import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AnaSayfaEkrani from '../screens/AnaSayfaEkrani';
import UrunDetayEkrani from '../screens/UrunDetayEkrani';
import KampanyaDetayEkrani from '../screens/KampanyaDetayEkrani';
import KategorilerEkrani from '../screens/KategorilerEkrani';
import KategoriUrunleriEkrani from '../screens/KategoriUrunleriEkrani';
import HizliSiparislerimEkrani from '../screens/HizliSiparislerimEkrani';   // ⭐ YENİ

const Stack = createNativeStackNavigator();

export default function AnaSayfaStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AnaSayfaMain" component={AnaSayfaEkrani} />
      <Stack.Screen name="Kategoriler" component={KategorilerEkrani} />
      <Stack.Screen name="KategoriUrunleri" component={KategoriUrunleriEkrani} />
      <Stack.Screen name="UrunDetay" component={UrunDetayEkrani} />
      <Stack.Screen name="KampanyaDetay" component={KampanyaDetayEkrani} />

      {/* ⭐ YENİ — Hızlı Siparişlerim.
          ⚠️ Hesabım yığınında DEĞİL, burada: tek giriş noktası ana
          sayfadaki yüzen buton. Hesabım'a koysaydık oradan da bir
          menü satırı açmak gerekirdi ve aynı ekrana iki kapı olurdu. */}
      <Stack.Screen name="HizliSiparislerim" component={HizliSiparislerimEkrani} />
    </Stack.Navigator>
  );
}