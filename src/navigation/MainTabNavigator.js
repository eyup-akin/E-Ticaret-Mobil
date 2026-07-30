import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import AnaSayfaStack from './AnaSayfaStack';
import FavorilerimEkrani from '../screens/FavorilerimEkrani';
import SepetStack from './SepetStack';
import HesabimStack from './HesabimStack';
import SepetIkonu from '../components/SepetIkonu';

import FavoriIkonu from '../components/FavoriIkonu';

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
          // Rozetli sekmeler kendi bileşenlerini kullanıyor.
          //
          // Neden burada useSepet/useFavorite çağırmıyoruz?
          //   Çağırsaydık, sepete bir ürün eklendiğinde TÜM sekme
          //   çubuğu yeniden çizilirdi. Şu anki yapıda sadece ilgili
          //   küçük ikon çiziliyor.
          //
          //   Kural: veriyi kullanan bileşen mümkün olduğunca yaprakta
          //   (ağacın ucunda) dursun; yukarı taşırsan yeniden çizim
          //   alanı büyür.
          if (route.name === 'Sepet') {
            return <SepetIkonu color={color} size={size} />;
          }

          if (route.name === 'Favoriler') {
            return <FavoriIkonu color={color} size={size} />;
          }

          // Rozetsiz sade sekmeler
          let ikon;
          if (route.name === 'AnaSayfa') ikon = 'home';
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