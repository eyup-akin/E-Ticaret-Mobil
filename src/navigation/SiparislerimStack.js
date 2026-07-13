import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SiparislerimEkrani from '../screens/SiparislerimEkrani';
import SiparisDetayEkrani from '../screens/SiparisDetayEkrani';

const Stack = createNativeStackNavigator();

export default function SiparislerimStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SiparislerimMain" component={SiparislerimEkrani} />
      <Stack.Screen name="SiparisDetay" component={SiparisDetayEkrani} />
    </Stack.Navigator>
  );
}