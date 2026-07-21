import React, { createContext, useState, useContext, useEffect } from 'react';

import { apiPost, oturumBittiKaydet } from '../services/api';
import {
  tokenKaydet, tokenAl, tokenSil,
  kullaniciKaydet, kullaniciAl, kullaniciSil,
  refreshTokenKaydet, refreshTokenAl, refreshTokenSil, // ⭐ YENİ
} from '../services/tokenStorage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [kullanici, setKullanici] = useState(null); // { id, fullName, role }
  const [yukleniyor, setYukleniyor] = useState(true); // açılışta token kontrolü

  // ---------- UYGULAMA AÇILINCA: kasada token var mı bak ----------
  useEffect(() => {
    async function baslangictaKontrolEt() {
      const kayitliToken = await tokenAl();
      const kayitliKullanici = await kullaniciAl();

      if (kayitliToken) {
        setToken(kayitliToken);
        setKullanici(kayitliKullanici);
      }

      setYukleniyor(false); // kontrol bitti
    }

    baslangictaKontrolEt();
  }, []);

  // ---------- OTURUM DÜŞERSE HABER AL ----------
  // api.js düz bir modül, React bileşeni değil — içinden useAuth() çağıramaz.
  // Bu yüzden ona bir fonksiyon "kaydediyoruz": 401 görünce bunu çağıracak.
  // Böylece token'ı sunucu tarafından geçersiz kılınan kullanıcı
  // (rolü değişti / pasifleştirildi / süresi doldu) otomatik olarak çıkışa düşer.
  useEffect(() => {
    oturumBittiKaydet(() => {
      setToken(null);
      setKullanici(null);
    });
  }, []);

  // ---------- GİRİŞ YAP ----------
  async function girisYap(email, sifre) {
    const veri = await apiPost('/auth/login', { email: email, password: sifre });

    // backend { token, fullName, role } döndürüyor
    const kul = { id: veri.id, fullName: veri.fullName, role: veri.role };

    await tokenKaydet(veri.token);
    
    await refreshTokenKaydet(veri.refreshToken); // ⭐ YENİ — refresh'i de sakla

    await kullaniciKaydet(kul);

    setToken(veri.token);
    setKullanici(kul);
  }

  // ---------- KAYIT OL (sonra otomatik giriş yaptırır) ----------
  async function kayitOl(adSoyad, email, sifre) {
    await apiPost('/auth/register', {
      fullName: adSoyad,
      email: email,
      password: sifre,
    });

    await girisYap(email, sifre);
  }

  // ---------- ÇIKIŞ YAP ----------
  async function cikisYap() {
    // Sunucuya haber ver: bu cihazın refresh token'ını iptal et (gerçek çıkış).
    // Ağ hatası olsa bile yerel çıkış mutlaka olsun diye try/catch.
    try {
      const refresh = await refreshTokenAl();
      if (refresh) {
        await apiPost('/auth/logout', { refreshToken: refresh });
      }
    } catch {
      // sunucuya ulaşılamasa bile aşağıda yerel kasayı boşaltıyoruz
    }

    await tokenSil();
    await kullaniciSil();
    await refreshTokenSil(); // ⭐ YENİ

    setToken(null);
    setKullanici(null);
  }

  return (
    <AuthContext.Provider
      value={{ token, kullanici, yukleniyor, girisYap, kayitOl, cikisYap }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Her ekrandan kolayca kullanmak için kısayol
export function useAuth() {
  return useContext(AuthContext);
}