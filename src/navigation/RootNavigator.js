import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import MainTabNavigator from './MainTabNavigator';
import GirisEkrani from '../screens/GirisEkrani';
import KayitEkrani from '../screens/KayitEkrani';

// Kök seviyede bir yığın (stack) kuruyoruz.
// Uygulamanın kendisi bu yığının EN ALT katmanı olacak.
// Giriş ve Kayıt ekranları onun ÜSTÜNE açılan modal pencereler olacak.
const RootStack = createNativeStackNavigator();

export default function RootNavigator() {
  // ARTIK token'a bakıp dallanmıyoruz!
  // Sadece "açılış kontrolü bitti mi" diye bakıyoruz.
  const { yukleniyor } = useAuth();
  const { renkler, koyuMu, hazir } = useTema();

  // Token VE tema kontrolü bitene kadar bekle
  if (yukleniyor || !hazir) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: renkler.arkaPlan,
        }}
      >
        <ActivityIndicator size="large" color={renkler.anaRenk} />
      </View>
    );
  }

  // Navigasyonun kendi arka planını da temaya bağla (geçişlerde beyaz flaş olmasın)
  const navTema = {
    ...(koyuMu ? DarkTheme : DefaultTheme),
    colors: {
      ...(koyuMu ? DarkTheme : DefaultTheme).colors,
      background: renkler.arkaPlan,
      card: renkler.kartArka,
      text: renkler.yaziKoyu,
      border: renkler.kenarlik,
      primary: renkler.anaRenk,
    },
  };

  return (
    <NavigationContainer theme={navTema}>
      <StatusBar style={koyuMu ? 'light' : 'dark'} />

      <RootStack.Navigator screenOptions={{ headerShown: false }}>

        {/* ---- KATMAN 1: UYGULAMANIN KENDİSİ ---- */}
        {/* Misafir de üye de bunu görür. Artık token kontrolü YOK. */}
        <RootStack.Screen
          name="Ana"
          component={MainTabNavigator}
        />

        {/* ---- KATMAN 2: MODAL PENCERELER ---- */}
        {/* Giriş ve Kayıt artık "duvar" değil, üstten açılan pencere. */}
        <RootStack.Group screenOptions={{ presentation: 'modal' }}>
          <RootStack.Screen
            name="Giris"
            component={GirisEkrani}
          />
          <RootStack.Screen
            name="Kayit"
            component={KayitEkrani}
          />
        </RootStack.Group>

      </RootStack.Navigator>
    </NavigationContainer>
  );
}