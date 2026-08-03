import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import { useAuth } from './AuthContext';


const SepetContext = createContext({
  sepet: [],
  yukleniyor: false,
  toplamTutar: 0,
  urunSayisi: 0,
  pasifUrunSayisi: 0,     // ⭐ YENİ
  sepetiYukle: async () => {},
  sepeteEkle: async () => {},
  adetGuncelle: async () => {},
  sepettenCikar: async () => {},
  sepetiSifirla: () => {},

  // ⭐ YENİ — KUPON
  kupon: null,
  kuponYukleniyor: false,
  kuponUyari: '',
  indirimTutari: 0,
  odenecekTutar: 0,
  kuponUygula: async () => {},
  kuponuKaldir: () => {},
  kuponUyariyiTemizle: () => {},
});

export function SepetProvider({ children }) {
  const [sepet, setSepet] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // ⭐ YENİ — UYGULANMIŞ KUPON
  //
  // Şekli: { kod, aciklama, indirim } veya null
  //
  // ⚠️ "indirim" alanını BİZ HESAPLAMIYORUZ — sunucudan geliyor.
  //    /api/coupons/dogrula endpoint'i sepeti kendi veritabanından
  //    çekip hesaplıyor. İstemciden gelen para bilgisine güvenilmez;
  //    kullanıcı uygulamayı değiştirip sahte tutar gönderebilir.
  const [kupon, setKupon] = useState(null);

  // Kupon isteği sürerken butonu kilitlemek için
  const [kuponYukleniyor, setKuponYukleniyor] = useState(false);

  // Kupon OTOMATİK kaldırıldığında sebebini tutar.
  // Örn: "MIN500 kuponu artık geçerli değil: Minimum 500,00 ₺ gerekiyor."
  const [kuponUyari, setKuponUyari] = useState('');

  const { token } = useAuth();

  // Giriş yapılınca sepeti bir kez yükle (rozet açılışta dolsun)
  useEffect(() => {
    if (token) {
      sepetiYukle();
    } else {
      // Çıkış yapılınca sepeti VE kuponu temizle.
      // Kuponu temizlemezsek başka bir kullanıcı giriş yaptığında
      // öncekinin kuponu ekranda kalırdı.
      setSepet([]);
      setKupon(null);
      setKuponUyari('');
    }
  }, [token]);


  // ---------- SEPET İŞLEMLERİ ----------

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

    // ⭐ YENİ — kuponu da bırak.
    // Sipariş verildi, kupon TÜKETİLDİ. Bırakmasaydık bir sonraki
    // sepette aynı kupon uygulanmış görünürdü ama sunucu "bu kuponu
    // daha önce kullandın" diyerek siparişi reddederdi.
    setKupon(null);
    setKuponUyari('');
  }


  // ---------- HESAPLANANLAR (türetilmiş değerler) ----------

  const toplamTutar = sepet.reduce((acc, s) => acc + s.productPrice * s.quantity, 0);
  const urunSayisi = sepet.reduce((acc, s) => acc + s.quantity, 0); // rozet için

  // ⭐ YENİ — sepette satıştan kaldırılmış kaç satır var?
  //
  // Türetilmiş değer: sepetten hesaplanabiliyor, ayrı state tutmuyoruz.
  // Sepet her değiştiğinde kendiliğinden yeniden hesaplanıyor.
  //
  // ⚠️ Neden "s.isActive === false" yazdık da "!s.isActive" demedik?
  //
  // Bir alan üç değer alabilir: true, false, undefined.
  // undefined, backend'in o alanı hiç göndermediği durumdur — eski bir
  // API sürümü, bozuk bir cevap, ya da biz DTO'ya eklemeyi unutmuş
  // olsaydık. "!s.isActive" yazsaydık undefined da true sayılır ve
  // sepetteki BÜTÜN ürünler "satıştan kaldırıldı" görünürdü. Sipariş
  // butonu kilitlenir, müşteri hiçbir şey satın alamazdı.
  //
  // "=== false" ise sadece sunucunun AÇIKÇA "hayır" dediği durumu
  // yakalar. Bilgi gelmediyse ürün satıştaymış gibi davranıyoruz —
  // güvenli varsayılan bu yönde, çünkü asıl kilit zaten sunucuda ve
  // yanlış pozitif (satılabilir ürünü engellemek) burada yanlış
  // negatiften daha zararlı.
  const pasifUrunSayisi = sepet.filter((s) => s.isActive === false).length;

  // Kupon yoksa indirim 0.
  //
  // ⚠️ ?? kullanıyoruz, || DEĞİL. Fark önemli:
  //    kupon?.indirim değeri 0 olsaydı, || 0 yine 0 verirdi (sorun yok)
  //    ama alışkanlık olarak ?? doğru araç: sadece null/undefined'ı yakalar,
  //    0'ı geçerli bir değer olarak kabul eder.
  const indirimTutari = kupon?.indirim ?? 0;

  // Math.max ile 0'ın altına inmesini engelliyoruz.
  // Sunucu zaten indirimin sepeti aşmasına izin vermiyor ama
  // ekranda negatif tutar görünmesi ihtimalini tamamen kapatıyoruz.
  const odenecekTutar = Math.max(0, toplamTutar - indirimTutari);


  // ---------- KUPON İŞLEMLERİ ----------

  // Kuponu dener. Başarılıysa state'e yazar.
  //
  // Neden { basarili, mesaj } döndürüyor?
  //   Ekranın kullanıcıya yeşil/kırmızı mesaj gösterebilmesi için.
  //   Hatayı context'te tutup ekrana state olarak vermek de olurdu ama
  //   o zaman "bu mesaj hangi denemeye ait" karmaşası çıkardı.
  //   Fonksiyonun kendi sonucunu döndürmesi daha net.
  async function kuponUygula(kod) {
    const temizKod = kod.trim().toUpperCase();

    if (temizKod === '') {
      return { basarili: false, mesaj: 'Kupon kodu boş olamaz.' };
    }

    setKuponYukleniyor(true);
    setKuponUyari('');

    try {
      // Sunucuya SADECE kodu gönderiyoruz.
      // Sepet tutarını göndermiyoruz — sunucu kendi DB'sinden okuyor.
      const veri = await apiPost('/coupons/dogrula', { code: temizKod });

      setKupon({
        kod: veri.kod,
        aciklama: veri.aciklama,
        indirim: veri.indirim,
      });

      return { basarili: true, mesaj: veri.mesaj };
    } catch (hata) {
      // Geçersiz kupon → varsa eskisini de kaldır.
      // Müşteri geçerli bir kupon kullanırken yenisini deneyip
      // başarısız olursa, hangi kuponun geçerli olduğu belirsiz kalmasın.
      setKupon(null);

      // api.js hatayı Error nesnesi olarak fırlatıyor ve message
      // alanına backend'in "mesaj" değerini koyuyor.
      return { basarili: false, mesaj: hata.message };
    } finally {
      setKuponYukleniyor(false);
    }
  }

  // Müşteri kuponu elle kaldırdı
  function kuponuKaldir() {
    setKupon(null);
    setKuponUyari('');
  }

  // Otomatik kaldırma uyarısını kapat
  function kuponUyariyiTemizle() {
    setKuponUyari('');
  }


  // ⭐ SEPET DEĞİŞİNCE KUPONU YENİDEN DOĞRULA
  //
  // NEDEN GEREKLİ?
  //   İndirim tutarı sunucudan gelen TÜRETİLMİŞ bir değer ve girdisi
  //   sepetin kendisi. Sepet değişince o değer bayatlar.
  //
  //   Örnek: 600 TL sepete "min 500 TL" kuponu uygulandı, sonra bir ürün
  //   çıkarıldı ve sepet 400 TL'ye düştü. Ekranda hâlâ indirim görünürdü
  //   ama sipariş anında sunucu reddederdi. Müşteri "az önce çalışıyordu"
  //   der ve haklı olur.
  //
  //   Sepet BÜYÜDÜĞÜNDE de yeniden sormak lazım: yüzdeli kuponda indirim
  //   artmış olabilir.
  //
  // SONSUZ DÖNGÜ OLUR MU?
  //   Hayır. Bağımlılıklar [toplamTutar, urunSayisi]; bu effect sadece
  //   kupon state'ini değiştiriyor, sepeti değil. Yani kendi tetikleyicisini
  //   tetiklemiyor.
  //
  // ⚠️ Bu useEffect, toplamTutar TANIMLANDIKTAN SONRA gelmeli.
  //    const ile tanımlanan değişkenler hoisting'e takılır (TDZ);
  //    yukarıya taşırsak "Cannot access before initialization" hatası alırız.
  useEffect(() => {
    // Kupon yoksa doğrulanacak bir şey de yok
    if (!kupon) return;

    // ⭐ YENİ — İPTAL BAYRAĞI
    //
    // Effect temizlenirken (sepet tekrar değişti, ekran kapandı) bu
    // bayrağı kaldırıyoruz. Yolda olan cevap geldiğinde bayrağa bakıp
    // "bu cevap artık geçersiz" deyip yok sayıyoruz.
    //
    // Neden gerekli? İstek 800ms sürerken müşteri adedi tekrar
    // değiştirirse iki istek yarışır. Cevaplar SIRASIZ dönebilir —
    // eski isteğin cevabı sonra gelirse bayat indirimi ekrana yazardı.
    let iptal = false;

    // ⭐ YENİ — GECİKTİRME (debounce)
    //
    // İsteği hemen atmıyoruz, 500ms bekliyoruz. Bu süre içinde sepet
    // tekrar değişirse aşağıdaki temizlik fonksiyonu sayacı iptal ediyor
    // ve süre baştan başlıyor.
    //
    // Sonuç: müşteri "+" butonuna 8 kez arka arkaya bassa bile SADECE
    // 1 istek gidiyor — son duruma ait olan.
    //
    // Neden 500ms? Arama kutusundaki 400ms'ten biraz uzun tuttuk:
    // burada gecikme kullanıcıyı bekletmiyor (indirim satırı zaten
    // ekranda duruyor, sadece tazeleniyor), o yüzden ağdan tasarrufu
    // tepki hızına tercih ettik.
    const sayac = setTimeout(async () => {
      try {
        const veri = await apiPost('/coupons/dogrula', { code: kupon.kod });

        // Cevap geldi ama bu arada effect temizlendiyse yok say
        if (iptal) return;

        // Hâlâ geçerli — indirim tutarını tazele
        setKupon({
          kod: veri.kod,
          aciklama: veri.aciklama,
          indirim: veri.indirim,
        });
      } catch (hata) {
        if (iptal) return;

        const kaldirilanKod = kupon.kod;
        setKupon(null);

        // Sepet boşaldıysa uyarı gösterme — kullanıcı zaten
        // sepetini boşalttığını biliyor, gereksiz gürültü olur.
        if (sepet.length > 0) {
          setKuponUyari(`"${kaldirilanKod}" kuponu artık geçerli değil: ${hata.message}`);
        }
      }
    }, 500);

    // ⚠️ TEMİZLİK FONKSİYONU — atlanamaz.
    //
    // İki iş yapıyor:
    //   1) Henüz atılmamış isteği iptal ediyor (clearTimeout)
    //   2) Atılmış ama cevabı gelmemiş isteğin sonucunu geçersiz
    //      kılıyor (iptal = true)
    //
    // Bu ikisi farklı anları koruyor: biri "istek daha yola çıkmadı",
    // diğeri "istek yolda ama artık umurumuzda değil".
    return () => {
      iptal = true;
      clearTimeout(sayac);
    };
  }, [toplamTutar, urunSayisi]);


  return (
    <SepetContext.Provider
      value={{
        sepet,
        yukleniyor,
        toplamTutar,
        urunSayisi,
        pasifUrunSayisi,     // ⭐ YENİ
        sepetiYukle,
        sepeteEkle,
        adetGuncelle,
        sepettenCikar,
        sepetiSifirla,

        // ⭐ YENİ
        kupon,
        kuponYukleniyor,
        kuponUyari,
        indirimTutari,
        odenecekTutar,
        kuponUygula,
        kuponuKaldir,
        kuponUyariyiTemizle,
      }}
    >
      {children}
    </SepetContext.Provider>
  );
}

export function useSepet() {
  return useContext(SepetContext);
}