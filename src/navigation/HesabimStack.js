import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HesabimEkrani from '../screens/HesabimEkrani';
import SiparislerimEkrani from '../screens/SiparislerimEkrani';
import SiparisDetayEkrani from '../screens/SiparisDetayEkrani';
import AdresSecEkrani from '../screens/AdresSecEkrani';
import KartSecEkrani from '../screens/KartSecEkrani';
import OdemelerimEkrani from '../screens/OdemelerimEkrani';

const Stack = createNativeStackNavigator();

export default function HesabimStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HesabimMain" component={HesabimEkrani} />
      <Stack.Screen name="Siparislerim" component={SiparislerimEkrani} />
      <Stack.Screen name="SiparisDetay" component={SiparisDetayEkrani} />
      <Stack.Screen name="Adreslerim" component={AdresSecEkrani} />
      <Stack.Screen name="Kartlarim" component={KartSecEkrani} />
      <Stack.Screen name="Odemelerim" component={OdemelerimEkrani} />
    </Stack.Navigator>
  );
}