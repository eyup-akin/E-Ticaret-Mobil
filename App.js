import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { TemaProvider } from './src/context/TemaContext';
import { AuthProvider } from './src/context/AuthContext';
import { FavoriteProvider } from './src/context/FavoriteContext';
import { SepetProvider } from './src/context/SepetContext';
// ⭐ YENİ — mağaza ayarları (sepet üst sınırı vb.)
import { AyarlarProvider } from './src/context/AyarlarContext';
import RootNavigator from './src/navigation/RootNavigator';

// ⭐ YENİ (GV/Faz 1) — AÇILIŞ EKRANI FONTLARI BEKLESİN
//
// ⚠️ Bu çağrı bileşenin DIŞINDA, modül seviyesinde. İçeride
// olsaydı ilk render'dan sonra çalışırdı ve açılış ekranı o ana
// kadar zaten kapanmış olurdu.
//
// Hatayı yutuyoruz: açılış ekranı zaten kapanmışsa bu çağrı
// reddediliyor ve o durum bir sorun değil — uygulamanın açılmasını
// engellememeli.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  // ⚠️ NEDEN FONT YÜKLENENE KADAR HİÇBİR ŞEY ÇİZİLMİYOR?
  //
  // Çizseydik uygulama önce sistem fontuyla açılır, ~200 ms sonra
  // fontlar gelince BÜTÜN METİNLER yeniden ölçülür ve yerleşim
  // gözle görülür şekilde zıplardı. Buna "flash of unstyled text"
  // deniyor ve premium bir açılış hissini tek başına bozuyor.
  //
  // Bekleme açılış ekranının arkasında geçtiği için kullanıcı boş
  // ekran değil, logoyu görüyor.
  const [fontlarHazir, fontHatasi] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  // ⚠️ FONT YÜKLENEMEZSE UYGULAMA YİNE AÇILIYOR.
  //
  // Yükleme hatasında da açılış ekranını kapatıyoruz. Aksi halde
  // bir font dosyası bozuk diye tüm uygulama sonsuza kadar açılış
  // ekranında kilitli kalırdı — yazı tipi, uygulamayı rehin
  // alabilecek kadar önemli değil. O durumda sistem fontuna
  // düşülür: olculer.js'te fontFamily'nin yanında fontWeight'in de
  // verilmesinin sebebi tam olarak bu.
  useEffect(() => {
    if (fontlarHazir || fontHatasi) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontlarHazir, fontHatasi]);

  if (!fontlarHazir && !fontHatasi) {
    return null;
  }

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
