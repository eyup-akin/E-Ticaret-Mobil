import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
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
  kuponUygula: async () => {},
  kuponuKaldir: () => {},
  kuponUyariyiTemizle: () => {},

  // ⭐ YENİ — KARGO DAHİL SEPET ÖZETİ
  //
  // Şekli: { araToplam, kargoUcreti, toplam,
  //          ucretsizKargoyaKalan, ucretsizKargoKazanildi }
  // veya sepet henüz yüklenmediyse null.
  //
  // ⚠️ "odenecekTutar" KALDIRILDI, yerine bu geldi.
  //
  // O değer ürünler − indirim idi; kargo eklenince YANLIŞ oldu.
  // Kargoyu ona eklemek yerine tamamen sildik: iki farklı "toplam"
  // kavramı bırakmak, ekranlardan birinin yanlışını alması demekti.
  // Tek toplam var ve sunucudan geliyor.
  ozet: null,

  // ⭐ YENİ — kupon uygulanınca ücretsiz kargo kaybedildi mi?
  kuponKargoyuUcretliYapti: false,

  // ⭐ YENİ (5.4) — sepette fiyatı değişen ürün var mı?
  //
  // ⚠️ BU DEĞER İSTEMCİDE HESAPLANMIYOR, SUNUCUDAN GELİYOR.
  // "Fiyat değişti mi?" kuralı (eklenme fiyatı ile güncel fiyatın
  // karşılaştırılması) yalnızca sunucuda yazılı. Burada ikinci kez
  // yazsaydık biri "!=", diğeri ">" olur ve sepet ekranı ile sipariş
  // onayı farklı şeyler söyleyebilirdi.
  fiyatDegisenVar: false,
});

// ⭐ YENİ — /coupons/dogrula cevabını kupon state'ine çevirir.
//
// Neden ayrı fonksiyon? Bu dönüşüm İKİ yerde yapılıyor: kupon ilk
// uygulandığında ve sepet değişince yeniden doğrulandığında. Kopya
// olsaydı buraya bir alan eklenip diğerine eklenmediğinde, kupon
// tazelendiği anda kargo bilgisi undefined'a düşerdi — ve bu ancak
// müşteri sepette adet değiştirince ortaya çıkardı.
//
// ⚠️ "toplam" alanı sunucudaki "yeniToplam"dan geliyor. Sunucu tarafı
// o adı bilerek değiştirmedi (eski mobil sürümler okuyor); biz
// burada, sınırın bu tarafında anlamlı isme çeviriyoruz.
function kuponaCevir(veri) {
  return {
    kod: veri.kod,
    aciklama: veri.aciklama,
    indirim: veri.indirim,

    // ⭐ YENİ — kargo dahil özet alanları.
    // Hiçbirini biz hesaplamıyoruz; sipariş anında tahsil edilecek
    // tutarı üreten AYNI servisten geliyorlar.
    araToplam: veri.araToplam,
    kargoUcreti: veri.kargoUcreti,
    toplam: veri.yeniToplam,
    ucretsizKargoyaKalan: veri.ucretsizKargoyaKalan,
    ucretsizKargoKazanildi: veri.ucretsizKargoKazanildi,
  };
}

