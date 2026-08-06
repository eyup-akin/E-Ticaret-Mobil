import React, { createContext, useState, useContext, useEffect } from 'react';
// ⭐ DEĞİŞTİ — SecureStore web'i desteklemiyor, guvenliDepo platforma
// göre doğru olanı seçiyor (bkz. services/guvenliDepo.js).
import { deoyaYaz, depodanOku } from '../services/guvenliDepo';
import { temalar, acikTema } from '../theme/tema';

const TEMA_KEY = 'secilenTema';

const TemaContext = createContext();

export function TemaProvider({ children }) {
  const [temaAdi, setTemaAdi] = useState('acik');
  const [hazir, setHazir] = useState(false);

  // Açılışta: daha önce seçilmiş tema var mı?
  useEffect(() => {
    async function temayiYukle() {
      try {
        const kayitli = await depodanOku(TEMA_KEY);
        if (kayitli && temalar[kayitli]) {
          setTemaAdi(kayitli);
        }
      } catch (hata) {
        console.log('Tema okunamadı:', hata.message);
      } finally {
        setHazir(true);
      }
    }
    temayiYukle();
  }, []);

  // Tema değiştir ve kaydet
  async function temaDegistir(yeniAd) {
    if (!temalar[yeniAd]) return;
    setTemaAdi(yeniAd);
    await deoyaYaz(TEMA_KEY, yeniAd);
  }

  const renkler = temalar[temaAdi] || acikTema;
  const koyuMu = temaAdi === 'koyu';

  return (
    <TemaContext.Provider value={{ renkler, temaAdi, koyuMu, temaDegistir, hazir }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  return useContext(TemaContext);
}