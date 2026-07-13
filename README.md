# E-Ticaret Mobil Uygulaması

React Native (Expo) ile geliştirilmiş e-ticaret müşteri uygulaması. Staj projesi kapsamında, kendi yazdığım ASP.NET Core backend'i ile çalışır.

## Özellikler

- JWT tabanlı kayıt / giriş, token'ın güvenli saklanması (expo-secure-store)
- Ürün listeleme, kategori filtreleme, canlı arama
- Favorilere ekleme/çıkarma
- Sepet yönetimi (adet güncelleme, silme, canlı toplam)
- Sipariş akışı: adres seç → kart seç → onay → ödeme
- Sipariş takibi (kargo durumu, ödeme durumu)
- Adres ve kart yönetimi
- Açık / koyu tema (tek yerden yönetilen merkezi tema sistemi)

## Kullanılan Teknolojiler

- React Native + Expo
- React Navigation (bottom tabs + native stack)
- Context API (auth, sepet, favoriler, tema)
- expo-secure-store (token saklama)

## Kurulum

```bash
npm install
npx expo start
```

`src/services/config.js` içindeki `API_URL` değerini kendi backend adresinle güncelle.

## Backend

Bu uygulama [ETicaretAPI](https://github.com/KULLANICI_ADIN/ETicaretAPI) projesindeki ASP.NET Core backend'i kullanır.