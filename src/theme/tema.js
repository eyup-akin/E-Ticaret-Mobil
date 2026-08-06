// ============================================================
//  TEMA — RENK VE GÖLGE TOKEN'LARI
//
//  Rol bazlı isimler kullanıyoruz ("beyaz" değil "arkaPlan"),
//  çünkü koyu temada aynı rol farklı renge dönüşecek.
//
//  ⚠️ BURAYA SADECE TEMAYA GÖRE DEĞİŞEN ŞEYLER GİRER.
//  Boşluk, köşe ve punto ölçekleri olculer.js'te — onlar iki
//  temada da aynı. Buraya koysaydık iki nesnede birden tanımlamak
//  gerekirdi ve biri güncellenip diğeri unutulurdu.
//
//  ⚠️ Admin panelin tema.js'inden farklı olarak burada İÇ İÇE
//  NESNE serbest. Orada TemaContext her anahtarı CSS değişkenine
//  düzleştirdiği için nesneler bozuluyordu; burada stilOlustur
//  nesneyi doğrudan okuyor.
// ============================================================

export const acikTema = {
  ad: 'acik',

  anaRenk: '#2563eb',        // mavi
  anaRenkKoyu: '#1d4ed8',    // koyu mavi
  anaRenkUstuYazi: '#ffffff',   // ana renk butonun üstündeki yazı

  // ⚠️ SAYFA ZEMİNİ BEYAZ KALIYOR — bilinçli.
  //
  // Admin panelde zemin açık gri, kartlar beyaz. Mobilde referans
  // tasarımların ikisi de beyaz zemin kullanıyor: ayrımı kartın
  // kendisi değil, ürün görselinin arkasındaki açık gri karo
  // (acikKart) yapıyor.
  //
  // Zemini griye çevirseydik beyaz kartlar "kutu içinde kutu" gibi
  // görünür ve mobilin ferah hissi kaybolurdu.
  arkaPlan: '#ffffff',
  kartArka: '#ffffff',

  // ⭐ DEĞİŞTİ — nötr griye hafif mavi katıldı.
  // Saf gri (#f8f8f8), mavi ana renkle birlikte "kirli" görünüyordu.
  acikKart: '#f5f7fa',
  acikGri: '#eef1f5',

  // ⭐ DEĞİŞTİ — nötrler soğutuldu, kontrast artırıldı.
  //
  // Eskiden saf gri idi (#333/#666/#999). Saf gri, mavi bir ana
  // renkle birlikte solmuş görünür. Hafif mavi-gri tonlar hem daha
  // okunaklı hem referanslardaki dile yakın.
  //
  // ⚠️ Bu üç satır uygulamanın TAMAMINI etkiliyor — rol bazlı
  // token'ın anlamı bu. Değişikliğin riskini değil maliyetini
  // düşürüyor; sonucu her ekranda görmek yine gerekiyor.
  yaziKoyu: '#1a1d23',
  yaziOrta: '#5a6270',
  yaziGri: '#8b93a1',

  kenarlik: '#e6e9ee',
  inputKenar: '#d7dce4',

  basari: '#16a34a',
  hata: '#dc2626',
  uyari: '#d97706',
  pasif: '#c9ced6',

  favoriRenk: '#e74c3c',   // kalp her zaman kırmızı — temadan bağımsız

  // ⭐ YENİ — YUMUŞAK ZEMİNLER
  //
  // Rozet ve bilgi kutularının arka planı. Ekranlarda
  // renkler.acikKart + renkli sol kenar çizgisi şeklinde elle
  // kuruluyordu; artık tek token.
  //
  // rgba tercih edildi: altındaki zemin beyaz da olsa açık gri de
  // olsa doğal görünüyor.
  yumusakBasari: 'rgba(22, 163, 74, 0.10)',
  yumusakUyari: 'rgba(217, 119, 6, 0.10)',
  yumusakHata: 'rgba(220, 38, 38, 0.10)',
  yumusakVurgu: 'rgba(37, 99, 235, 0.10)',

  // ⭐ YENİ — indirim rozeti (referanstaki kırmızı hap).
  // hata renginden AYRI: aynı kırmızı ama anlamı farklı. Biri
  // "bir şey ters gitti", diğeri "fırsat". Aynı token'ı
  // paylaşsalardı, yarın hata rengini değiştirdiğimizde indirim
  // rozeti de değişirdi.
  indirimArka: '#dc2626',
  indirimYazi: '#ffffff',

  // ⭐ YENİ — yükleme iskeleti zemini (Aşama 7)
  iskeletArka: '#e9ecf1',

  // ⭐ YENİ — GÖLGE
  //
  // ⚠️ React Native'de gölge NESNE, metin değil. Üstelik iOS ve
  // Android farklı özellikler kullanıyor:
  //   iOS     → shadowColor/Offset/Opacity/Radius
  //   Android → elevation (tek sayı, açı ve renk kontrolü yok)
  //
  // İkisini birden veriyoruz; her platform kendi anladığını
  // okuyor, diğerini yok sayıyor.
  //
  // ⚠️ Koyu temada bu değerler DEĞİŞİYOR — koyu zeminde siyah
  // gölge görünmez. Bu yüzden gölge temada, olculer.js'te değil.
  golgeSm: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  golgeMd: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  golgeLg: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const koyuTema = {
  ad: 'koyu',

  anaRenk: '#3b82f6',        // koyu temada biraz daha açık mavi (okunurluk için)
  anaRenkKoyu: '#2563eb',
  anaRenkUstuYazi: '#ffffff',

  // ⭐ DEĞİŞTİ — saf siyah yerine hafif mavi-gri.
  // #121212 saf nötr siyahtı ve beyaz metinle sert bir kontrast
  // veriyordu. Hafif renkli koyu tonlar gözü daha az yoruyor.
  arkaPlan: '#0f1218',
  kartArka: '#171b22',
  acikKart: '#1e232c',
  acikGri: '#1e232c',

  yaziKoyu: '#f0f2f5',    // koyu temada "koyu yazı" aslında açık renk olur
  yaziOrta: '#a8b0bd',
  yaziGri: '#767f8c',

  kenarlik: '#272d38',
  inputKenar: '#333b48',

  basari: '#2ecc71',
  hata: '#ff6b6b',       // koyu zeminde okunsun diye açık kırmızı
  uyari: '#fbbf24',      // koyu zeminde okunsun diye açık turuncu
  pasif: '#4a515c',

  favoriRenk: '#e74c3c',   // kalp her zaman kırmızı — temadan bağımsız

  // ⭐ YENİ — yumuşak zeminler, koyu tema karşılıkları.
  //
  // Opaklık açık temadakinden YÜKSEK (0.16 vs 0.10) — bilinçli.
  // Koyu zeminde düşük opaklıklı bir renk neredeyse kaybolur;
  // aynı sayıyı kullansaydık rozetler koyu temada görünmez olurdu.
  yumusakBasari: 'rgba(46, 204, 113, 0.16)',
  yumusakUyari: 'rgba(251, 191, 36, 0.16)',
  yumusakHata: 'rgba(255, 107, 107, 0.16)',
  yumusakVurgu: 'rgba(59, 130, 246, 0.16)',

  // İndirim rozeti koyu temada bir tık açık: koyu zeminde koyu
  // kırmızı okunmuyor.
  indirimArka: '#ef4444',
  indirimYazi: '#ffffff',

  iskeletArka: '#232932',

  // ⭐ YENİ — gölge, koyu tema.
  //
  // Siyah ve çok daha opak: koyu zeminde %5'lik bir gölge hiç
  // görünmez. elevation değerleri aynı kaldı — Android'de
  // elevation aynı zamanda katman sırasını belirliyor ve onu
  // değiştirmek kartların üst üste binme sırasını bozardı.
  golgeSm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.40,
    shadowRadius: 2,
    elevation: 1,
  },
  golgeMd: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 3,
  },
  golgeLg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.60,
    shadowRadius: 20,
    elevation: 8,
  },
};

