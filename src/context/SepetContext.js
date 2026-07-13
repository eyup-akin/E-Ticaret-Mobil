import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import { useAuth } from './AuthContext';


const SepetContext = createContext({
  sepet: [],
  yukleniyor: false,
  toplamTutar: 0,
  urunSayisi: 0,
  sepetiYukle: async () => {},
  sepeteEkle: async () => {},
  adetGuncelle: async () => {},
  sepettenCikar: async () => {},
  sepetiSifirla: () => {},
});

export function SepetProvider({ children }) {
  const [sepet, setSepet] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const { token } = useAuth();

  // Giriş yapılınca sepeti bir kez yükle (rozet açılışta dolsun)
  useEffect(() => {
    if (token) {
      sepetiYukle();
    } else {
      setSepet([]);  // çıkış yapılınca sepeti temizle
    }
  }, [token]);


  // Sepeti backend'den çek
  async function sepetiYukle() {
    try {
      const veri = await apiGet('/cart');
      setSepet(veri);
    } catch (hata) {
      console.log('Sepet alınamadı:', hata.message);
    } finally {
      setYukleniyor(false);
    }
  }

  // Sepete ürün ekle (Ürün Detay'dan çağrılır)
  async function sepeteEkle(urunId, adet = 1) {
    await apiPost('/cart', { productId: urunId, quantity: adet });
    await sepetiYukle(); // rozet ve liste güncellensin
  }

  // Adet güncelle — önce ekranda, sonra backend'de (iyimser güncelleme)
  async function adetGuncelle(item, yeniAdet) {
    if (yeniAdet < 1 || yeniAdet > 99) return;

    setSepet((onceki) =>
      onceki.map((s) => (s.id === item.id ? { ...s, quantity: yeniAdet } : s))
    );

    try {
      await apiPut('/cart/' + item.id, {
        productId: item.productId,
        quantity: yeniAdet,
      });
    } catch (hata) {
      console.log('Adet güncellenemedi:', hata.message);
      await sepetiYukle(); // hata olursa gerçek durumu geri yükle
    }
  }

  // Sepetten çıkar
  async function sepettenCikar(item) {
    setSepet((onceki) => onceki.filter((s) => s.id !== item.id));
    try {
      await apiDelete('/cart/' + item.id);
    } catch (hata) {
      console.log('Silinemedi:', hata.message);
      await sepetiYukle();
    }
  }

  // Sipariş sonrası sepeti temizle (backend zaten temizliyor, biz ekranı senkronlarız)
  function sepetiSifirla() {
    setSepet([]);
  }

  // Hesaplananlar
  const toplamTutar = sepet.reduce((acc, s) => acc + s.productPrice * s.quantity, 0);
  const urunSayisi = sepet.reduce((acc, s) => acc + s.quantity, 0); // rozet için

  return (
    <SepetContext.Provider
      value={{
        sepet,
        yukleniyor,
        toplamTutar,
        urunSayisi,
        sepetiYukle,
        sepeteEkle,
        adetGuncelle,
        sepettenCikar,
        sepetiSifirla,
      }}
    >
      {children}
    </SepetContext.Provider>
  );
}

export function useSepet() {
  return useContext(SepetContext);
}