import React from 'react';
import { useFavorite } from '../context/FavoriteContext';
import RozetliIkon from './RozetliIkon';

// FAVORİ İKONU (sekme çubuğu)
//
// ⭐ Sayıyı context'ten TÜRETİYORUZ, ayrıca saklamıyoruz.
//
//    FavoriteContext zaten favoriIdler dizisini tutuyor; uzunluğu
//    zaten favori sayısı. Ayrıca bir "favoriSayisi" state'i açsaydık,
//    favori eklendiğinde/çıkarıldığında ikisini birden güncellemeyi
//    hatırlamak zorunda kalırdık. Unuttuğumuz an sayı ile liste
//    tutarsız hale gelirdi.
//
//    Bu, proje boyunca tekrarladığımız kural: hesaplanabilen değer
//    saklanmaz, hesaplanır.
//
// Misafir durumu otomatik hallolur: FavoriteContext token yokken
// listeyi boşaltıyor, uzunluk 0 oluyor, rozet çizilmiyor.
export default function FavoriIkonu({ color, size }) {
  const { favoriIdler } = useFavorite();

  return (
    <RozetliIkon
      ikon="heart"
      sayi={favoriIdler.length}
      color={color}
      size={size}
    />
  );
}