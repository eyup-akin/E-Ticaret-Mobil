import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TemaProvider } from './src/context/TemaContext';
import { AuthProvider } from './src/context/AuthContext';
import { FavoriteProvider } from './src/context/FavoriteContext';
import { SepetProvider } from './src/context/SepetContext';
// ⭐ YENİ — mağaza ayarları (sepet üst sınırı vb.)
import { AyarlarProvider } from './src/context/AyarlarContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <TemaProvider>
        {/* ⭐ AyarlarProvider, AuthProvider'ın DIŞINDA.

            Ayarlar ucu herkese açık — giriş yapılmasını beklemesine
            gerek yok. İçeri koysaydık misafir kullanıcı sepet üst
            sınırını hiç öğrenemezdi. */}
        <AyarlarProvider>
          <AuthProvider>
            <FavoriteProvider>
              <SepetProvider>
                <RootNavigator />
              </SepetProvider>
            </FavoriteProvider>
          </AuthProvider>
        </AyarlarProvider>
      </TemaProvider>
    </SafeAreaProvider>
  );
}