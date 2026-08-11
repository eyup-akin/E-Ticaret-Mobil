import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import AnaSayfaStack from './AnaSayfaStack';
import FavorilerimEkrani from '../screens/FavorilerimEkrani';
import SepetStack from './SepetStack';
import HesabimStack from './HesabimStack';
import SepetIkonu from '../components/SepetIkonu';

import FavoriIkonu from '../components/FavoriIkonu';

const Tab = createBottomTabNavigator();

/* ⭐ YENİ (GV/Faz 6.9 · G3) — ÖDEME AKIŞINDA SEKME ÇUBUĞU GİZLENİYOR.
 *
 * Adres seç → Kart seç → Onay → Başarılı: bunlar sekme kökü değil,
 * bir akışın adımları. Altlarında sekme çubuğu dururken müşteri
 * ödemenin ortasında "Favorilerim"e atlayabiliyordu ve akış sessizce
 * yarıda kalıyordu.
 *
 * ⚠️ `tabBarStyle`'ı stack ekranının kendi options'ına yazmak
 * ÇALIŞMIYOR: sekme çubuğu stack'in değil, sekme navigatörünün
 * çocuğu. Karar burada, sekme seviyesinde verilmek zorunda.
 *
 * ⚠️ `getFocusedRouteNameFromRoute` ilk açılışta undefined döner
 * (stack henüz bir ekran adı yazmamıştır). O yüzden liste "gizlenecek
 * ekranlar" üzerinden kuruluyor, "gösterilecekler" üzerinden değil:
 * undefined listede olmadığı için çubuk görünür kalıyor. Ters
 * yazsaydık uygulama sepet sekmesini çubuksuz açardı.
 */
const CUBUK_GIZLENEN_EKRANLAR = [
  'AdresSec',
  'KartSec',
  'SiparisOnay',
  'SiparisBasarili',
];

export default function MainTabNavigator() {
  const { renkler } = useTema();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // ⚠️ LACİVERT ÇUBUK DENENDİ VE GERİ ALINDI (2026-08-10).
        //
        // Açık temada sekme çubuğu `lacivertYuzey` ile koyu yapıldı,
        // ekranda görüldü ve beğenilmedi: ferah, kırık-beyaz bir
        // sayfanın altına oturan koyu blok, ekranı ikiye bölüyor ve
        // uygulamanın hafif hissini bozuyordu.
        //
        // Kayda geçiyor ki aynı fikir altı ay sonra "bir denesek mi"
        // diye geri gelmesin: denendi, olmadı.
        //
        // ⚠️ `kartArka` iki temada da doğru cevabı veriyor — açık
        // temada beyaz, koyu temada zaten lacivert (#182a54). Yani
        // koyu temadaki lacivert çubuk duruyor; kaybettiğimiz tek
        // şey açık temadaki koyu şerit.
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
      <Tab.Screen
        name="Sepet"
        component={SepetStack}
        options={({ route }) => {
          const ekran = getFocusedRouteNameFromRoute(route);

          return {
            title: 'Sepetim',
            tabBarStyle: CUBUK_GIZLENEN_EKRANLAR.includes(ekran)
              ? { display: 'none' }
              : {
                  backgroundColor: renkler.kartArka,
                  borderTopColor: renkler.kenarlik,
                },
          };
        }}
      />
      <Tab.Screen name="Hesabim" component={HesabimStack} options={{ title: 'Hesabım' }} />
    </Tab.Navigator>
  );
}