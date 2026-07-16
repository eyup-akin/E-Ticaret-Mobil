import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Tek bir yıldız şeridi.
//  - Sadece göstermek için:   <Yildizlar deger={4.5} />
//  - Tıklanabilir seçici için: <Yildizlar deger={puan} secilebilir onSec={setPuan} />
export default function Yildizlar({ deger = 0, boyut = 18, secilebilir = false, onSec, renk = '#f5a623' }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        // Seçicide yarım yıldız yok (tam sayı). Göstermede yarım yıldız olabilir.
        let ikonAdi;
        if (secilebilir) {
          ikonAdi = n <= deger ? 'star' : 'star-outline';
        } else {
          if (deger >= n) ikonAdi = 'star';
          else if (deger >= n - 0.5) ikonAdi = 'star-half';
          else ikonAdi = 'star-outline';
        }

        const yildiz = (
          <Ionicons name={ikonAdi} size={boyut} color={renk} style={{ marginRight: 2 }} />
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