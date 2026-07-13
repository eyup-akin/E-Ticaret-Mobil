import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GirisEkrani from '../screens/GirisEkrani';
import KayitEkrani from '../screens/KayitEkrani';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Giris" component={GirisEkrani} />
      <Stack.Screen name="Kayit" component={KayitEkrani} />
    </Stack.Navigator>
  );
}
