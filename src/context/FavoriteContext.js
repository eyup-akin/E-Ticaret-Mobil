import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../services/api';
import { useAuth } from './AuthContext';

const FavoriteContext = createContext();

export function FavoriteProvider({ children }) {
  const [favoriIdler, setFavoriIdler] = useState([]); // favorilenen ürün id'leri

  // Token'ı dinliyoruz — misafir mi, üye mi?
  const { token } = useAuth();

  // TOKEN DEĞİŞİNCE OTOMATİK TEPKİ VER
  // - Giriş yapıldı  → favorileri çek
  // - Çıkış yapıldı  → listeyi boşalt (kalpler boşalsın)
  // - Misafir açılış → hiç istek atma (401 hatası basmasın)
  useEffect(() => {
    if (token) {
      favorileriYukle();
    } else {
      setFavoriIdler([]);
    }
  }, [token]);

  // Backend'den favorileri çek
  async function favorileriYukle() {
    // Savunma hattı: token yoksa boşuna istek atma
    if (!token) {
      setFavoriIdler([]);
      return;
    }

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
  // NOT: Misafir buraya hiç gelmemeli — ekranlarda giriş kontrolü yapılıyor (Adım 47).
  // Yine de savunmacı programlama gereği burada da duruyoruz.
  async function favoriDegistir(urunId) {
    if (!token) {
      console.log('Favori işlemi için giriş gerekli.');
      return;
    }

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
    <FavoriteContext.Provider
      value={{ favoriIdler, favorileriYukle, favoriMi, favoriDegistir }}
    >
      {children}
    </FavoriteContext.Provider>
  );
}

export function useFavorite() {
  return useContext(FavoriteContext);
}