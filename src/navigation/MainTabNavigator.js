import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import AnaSayfaStack from './AnaSayfaStack';
import FavorilerimEkrani from '../screens/FavorilerimEkrani';
import SepetStack from './SepetStack';
import HesabimStack from './HesabimStack';
import SepetIkonu from '../components/SepetIkonu';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const { renkler } = useTema();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: renkler.anaRenk,
        tabBarInactiveTintColor: renkler.yaziGri,
        tabBarStyle: {
          backgroundColor: renkler.kartArka,
          borderTopColor: renkler.kenarlik,
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Sepet') {
            return <SepetIkonu color={color} size={size} />;
          }

          let ikon;
          if (route.name === 'AnaSayfa') ikon = 'home';
          else if (route.name === 'Favoriler') ikon = 'heart';
          else if (route.name === 'Hesabim') ikon = 'person';
          return <Ionicons name={ikon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="AnaSayfa" component={AnaSayfaStack} options={{ title: 'Ana Sayfa' }} />
      <Tab.Screen name="Favoriler" component={FavorilerimEkrani} options={{ title: 'Favorilerim' }} />
      <Tab.Screen name="Sepet" component={SepetStack} options={{ title: 'Sepetim' }} />
      <Tab.Screen name="Hesabim" component={HesabimStack} options={{ title: 'Hesabım' }} />
    </Tab.Navigator>
  );
}