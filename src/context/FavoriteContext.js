import React, { createContext, useState, useContext } from 'react';
import { apiGet, apiPost, apiDelete } from '../services/api';

const FavoriteContext = createContext();

export function FavoriteProvider({ children }) {
  const [favoriIdler, setFavoriIdler] = useState([]); // favorilenen ürün id'leri

  // Backend'den favorileri çek (Ana Sayfa açılınca çağıracağız)
  async function favorileriYukle() {
    try {
      const veri = await apiGet('/favorites');
      setFavoriIdler(veri.map((f) => f.productId));
    } catch (hata) {
      console.log('Favoriler alınamadı:', hata.message);
    }
  }

  // Bu ürün favoride mi?
  function favoriMi(urunId) {
    return favoriIdler.includes(urunId);
  }

  // Favoriye ekle / çıkar (toggle)
  async function favoriDegistir(urunId) {
    try {
      if (favoriIdler.includes(urunId)) {
        await apiDelete('/favorites/' + urunId);
        setFavoriIdler((onceki) => onceki.filter((id) => id !== urunId));
      } else {
        await apiPost('/favorites/' + urunId, {});
        setFavoriIdler((onceki) => [...onceki, urunId]);
      }
    } catch (hata) {
      console.log('Favori işlemi başarısız:', hata.message);
    }
  }

  return (
    <FavoriteContext.Provider value={{ favoriIdler, favorileriYukle, favoriMi, favoriDegistir }}>
      {children}
    </FavoriteContext.Provider>
  );
}

export function useFavorite() {
  return useContext(FavoriteContext);
}