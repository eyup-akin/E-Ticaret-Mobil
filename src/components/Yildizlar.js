import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';

// ============================================================
//  YILDIZLAR — tek bir yıldız şeridi
//
//  Sadece göstermek için:    <Yildizlar deger={4.5} />
//  Tıklanabilir seçici için: <Yildizlar deger={puan} secilebilir onSec={setPuan} />
//
//  ⭐ DEĞİŞTİ (GV/Faz 2.9) — RENK ARTIK TEMADAN GELİYOR.
//
//  ⚠️ Eskiden varsayılan değer dosyaya elle yazılıydı:
//  renk = '#f5a623'. İki sorunu vardı:
//    1) Tasarım sisteminin "StyleSheet'e sabit renk yazma" yasağını
//       çiğniyordu
//    2) Koyu temada da aynı kalıyordu — tema değişince yıldızlar
//       değişmiyordu
//
//  ⚠️ YILDIZ NEDEN TURUNCU DEĞİL?
//  Bu uygulamada turuncu EYLEM demek (buton, aktif sekme, seçili
//  karo). Yıldız tıklanabilir bir şey değil, bir ölçüm. Aynı rengi
//  paylaşsalardı müşteri neye basabileceğini renkten ayırt
//  edemezdi. Kehribar yeterince yakın bir sıcaklıkta duruyor ama
//  turuncunun anlamını çalmıyor.
//
//  ⚠️ "renk" prop'u DURUYOR ama artık varsayılanı yok. Veren olursa
//  onunkini kullanıyor; vermezse tema kazanıyor. Prop'u tamamen
//  kaldırmadık çünkü ileride koyu bir yüzeyin üstünde yıldız
//  çizmek gerekebilir ve orada tema değeri yetmeyebilir.
// ============================================================
export default function Yildizlar({
  deger = 0,
  boyut = 18,
  secilebilir = false,
  onSec,
  renk,
}) {
  const { renkler } = useTema();
  const yildizRengi = renk ?? renkler.yildizRengi;

  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        // Seçicide yarım yıldız yok (tam sayı). Göstermede olabilir.
        let ikonAdi;
        if (secilebilir) {
          ikonAdi = n <= deger ? 'star' : 'star-outline';
        } else {
          if (deger >= n) ikonAdi = 'star';
          else if (deger >= n - 0.5) ikonAdi = 'star-half';
          else ikonAdi = 'star-outline';
        }

        const yildiz = (
          <Ionicons name={ikonAdi} size={boyut} color={yildizRengi} style={{ marginRight: 2 }} />
        );

        if (secilebilir) {
          return (
            <TouchableOpacity key={n} onPress={() => onSec && onSec(n)} hitSlop={6}>
              {yildiz}
            </TouchableOpacity>
          );
        }
        return <View key={n}>{yildiz}</View>;
      })}
    </View>
  );
}
