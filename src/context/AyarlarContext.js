import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiGet } from '../services/api';

// ============================================================
//  MAĞAZA AYARLARI
//
//  `GET /api/ayarlar` — herkese açık uç, giriş gerektirmiyor.
//
//  ⚠️ NEDEN CONTEXT, NEDEN HER EKRANDA ayrı ayrı FETCH DEĞİL?
//
//  Bu değerler uygulama açıkken değişmiyor. Her ekranın kendi
//  isteğini atması, aynı sabiti ağdan defalarca indirmek olurdu.
//  Bir kez çekip paylaşıyoruz.
//
//  ⚠️ NEDEN VARSAYILANLAR VAR?
//
//  Ayarlar gelmezse (ağ yok, sunucu kapalı) uygulama ÇALIŞMAYA
//  DEVAM ETMELİ. Ayar bir "iyileştirme"; sepete ekleme veya ürün
//  görüntüleme onsuz da işliyor.
//
//  Varsayılanlar sunucudaki MagazaAyarlari varsayılanlarıyla aynı
//  tutuldu. Farklı olsaydı, ayar alınamadığında arayüz sunucudan
//  BAŞKA bir sınır uygular ve kullanıcı "99 yazıyordu ama 50'de
//  durdu" derdi.
// ============================================================

const VARSAYILAN = {
  magazaAdi: 'Mağaza',
  kargoUcreti: 0,
  ucretsizKargoLimiti: 0,

  // Sunucudaki MagazaAyarlari.SepetMaksAdet varsayılanı da 99.
  sepetMaksAdet: 99,
};

const AyarlarContext = createContext({ ayarlar: VARSAYILAN });

export function AyarlarProvider({ children }) {
  const [ayarlar, setAyarlar] = useState(VARSAYILAN);

  useEffect(() => {
    // ⚠️ İPTAL BAYRAĞI — istek dönmeden bileşen sökülürse
    // state güncellemesi yapmayalım.
    let iptal = false;

    async function getir() {
      try {
        const veri = await apiGet('/ayarlar');

        if (iptal) {
          return;
        }

        // Gelen alanları varsayılanların ÜSTÜNE yazıyoruz.
        // Sunucu bir alanı göndermezse varsayılan kalıyor —
        // eksik alan yüzünden undefined ile hesap yapmıyoruz.
        setAyarlar((onceki) => ({ ...onceki, ...veri }));
      } catch (hata) {
        // ⚠️ SESSİZCE GEÇİYORUZ — bilinçli.
        //
        // Ayarlar alınamazsa varsayılanlarla devam ediyoruz.
        // Kullanıcıya hata göstermek, aslında çalışan bir
        // uygulamada "bir şeyler bozuk" izlenimi yaratırdı.
        console.log('Mağaza ayarları alınamadı:', hata.message);
      }
    }

    getir();

    return () => {
      iptal = true;
    };
  }, []);

  return (
    <AyarlarContext.Provider value={{ ayarlar }}>
      {children}
    </AyarlarContext.Provider>
  );
}

export function useAyarlar() {
  return useContext(AyarlarContext);
}
