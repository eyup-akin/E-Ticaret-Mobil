import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

export default function RootNavigator() {
  const { token, yukleniyor } = useAuth();
  const { renkler, koyuMu, hazir } = useTema();

  // Token VE tema kontrolü bitene kadar bekle
  if (yukleniyor || !hazir) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: renkler.arkaPlan }}>
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
      {token ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}