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
        // ⭐ DEĞİŞTİ (GV/Faz 2.10) — SEKME ÇUBUĞU ARTIK LACİVERT.
        //
        // Eskiden kart zemini (açık temada beyaz) kullanıyordu ve
        // çubuk sayfadan ayrılmıyordu. Açık temada lacivert bir
        // çubuk, uygulamanın marka renginin ekranda GÖRÜNMESİNİ
        // sağlayan tek yer — lacivert şu ana kadar yalnızca metin
        // rengiydi ve gözle fark edilmiyordu.
        //
        // ⚠️ Renk kartArka'dan DEĞİL lacivertYuzey'den geliyor.
        // "Açık temada koyu kalan yüzey" ayrı bir rol; kartArka'yı
        // koyultsaydık uygulamadaki bütün kartlar da kararırdı.
        //
        // ⚠️ Pasif renk de ayrı token. yaziGri açık zemin için
        // seçilmişti ve lacivert çubuk üstünde ~2,2:1 veriyor —
        // pasif sekmeler okunmaz olurdu.
        //
        // ⚠️ Aktif renk turuncu kalıyor: sekme seçimi bir EYLEM
        // sonucudur ve turuncu bu uygulamada eylemin rengi. Lacivert
        // zemin üstünde turuncu ayrıca çok net ayrışıyor.
        tabBarActiveTintColor: renkler.anaRenk,
        tabBarInactiveTintColor: renkler.lacivertYuzeyPasif,
        tabBarStyle: {
          backgroundColor: renkler.lacivertYuzey,

          // Koyu çubukta açık bir çizgi ayrım yaratmaz; kenarlığı
          // çubuğun kendi renginde bırakıp görünmez kılıyoruz.
          borderTopColor: renkler.lacivertYuzey,
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