import React from 'react';
import { useSepet } from '../context/SepetContext';
import RozetliIkon from './RozetliIkon';

// SEPET İKONU (sekme çubuğu)
//
// Artık sadece "hangi veriyi göstereceğim" sorusuyla ilgileniyor.
// Rozetin nasıl göründüğü RozetliIkon'un işi.
//
// Bu ayrımın faydası: rozet tasarımını değiştirmek istediğinde
// tek dosyaya dokunuyorsun, iki dosyayı senkron tutmak zorunda
// kalmıyorsun.
export default function SepetIkonu({ color, size }) {
  // urunSayisi = sepetteki toplam ADET (2 tişört + 3 çorap = 5)
  const { urunSayisi } = useSepet();

  return (
    <RozetliIkon
      ikon="cart"
      sayi={urunSayisi}
      color={color}
      size={size}
    />
  );
}