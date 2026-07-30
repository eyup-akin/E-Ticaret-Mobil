import React, { createContext, useState, useContext, useEffect } from 'react';

import { apiPost, apiPut, oturumBittiKaydet } from '../services/api';
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

  // ---------- KAYIT OL ----------
  // ⚠️ OTOMATİK GİRİŞ KALDIRILDI.
  // Backend yeni hesabı "doğrulanmamış" (EmailDogrulandiMi = false) açıyor ve
  // login o hesabı içeri almıyor. Otomatik giriş denersek kayıt BAŞARILI olduğu
  // hâlde kullanıcı "Kayıt başarısız" hatası görüyordu.
  //
  // Artık sadece kayıt yapıp backend'in mesajını ekrana geri veriyoruz;
  // kullanıcı maildeki linke tıkladıktan sonra kendisi giriş yapacak.
  async function kayitOl(adSoyad, email, sifre) {
    const veri = await apiPost('/auth/register', {
      fullName: adSoyad,
      email: email,
      password: sifre,
    });

    // Backend { mesaj: "Kayıt başarılı! Lütfen email adresine..." } döndürüyor.
    // Ekran bunu kullanıcıya gösterecek.
    return veri;
  }

  // ---------- ⭐ YENİ — PROFİL GÜNCELLE ----------
  //
  // Neden ekran doğrudan apiPut çağırmıyor da burası yapıyor?
  //
  //   Ad soyad iki yerde saklı:
  //     1. AuthContext'teki 'kullanici' state'i (ekranların okuduğu)
  //     2. SecureStore'daki kalıcı kopya (uygulama kapanınca kaybolmaması için)
  //
  //   Ekran doğrudan API'yi çağırsaydı ikisini de güncellemeyi hatırlaması
  //   gerekirdi. Unutursa uygulamayı kapatıp açınca eski ad geri gelirdi —
  //   bulunması çok zor bir hata. Kimlik durumunun sahibi burası, güncellemeyi
  //   de burası yapmalı.
  async function profilGuncelle(adSoyad) {
    const veri = await apiPut('/auth/profil', { fullName: adSoyad });

    // Sunucunun döndürdüğü değeri kullanıyoruz, kullanıcının yazdığını DEĞİL.
    // Sunucu Trim() uyguluyor; "  Ali  " gönderdiysek "Ali" dönüyor.
    // Kendi yazdığımızı kaydetsek ekranda boşluklu hâli görünürdü.
    const guncel = {
      id: veri.id,
      fullName: veri.fullName,
      role: veri.role,
    };

    await kullaniciKaydet(guncel);  // kalıcı kopya
    setKullanici(guncel);           // ekranlardaki kopya

    return veri; // { mesaj, ... } — ekran mesajı gösterecek
  }

  // ---------- ⭐ YENİ — ŞİFRE DEĞİŞTİR ----------
  //
  // ⚠️ BURADAKİ TOKEN KAYDETME İŞLEMİ ZORUNLUDUR, İSTEĞE BAĞLI DEĞİL.
  //
  //   Backend şifre değişince şunları yapıyor:
  //     · Tüm refresh token'ları iptal ediyor
  //     · SecurityStamp'i yeniliyor → eldeki access token ANINDA ölüyor
  //     · Bu cihaz için YENİ token çifti üretip cevapta döndürüyor
  //
  //   Yeni token'ları kaydetmezsek şu zincir çalışır:
  //     sonraki istek → ölü access token → 401
  //       → api.js sessiz yenileme dener → İPTAL EDİLMİŞ refresh token
  //       → backend bunu TOKEN HIRSIZLIĞI sanar (reuse detection)
  //       → kullanıcının tüm oturumları uçar, giriş ekranına düşer
  //
  //   Yani kendi güvenlik korumamız bizi ısırır. Şifresini başarıyla
  //   değiştiren kullanıcı sebepsizce çıkışa atılır.
  async function sifreDegistir(eskiSifre, yeniSifre) {
    const veri = await apiPost('/auth/change-password', {
      eskiSifre: eskiSifre,
      yeniSifre: yeniSifre,
    });

    // Taze token çiftini kasaya yaz — yukarıdaki zinciri önlüyor.
    await tokenKaydet(veri.token);
    await refreshTokenKaydet(veri.refreshToken);

    // React state'ini de güncelle.
    // Bunu atlasak: kasada yeni token var ama AuthContext'teki 'token'
    // state'i eskiyi tutar. api.js kasadan okuduğu için istekler çalışır,
    // ama "token var mı" kontrolü yapan ekranlar eski değere bakar.
    // Tutarsız iki gerçek bırakmıyoruz.
    setToken(veri.token);

    return veri; // { mesaj, token, refreshToken }
  }


  // ---------- ⭐ YENİ — HESABI KAPAT ----------
  //
  // Sunucu tarafında olan şey: kullanıcı satırı SİLİNMİYOR, anonimleşiyor.
  // Adresler, kartlar, sepet, favoriler ve refresh token'lar siliniyor;
  // siparişler ve yorumlar muhasebe kaydı olarak kalıyor.
  //
  // Bizim burada yapacağımız iş: yerel kasayı boşaltmak.
  //
  // ⚠️ NEDEN cikisYap() ÇAĞIRMIYORUZ?
  //   cikisYap ilk iş olarak sunucuya POST /auth/logout atıyor —
  //   "bu cihazın refresh token'ını iptal et" demek için. Ama sunucu o
  //   token'ı ZATEN SİLDİ. Yani boşa bir ağ turu atmış olurduk.
  //
  //   Hata vermezdi (logout endpoint'i token bulunmasa da 200 dönüyor),
  //   ama gereksiz iş gereksizdir. Ayrıca "hesabı kapattım, şimdi çıkış
  //   yapıyorum" ifadesi kavramsal olarak da tuhaf — hesap yok artık,
  //   çıkılacak bir oturum da yok.
  async function hesabiKapat(sifre) {
    // Sunucu şifreyi doğruluyor; yanlışsa hata fırlatır ve buradan
    // aşağıya hiç geçmeyiz. Yani kasa yanlış şifrede boşalmaz.
    const veri = await apiPost('/auth/hesabimi-sil', { sifre: sifre });

    // Yerel kasayı boşalt. Sunucudaki token'lar zaten öldü;
    // burada temizlemezsek uygulama "giriş yapılmış" sanmaya devam eder
    // ve her istekte 401 yiyip tuhaf davranırdı.
    await tokenSil();
    await kullaniciSil();
    await refreshTokenSil();

    // State'i sıfırla → uygulama misafir görünümüne düşer.
    // RootNavigator ve ekranlar token'ın null olmasına bakıp
    // otomatik olarak misafir arayüzüne geçiyor; elle yönlendirme
    // yapmamıza gerek yok.
    setToken(null);
    setKullanici(null);

    return veri; // { mesaj }
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
      value={{
        token,
        kullanici,
        yukleniyor,
        girisYap,
        kayitOl,
        cikisYap,

        // ⭐ YENİ
        profilGuncelle,
        sifreDegistir,
        hesabiKapat,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Her ekrandan kolayca kullanmak için kısayol
export function useAuth() {
  return useContext(AuthContext);
}