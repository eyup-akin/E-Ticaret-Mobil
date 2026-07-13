import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TemaProvider } from './src/context/TemaContext';
import { AuthProvider } from './src/context/AuthContext';
import { FavoriteProvider } from './src/context/FavoriteContext';
import { SepetProvider } from './src/context/SepetContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <TemaProvider>
        <AuthProvider>
          <FavoriteProvider>
            <SepetProvider>
              <RootNavigator />
            </SepetProvider>
          </FavoriteProvider>
        </AuthProvider>
      </TemaProvider>
    </SafeAreaProvider>
  );
}