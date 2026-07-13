import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SepetEkrani from '../screens/SepetEkrani';
import AdresSecEkrani from '../screens/AdresSecEkrani';
import KartSecEkrani from '../screens/KartSecEkrani';
import SiparisOnayEkrani from '../screens/SiparisOnayEkrani';
import SiparisBasariliEkrani from '../screens/SiparisBasariliEkrani';

const Stack = createNativeStackNavigator();

export default function SepetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SepetMain" component={SepetEkrani} />
      <Stack.Screen name="AdresSec" component={AdresSecEkrani} />
      <Stack.Screen name="KartSec" component={KartSecEkrani} />
      <Stack.Screen name="SiparisOnay" component={SiparisOnayEkrani} />
      <Stack.Screen name="SiparisBasarili" component={SiparisBasariliEkrani} />
    </Stack.Navigator>
  );
}