export function SepetProvider({ children }) {
  const [sepet, setSepet] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  // ⭐ YENİ — GET /cart'tan gelen özet (kuponsuz hali).
  //
  // Kupon uygulanınca bu değer BAYATLAR — indirimsiz hesaba göre
  // üretildi. Bayat haliyle de saklıyoruz çünkü "kupon gelmeden önce
  // kargo bedava mıydı?" sorusunun cevabı burada; onay ekranındaki
  // bilgilendirme buna dayanıyor.
  const [sunucuOzeti, setSunucuOzeti] = useState(null);

  // ⭐ YENİ (5.4) — GET /cart'ın "fiyatı değişen ürün var mı?" cevabı.
  //
  // Kalemlerle AYNI istekten geliyor; ayrı bir uçtan çekseydik liste
  // ile bayrak farklı anların verisi olur ve "uyarı şeridi var ama
  // hiçbir satırda uyarı yok" gibi bir ekran çıkabilirdi.
  const [fiyatDegisenVar, setFiyatDegisenVar] = useState(false);

  // ⭐ YENİ — SEPET İSTEĞİ SIRA NUMARASI
  //
  // Adet değiştirme artık her seferinde sepeti yeniden çekiyor
  // (özet sunucudan geliyor, elde hesaplanamaz). Müşteri "+"ya hızlı
  // basarsa birden fazla istek yolda olur ve cevaplar SIRASIZ
  // dönebilir. Eski cevap sonra gelirse ekrana bayat sepet yazardı.
  //
  // Her istek kendi sırasını alıyor; cevap döndüğünde hâlâ en güncel
  // istek miyiz diye bakıyoruz. Kupon doğrulamadaki "iptal" bayrağının
  // aynı fikri, sayaç biçiminde — orada tek bir effect var, burada
  // birbirinden bağımsız çağrılar olduğu için sayaç gerekiyor.
  const yuklemeSirasiRef = useRef(0);

  // ⭐ YENİ — UYGULANMIŞ KUPON
  //
  // ⭐ DEĞİŞTİ — şekli artık kuponaCevir'in döndürdüğü nesne:
  // { kod, aciklama, indirim, araToplam, kargoUcreti, toplam,
  //   ucretsizKargoyaKalan, ucretsizKargoKazanildi } veya null.
  //
  // Yani bu nesne sadece "hangi kupon" değil, "kupon uygulanmış
  // haliyle sepet ne durumda" sorusunun da cevabı. Kargo bilgisini
  // ayrı bir state'te tutmak da olurdu ama ikisi HER ZAMAN aynı
  // istekten geliyor ve birlikte değişiyor — ayırsaydık birinin
  // güncellenip diğerinin unutulması mümkün hale gelirdi.
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
      setSunucuOzeti(null);   // ⭐ YENİ — özet de öncekine ait
      setFiyatDegisenVar(false);  // ⭐ YENİ (5.4) — uyarı da öncekine ait
      setKupon(null);
      setKuponUyari('');
    }
  }, [token]);


  // ---------- SEPET İŞLEMLERİ ----------

  // Sepeti backend'den çek
  //
  // ⭐ DEĞİŞTİ — cevap artık düz dizi değil, { kalemler, ozet } nesnesi.
  //
  // Özet ayrı bir uçtan da gelebilirdi ama o zaman kalemler ile özet
  // FARKLI ANLARIN verisi olurdu: arada adet değişirse ekranda 3 ürün
  // görünürken toplam 2 ürünün olurdu. Tek istek, tek an.
  async function sepetiYukle() {
    const sira = ++yuklemeSirasiRef.current;

    try {
      const veri = await apiGet('/cart');

      // Biz cevabı beklerken daha yeni bir istek yola çıktıysa bu
      // cevap bayat — yok say.
      if (sira !== yuklemeSirasiRef.current) {
        return;
      }

      // ?? ile savunuyoruz: cevap beklenmedik bir şekilde eski
      // (dizi) formatta gelirse kalemler undefined olur ve ekran
      // "sepet.map is not a function" ile çöker. Boş sepet göstermek
      // çökmekten iyidir.
      setSepet(veri.kalemler ?? []);
      setSunucuOzeti(veri.ozet ?? null);

      // ⭐ YENİ (5.4)
      //
      // ⚠️ "=== true" yazıyoruz, doğrudan atama yapmıyoruz.
      // Alan hiç gelmezse (eski API sürümü) undefined olur; state'e
      // undefined koymak bileşenlerde "false mu, henüz bilinmiyor mu"
      // ayrımını bulanıklaştırırdı. Açıkça true denmedikçe uyarı yok.
      setFiyatDegisenVar(veri.fiyatDegisenVar === true);
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

      // ⭐ YENİ — başarıda da sepeti yeniden çekiyoruz.
      //
      // ⚠️ İYİMSER GÜNCELLEME KORUNDU: yukarıdaki setSepet ekranı
      // ANINDA değiştirdi, kullanıcı beklemiyor. Buradaki çağrı
      // arkadan gelip ÖZETİ tazeliyor.
      //
      // Neden şart? Kargo eşiği artık toplama bağlı ve o hesap
      // sunucuda. Adet düşünce "kargo bedava" rozeti sessizce
      // yanlışa dönerdi — müşteri bedava kargo görüp ücretli öderdi.
      //
      // Özeti burada elle düzeltmek (kargoyu kendimiz hesaplamak)
      // seçenek değildi: aynı formülün ikinci bir kopyası olurdu ve
      // eşik kuralı değiştiğinde biri güncellenip diğeri unutulurdu.
      await sepetiYukle();
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

      // ⭐ YENİ — adet güncellemedeki sebebin aynısı: ürün çıkınca
      // tutar düşer ve kargo ücretli hale gelmiş olabilir.
      await sepetiYukle();
    } catch (hata) {
      console.log('Silinemedi:', hata.message);
      await sepetiYukle();
    }
  }

  // Sipariş sonrası sepeti temizle (backend zaten temizliyor, biz ekranı senkronlarız)
  function sepetiSifirla() {
    setSepet([]);
    setSunucuOzeti(null);   // ⭐ YENİ — boş sepetin özeti de yok
    setFiyatDegisenVar(false);  // ⭐ YENİ (5.4) — boş sepette uyarı olmaz

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

  // ⭐ YENİ — EKRANLARIN KULLANACAĞI GEÇERLİ ÖZET
  //
  // İki kaynak var ve hangisinin geçerli olduğu kuponun varlığına
  // bağlı:
  //   • kupon YOKSA  → GET /cart özeti (indirim 0 ile hesaplandı)
  //   • kupon VARSA  → /coupons/dogrula özeti (indirim dahil)
  //
  // ⚠️ İkisini KARIŞTIRMIYORUZ. "Ara toplamı sepetten, kargoyu
  // kupondan al" gibi bir birleştirme cazip ama yanlış: değerler
  // birbirine bağlı (kargo, indirimli tutara bakıyor). Farklı
  // anlardan gelen parçaları birleştirmek, hiçbir isteğin
  // döndürmediği bir toplam üretirdi.
  //
  // Türetilmiş değer — ayrı state yok, kaynaklar değişince
  // kendiliğinden tazeleniyor.
  const ozet = kupon
    ? {
        araToplam: kupon.araToplam,
        kargoUcreti: kupon.kargoUcreti,
        toplam: kupon.toplam,
        ucretsizKargoyaKalan: kupon.ucretsizKargoyaKalan,
        ucretsizKargoKazanildi: kupon.ucretsizKargoKazanildi,
      }
    : sunucuOzeti;

  // ⭐ YENİ — kupon, ücretsiz kargoyu ELİNDEN ALDI MI?
  //
  // Sepet 550 TL, eşik 500 TL → kargo bedava. Müşteri 100 TL'lik
  // kupon uygularsa indirimli tutar 450'ye düşer ve kargo geri gelir.
  // İndirim 100, kargo 49,90 → net kazanç yine var ama beklenen
  // tutar tutmaz.
  //
  // Bunu söylemezsek müşteri "indirim uyguladım, toplam neden
  // düştüğü kadar düşmedi?" der. Sürpriz fiyat, sepet terk etmenin
  // bir numaralı sebebi.
  //
  // ⚠️ UYARI DEĞİL BİLGİ: müşteri yanlış bir şey yapmadı, kupon
  // geçerli ve hâlâ kârlı. Sadece ne olduğunu açıklıyoruz.
  const kuponKargoyuUcretliYapti =
    kupon !== null &&
    sunucuOzeti?.ucretsizKargoKazanildi === true &&
    kupon.kargoUcreti > 0;


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

      // ⭐ DEĞİŞTİ — artık kargo alanlarını da saklıyoruz.
      setKupon(kuponaCevir(veri));

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

        // Hâlâ geçerli — indirimi VE kargo özetini tazele.
        //
        // ⭐ Bu çağrı artık ikinci bir iş daha yapıyor: sepet
        // değiştiğinde kuponlu özeti de güncelliyor. Kupon varken
        // ayrıca /cart'a gitmemizi gereksiz kılıyor — zaten bu cevap
        // indirimli ve kargolu nihai tutarı taşıyor.
        setKupon(kuponaCevir(veri));
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
        kuponUygula,
        kuponuKaldir,
        kuponUyariyiTemizle,

        // ⭐ YENİ — kargo dahil özet
        ozet,
        kuponKargoyuUcretliYapti,

        // ⭐ YENİ (5.4)
        fiyatDegisenVar,
      }}
    >
      {children}
    </SepetContext.Provider>
  );
}

export function useSepet() {
  return useContext(SepetContext);
}