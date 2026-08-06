import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ============================================================
//  GÜVENLİ DEPO — platforma duyarlı kalıcı saklama
//
//  ⚠️ NEDEN BU DOSYA VAR?
//
//  expo-secure-store SADECE Android / iOS / tvOS destekliyor
//  (Expo SDK 54 dokümanında platform satırı birebir böyle).
//  Web'de çağrıldığında şu hatayı veriyor:
//
//      ExpoSecureStore.default.getValueWithKeyAsync is not a function
//
//  Bu hata AuthContext'in açılış kontrolünde YAKALANMIYORDU ve
//  uygulama daha ilk render'dan önce çöküyordu — Expo'nun web
//  önizlemesi sonsuz yükleme çarkında kalıyordu.
//
//  ⚠️ WEB BİR YAYIN HEDEFİ DEĞİL.
//
//  Bu proje bir mobil uygulama. Web çıktısı yalnızca GELİŞTİRME
//  sırasında yerleşimi hızlı görmek için kullanılıyor (cihaz veya
//  emülatör açmadan). Bu dosyanın var oluş sebebi de o.
//
//  ⚠️ GÜVENLİK NOTU — WEB'E ÇIKILIRSA BURASI YENİDEN DÜŞÜNÜLMELİ.
//
//  localStorage tarayıcıda JavaScript'e AÇIKTIR: bir XSS açığı
//  token'ları okuyabilir. SecureStore ise işletim sisteminin
//  şifreli kasasını (iOS Keychain / Android Keystore) kullanıyor.
//  İkisi aynı güvenlik seviyesinde DEĞİL.
//
//  Web gerçekten yayınlanacaksa doğru çözüm HttpOnly çerez olurdu;
//  o da backend tarafında ayrı bir iş. Şimdilik web sadece
//  geliştirici makinesinde çalıştığı için kabul edilebilir.
//
//  ⚠️ NEDEN AYRI DOSYA, NEDEN tokenStorage.js İÇİNDE DEĞİL?
//  İki tüketicisi var: tokenStorage.js (oturum) ve TemaContext.js
//  (tema tercihi). İkinci tüketici çıktığı an ortak yere taşınır.
// ============================================================

// Web anahtarlarına önek koyuyoruz.
//
// Aynı origin'de başka bir uygulama çalışırsa (localhost farklı
// portlarda çalışsa da tarayıcı bazı durumlarda depoyu paylaştırır)
// anahtarlar karışmasın. Native tarafta bu risk yok, orada önek
// kullanmıyoruz — mevcut cihazlardaki kayıtlı oturumlar bozulurdu.
const WEB_ONEK = 'eticaret:';

const webMi = Platform.OS === 'web';

export async function deoyaYaz(anahtar, deger) {
  if (webMi) {
    localStorage.setItem(WEB_ONEK + anahtar, deger);
    return;
  }

  await SecureStore.setItemAsync(anahtar, deger);
}

export async function depodanOku(anahtar) {
  if (webMi) {
    // ⚠️ localStorage bulunamayan anahtar için null döner —
    // SecureStore.getItemAsync ile aynı davranış. Çağıranların
    // hiçbirinin platforma göre farklı kontrol yapmasına gerek yok.
    return localStorage.getItem(WEB_ONEK + anahtar);
  }

  return await SecureStore.getItemAsync(anahtar);
}

export async function depodanSil(anahtar) {
  if (webMi) {
    localStorage.removeItem(WEB_ONEK + anahtar);
    return;
  }

  await SecureStore.deleteItemAsync(anahtar);
}
