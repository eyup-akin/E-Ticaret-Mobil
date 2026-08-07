---
name: tasarim-sistemi
description: Mobil uygulamada herhangi bir görsel değişiklik yaparken kullan — StyleSheet yazarken, yeni ekran/bileşen eklerken, renk/boşluk/köşe/punto seçerken. Token adlarını, React Native'e özel tuzakları ve "yapma" listesini içerir.
---

# Mobil Tasarım Sistemi

Bu uygulamada **hiçbir görsel değer elle yazılmaz.** Bir `StyleSheet` içine
sabit sayı veya renk yazmak üzereysen, önce burada karşılığı var mı diye bak.

## Token'lar nerede yaşıyor

| Ne | Nerede | Nasıl |
|---|---|---|
| Renk, gölge | `src/theme/tema.js` | `useTema()` → `renkler.anaRenk` |
| Boşluk, köşe, punto, ağırlık, satır | `src/theme/olculer.js` | `import { bosluk, kose, yazi } from '../theme/olculer'` |

⚠️ **Ayrım kuralı:** Açık/koyu temada **değişiyorsa** `tema.js`'e,
**değişmiyorsa** `olculer.js`'e. Ölçüleri temaya koymak, iki nesnede birden
tanımlamak ve birini unutunca tema değişince yerleşimin kayması demektir.

⚠️ **İki temanın anahtarları birebir aynı olmalı.** Tek temada tanımlı bir
token, diğer temada `undefined` olur ve **React Native onu sessizce yok
sayar** — hata yok, uyarı yok, öğe stilsiz kalır. `tema.js` sonundaki
`__DEV__` kontrolü bunu konsola yazar.

## Ölçekler (`olculer.js`)

```js
bosluk   mikro 4 · kucuk 8 · orta 12 · normal 16 · genis 24 · dev 32
kose     kucuk 8 · orta 12 · buyuk 16 · dev 20 · tam 999
yazi     mikro 11 · kucuk 12 · normal 14 · orta 15 · buyuk 18 · baslik 22 · dev 30
agirlik  normal '400' · orta '500' · yari '600' · kalin '700'
satir    kucuk 16 · normal 20 · orta 22 · buyuk 26 · baslik 30
```

⚠️ `agirlik` değerleri **metin** ('600'), sayı değil — RN sayıyı Android'de
sessizce yok sayar.

⚠️ `satir` (lineHeight) React Native'de **mutlak piksel**, çarpan değil.
Web'deki gibi `1.5` yazarsan satır yüksekliği 1.5 piksel olur ve metin üst
üste biner.

## Renk rolleri (`tema.js`)

```
anaRenk anaRenkKoyu anaRenkUstuYazi
arkaPlan kartArka acikKart acikGri
yaziKoyu yaziOrta yaziGri
kenarlik inputKenar
basari hata uyari pasif favoriRenk
yumusakBasari yumusakUyari yumusakHata yumusakVurgu   ← rozet zeminleri
indirimArka indirimYazi                                ← indirim hapı
iskeletArka
golgeSm golgeMd golgeLg                                ← NESNE, metin değil
```

⚠️ Sayfa zemini (`arkaPlan`) açık temada **beyaz** — admin panelden farklı.
Ayrımı kart değil, ürün görselinin arkasındaki `acikKart` karosu yapıyor.

## Gölge

```js
...renkler.golgeSm   // yayılmış operatörle stile karıştır
```

⚠️ **`elevation` TEK BAŞINA YETMEZ** — sadece Android'de çalışır, iOS'ta kart
tamamen düz görünür. Tema gölgeleri `shadowColor/Offset/Opacity/Radius` +
`elevation`'ı birlikte verir. `elevation: 2` yazma, token kullan.

⚠️ Gölge temada çünkü koyu zeminde açık temanın gölgesi görünmez.

## Ortak bileşenler

| Bileşen | Ne zaman |
|---|---|
| `Rozet` | Durum/bilgi etiketi. Tipler: `basari` `uyari` `hata` `vurgu` `notr` `indirim` |
| `AramaCubugu` `SepetSatiri` `UrunKarti` `KargoDurumu` `Yildizlar` | Mevcut — yenisini yazmadan önce bak |

⚠️ **Rozet tıklanabilir DEĞİLDİR.** Tıklanabilir seçim (kategori filtresi)
gerekiyorsa ayrı bir `Chip` yazılmalı — aynı görünüp farklı iş yapan iki şeyi
tek bileşende toplamak, yarın birini değiştirince diğerini bozmak demek.

⚠️ `indirim` tipi `hata`'dan **ayrı**: ikisi de kırmızı ama biri "ters gitti",
diğeri "fırsat". Paylaşsalardı hata rengini değiştirince indirim rozeti de
değişirdi.

## Renk anlamları

- **Mavi (`anaRenk`) = tıklanabilir.** Butonlar ve bağlantılar. Fiyatı mavi
  yazma — tıklanabilir olduğunu ima eder. Fiyat `yaziKoyu`, dikkati punto ve
  kalınlık çeker.
- **Yeşil (`basari`) = olumlu durum.** Dekorasyon için kullanma.
- **`favoriRenk` temadan bağımsız** — kalp her iki temada da kırmızı.

## Yapma listesi

- ❌ `StyleSheet`'e sabit renk (`'#555'`, `'rgba(255,255,255,0.9)'`) yazma —
  koyu temada bozulur, **bu tam olarak yaşandı**
- ❌ Sabit `fontSize: 15` / `borderRadius: 12` yazma → ölçek kullan
- ❌ `elevation` tek başına kullanma → `...renkler.golgeSm`
- ❌ `lineHeight` çarpan yazma → `satir` değerleri
- ❌ Sadece tek temada token tanımlama

## Platform tuzakları

- **`borderStyle: 'dashed'`** Android'de yuvarlatılmış köşelerle birlikte
  çizilmiyor. Ayrımı incelik ve boşlukla ver.
- **`expo-secure-store` web'de çalışmaz.** Kalıcı saklama için
  `services/guvenliDepo.js` kullan — platforma göre doğru olanı seçer.
- **Web önizlemesi** (`npx expo start` → `w`) yerleşim kontrolü için yeterli
  ama birebir cihaz görünümü değildir.