// İleride buraya yeni tema ekleyebilirsin (mavi tema, yeşil tema...)
export const temalar = {
  acik: acikTema,
  koyu: koyuTema,
};


// ============================================================
//  ⭐ YENİ — GELİŞTİRME ZAMANI KORUMASI
//
//  ⚠️ İKİ TEMANIN ANAHTARLARI BİREBİR AYNI OLMAK ZORUNDA.
//
//  Bir token sadece açık temada tanımlıysa, koyu temaya
//  geçildiğinde stilOlustur(renkler) o anahtarı undefined okur.
//  React Native undefined bir stil değerini SESSİZCE yok sayar —
//  hata yok, uyarı yok, sadece o öğe stilsiz kalır.
//
//  Bu projede en çok kaçındığımız hata türü: patlamayan hata.
//
//  __DEV__ React Native'in yerleşik bayrağı; üretim paketinde
//  bu blok çalışmaz.
// ============================================================
if (__DEV__) {
  const acikAnahtarlar = Object.keys(acikTema);
  const koyuAnahtarlar = Object.keys(koyuTema);

  const koyudaEksik = acikAnahtarlar.filter((a) => !koyuAnahtarlar.includes(a));
  const aciktaEksik = koyuAnahtarlar.filter((a) => !acikAnahtarlar.includes(a));

  if (koyudaEksik.length > 0) {
    console.error('[tema] Koyu temada eksik token:', koyudaEksik.join(', '));
  }

  if (aciktaEksik.length > 0) {
    console.error('[tema] Açık temada eksik token:', aciktaEksik.join(', '));
  }
}
