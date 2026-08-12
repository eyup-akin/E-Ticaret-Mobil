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

  // ============================================================
  //  PALET — "Royal Blue and Orange"  (kullanıcı onayı 2026-08-10)
  //
  //  Verilen üç renk:
  //    #4169E1  royal blue   → marka / yüzey
  //    #FF6B35  orange       → EYLEM
  //    #EEF4ED  kırık beyaz  → sayfa zemini
  //
  //  ⚠️ ÜÇ RENK BİR SİSTEM DEĞİL. Metin, kenarlık, ikincil yazı,
  //  devre dışı durum gibi roller de gerekiyor. Eksik roller bu üç
  //  renkten TÜRETİLDİ; dışarıdan rastgele renk katılmadı.
  // ============================================================

  // ⭐ DEĞİŞTİ (GV/Faz 2.10) — turuncu palet değerine çekildi.
  //
  // Önce #FC6C29 kullanılıyordu (Stitch çıktısından). Kullanıcının
  // verdiği palet #FF6B35 diyor; ikisi gözle neredeyse aynı ama
  // referans tek olmalı, o yüzden palet kazandı.
  //
  // ⚠️ TURUNCU YALNIZCA EYLEM RENGİDİR. Buton, aktif sekme, seçili
  // karo, bağlantı. Fiyat turuncu yazılmaz (yaziKoyu), indirim
  // turuncu değildir (basari/yeşil), dekorasyon için kullanılmaz.
  // Her şey turuncu olursa hiçbir şey turuncu olmaz.
  anaRenk: '#ff6b35',
  anaRenkKoyu: '#e85520',       // basılı durum
  anaRenkUstuYazi: '#ffffff',   // ana renk butonun üstündeki yazı

  // ⭐ YENİ (GV/Faz 2.10) — MARKA MAVİSİ.
  //
  // Paletteki #4169E1. ⚠️ EYLEM RENGİ DEĞİL — turuncuyla yarışmasın.
  // Kullanım yeri: koyu lacivert yüzeylerin üstündeki vurgular,
  // seçili/aktif ikincil durumlar, marka işareti.
  //
  // ⚠️ METİN OLARAK KULLANILMAZ. Beyaz üstünde kontrastı ~4,1:1 ve
  // doygun mavi bu uygulamada "bağlantı" gibi okunur; gövde metnini
  // bununla yazmak hem okunurluğu düşürür hem her yazıyı
  // tıklanabilir gösterirdi.
  markaMavi: '#4169e1',

  // ⭐ DEĞİŞTİ (GV/Faz 1) — ZEMİN ARTIK BEYAZ DEĞİL.
  //
  // ⚠️ BU, ÖNCEKİ BİLİNÇLİ BİR KARARIN GERİ ALINMASIDIR.
  //
  // Eskiden burada "sayfa zemini beyaz kalıyor, ayrımı ürün
  // görselinin arkasındaki gri karo yapıyor" yazıyordu. Yeni tasarım
  // dili kart tabanlı: filtre panelinde her filtre ayrı beyaz kart,
  // sepet özeti kart, hesap grupları kart. Beyaz zemin üstünde beyaz
  // kart görünmez — kartların ayrımını tek başına 1px kenarlık
  // taşımak zorunda kalırdı ve tasarımın yapısı çökerdi.
  //
  // Kırık-beyaz (#f8f9ff) saf griden farklı: içinde hafif lacivert
  // var, o yüzden turuncu-lacivert paletle "kirli" değil "kâğıt"
  // gibi duruyor.
  // ⭐ DEĞİŞTİ (GV/Faz 2.10) — zemin paletteki kırık beyaza çekildi.
  arkaPlan: '#eef4ed',
  kartArka: '#ffffff',

  // Nötrler #EEF4ED'den koyulaştırılarak türetildi — aynı aileden
  // olsunlar diye. acikKart ürün görselinin arkasındaki karo,
  // zeminden ayrılmak zorunda; acikGri input ve pasif chip zemini.
  acikKart: '#e3ebe2',
  acikGri: '#d9e2d8',

  // ⭐ DEĞİŞTİ (GV/Faz 2.10) — MÜREKKEP ARTIK "MAVİYE ÇALAN LACİVERT".
  //
  // Önceki değer #0B1C30 idi: neredeyse nötr, çok koyu bir lacivert.
  // Kullanıcının isteği "maviye yakın lacivert" — bu yüzden mürekkep
  // doğrudan marka mavisinden (#4169E1) türetildi: aynı ton açısı
  // (~225°), düşük parlaklık. Sonuç hâlâ koyu ve okunaklı ama
  // içindeki mavi gözle seçiliyor.
  //
  // ⚠️ #4169E1'İN KENDİSİ KULLANILAMAZ: beyaz üstünde ~4,1:1 verir,
  // gövde metni için sınırda ve doygun mavi "bağlantı" gibi okunur.
  // #192957 beyaz üstünde ~14:1 — rahat okunuyor.
  //
  // ⚠️ Bu üç satır uygulamanın TAMAMINI etkiliyor — rol bazlı
  // token'ın anlamı bu.
  yaziKoyu: '#192957',    // lacivert mürekkep — başlık, gövde VE FİYAT
  yaziOrta: '#4a5878',
  yaziGri: '#7b879e',

  kenarlik: '#d5ddd4',
  inputKenar: '#c9d3c8',

  // ⭐ DEĞİŞTİ — yeşil koyulaştı.
  //
  // ⚠️ basari aynı zamanda İNDİRİMLİ FİYAT rengi. Türk e-ticaretinde
  // düşen fiyat yeşil yazılır ve bu, turuncuyu eylem için serbest
  // bırakıyor. Eski açık yeşil (#16a34a) beyaz kart üstünde fiyat
  // puntosunda cılız kalıyordu.
  basari: '#166534',
  hata: '#ba1a1a',
  uyari: '#b45309',
  pasif: '#c5c6ce',

  favoriRenk: '#e74c3c',   // kalp her zaman kırmızı — temadan bağımsız

  // ⭐ YENİ (GV/Faz 2.9) — YILDIZ RENGİ
  //
  // Daha önce Yildizlar.js içine elle yazılmıştı ('#f5a623'):
  // koyu temada da aynı kalıyordu ve tasarım sisteminin "sabit renk
  // yazma" yasağını çiğniyordu.
  //
  // ⚠️ NEDEN TURUNCU DEĞİL, KEHRİBAR?
  // Tasarımda yıldızlar turuncuydu ama bu uygulamada turuncu EYLEM
  // demek. Yıldız tıklanabilir bir şey değil, bir ölçüm. Aynı rengi
  // paylaşsalardı müşteri neye basabileceğini renkten ayırt
  // edemezdi. Kehribar yeterince yakın bir sıcaklıkta ama
  // turuncunun anlamını çalmıyor.
  yildizRengi: '#f59e0b',

  // ⭐ YENİ (GV/Faz 7.9) — İADE RENGİ
  //
  // ⚠️ İade ne başarı ne hata: para geri döndü, kimse yanlış bir şey
  // yapmadı. Yeşil yapsaydık "iyi haber", kırmızı yapsaydık "sorun"
  // derdi; ikisi de yanlış. Mor bu üç anlamın hiçbirine bulaşmıyor.
  //
  // ⚠️ Bu renk daha önce durum.js icinde ELLE yazılıydı ('#8e44ad')
  // ve koyu temada değişmiyordu.
  iadeRengi: '#7c3aed',

  // ⭐ YENİ (GV/Faz 1) — LACİVERT DOLU YÜZEY
  //
  // Açık temada bile koyu kalan yüzeyler: giriş ekranının üst bandı,
  // baş harf avatarlarının zemini, kart görseli olmayan koyu bloklar.
  //
  // ⚠️ Neden yaziKoyu'yu zemin olarak kullanmıyoruz? İkisi bugün
  // birbirine yakın ama FARKLI sorulara cevap veriyor: biri "metin
  // hangi renk", diğeri "koyu yüzey hangi renk". Aynı token'ı
  // paylaşsalardı, yarın metni bir tık açtığımızda giriş ekranının
  // bandı da değişirdi.
  // ⭐ DEĞİŞTİ (GV/Faz 2.10) — bu da mavi tarafa çekildi ve artık
  // İLK TÜKETİCİSİ VAR: açık temada alt sekme çubuğu.
  //
  // Mürekkepten (#192957) bir basamak açık ve daha mavi: çubuk
  // "siyah bir şerit" değil, "lacivert bir şerit" gibi okunmalı.
  // Beyaz metin üstünde ~12:1.
  lacivertYuzey: '#1e3264',
  lacivertYuzeyUstuYazi: '#eef4ed',

  // ⭐ YENİ (GV/Faz 2.10) — lacivert yüzeyin üstündeki PASİF metin.
  //
  // ⚠️ yaziGri BURADA KULLANILAMAZ: o renk açık zemin için seçildi
  // (#7b879e) ve lacivert çubuk üstünde ~2,2:1 veriyor — pasif sekme
  // etiketleri okunmaz olurdu. Koyu yüzeyin kendi pasif rengi var.
  lacivertYuzeyPasif: '#9aa9cc',

  // ⭐ YENİ — YUMUŞAK ZEMİNLER
  //
  // Rozet ve bilgi kutularının arka planı. Ekranlarda
  // renkler.acikKart + renkli sol kenar çizgisi şeklinde elle
  // kuruluyordu; artık tek token.
  //
  // rgba tercih edildi: altındaki zemin beyaz da olsa açık gri de
  // olsa doğal görünüyor.
  yumusakBasari: 'rgba(22, 101, 52, 0.12)',
  yumusakUyari: 'rgba(180, 83, 9, 0.12)',
  yumusakHata: 'rgba(186, 26, 26, 0.12)',

  // ⚠️ yumusakVurgu = seçili karo/chip zemini. Tasarım burada düz
  // #FFF3EC kullanıyor; biz rgba bırakıyoruz çünkü bu zemin hem
  // beyaz kart hem kırık-beyaz sayfa üstünde kullanılıyor ve düz
  // renk ikisinden birinde tutmuyor. Beyaz üstünde sonuç zaten
  // #fff2ea — tasarımdakiyle gözle ayırt edilemez.
  yumusakVurgu: 'rgba(255, 107, 53, 0.12)',

  // ⭐ YENİ (2026-08-12) — yumusakVurgu'nun BİR TIK DOYGUN hâli.
  //
  // ⚠️ Neden ayrı bir token? İkisi farklı işler yapıyor: yumusakVurgu
  // bir ikonun ya da çipin ARKA planı (üstünde küçük bir şey duruyor),
  // bu ise kendi başına duran bir ŞERİT — grup başlığı. %12'lik ton
  // şerit olarak neredeyse görünmüyordu, %32 ise ikon karesinde
  // ikonu bastırırdı. Aynı rengin iki rolü, iki değeri.
  vurguSerit: 'rgba(255, 107, 53, 0.32)',

  // ⭐ YENİ — indirim rozeti (referanstaki kırmızı hap).
  // hata renginden AYRI: aynı kırmızı ama anlamı farklı. Biri
  // "bir şey ters gitti", diğeri "fırsat". Aynı token'ı
  // paylaşsalardı, yarın hata rengini değiştirdiğimizde indirim
  // rozeti de değişirdi.
  // ⚠️ İNDİRİM ROZETİ KIRMIZI KALIYOR — turuncu YAPILMADI.
  //
  // Yeni palette turuncu eylem rengi. İndirim rozetini turuncuya
  // çevirseydik ürün kartında rozet, sepet butonu ve aktif sekme
  // aynı renk olurdu; müşteri hangisine basabileceğini renkten
  // ayırt edemezdi. Tasarımdaki "-%18" rozeti de kırmızı.
  //
  // ⚠️ Rozet kırmızı ama indirimli FİYAT yeşil (basari). İkisi
  // farklı işler: rozet dikkat çeker, fiyat kazancı söyler.
  indirimArka: '#dc2626',
  indirimYazi: '#ffffff',

  // ⭐ YENİ — yükleme iskeleti zemini (Aşama 7)
  iskeletArka: '#dfe8de',

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

  // ⭐ DEĞİŞTİ (GV/Faz 1)
  //
  // ⚠️ TURUNCU KOYU TEMADA AÇILMADI — mavide yaptığımızın tersi.
  //
  // Eski mavi koyu temada #2563eb'den #3b82f6'ya açılıyordu, çünkü
  // koyu zeminde koyu mavi okunmuyordu. Turunucuda aynı şeyi
  // yapamayız: turuncuyu açarsak (örn. #ff8a4c) BUTONUN ÜSTÜNDEKİ
  // BEYAZ YAZI okunmaz hale gelir — zeminden değil, üstündeki
  // metinden kaybederiz.
  //
  // #fc6c29 koyu lacivert (#0b1c30) üstünde zaten canlı duruyor.
  // Aynı değeri iki temada da kullanmak ayrıca marka tutarlılığı
  // sağlıyor: turuncu her yerde aynı turuncu.
  anaRenk: '#ff6b35',
  anaRenkKoyu: '#e85520',
  anaRenkUstuYazi: '#ffffff',

  // ⭐ YENİ (GV/Faz 2.10) — marka mavisi koyu temada bir tık açık.
  // #4169E1 koyu lacivert zeminde biraz sönük kalıyor.
  markaMavi: '#6b8cf0',

  // ⭐ DEĞİŞTİ (GV/Faz 2.10) — koyu tema da mavi tarafa çekildi.
  // Açık temanın mürekkebi (#192957) burada zemin ailesine dönüşüyor;
  // iki tema aynı renk ailesinden konuşuyor.
  arkaPlan: '#101b3a',
  kartArka: '#182a54',
  acikKart: '#22376e',
  acikGri: '#22376e',

  yaziKoyu: '#e8eefb',    // koyu temada "koyu yazı" aslında açık renk olur
  yaziOrta: '#a9b7d8',
  yaziGri: '#7c8cb4',

  // ⚠️ Kenarlık koyu temada RENK değil, ŞEFFAF BEYAZ.
  // Sabit bir lacivert verseydik kartArka ile acikKart üstünde
  // farklı kontrastlar üretirdi; şeffaf beyaz altındaki yüzey ne
  // olursa olsun aynı oranda ayrım veriyor.
  kenarlik: 'rgba(255, 255, 255, 0.08)',
  inputKenar: 'rgba(255, 255, 255, 0.14)',

  // ⚠️ Yeşil koyu temada AÇILIYOR — açık temadakinin tersi yönde.
  // Açık temada #166534 (koyu yeşil) beyaz üstünde okunuyor; koyu
  // lacivert üstünde ise neredeyse siyah görünürdü.
  basari: '#4ade80',
  hata: '#ff6b6b',       // koyu zeminde okunsun diye açık kırmızı
  uyari: '#fbbf24',
  pasif: '#3d4f7a',

  favoriRenk: '#e74c3c',   // kalp her zaman kırmızı — temadan bağımsız

  // ⚠️ Yıldız koyu temada bir tık AÇILIYOR: kehribar, koyu lacivert
  // zeminde sönük kalıyor. (Gerekçenin tamamı açık temada yazılı.)
  yildizRengi: '#fbbf24',

  // ⚠️ İade moru koyu temada AÇILIYOR: #7c3aed koyu lacivert zeminde
  // neredeyse siyah okunuyordu. (Gerekçenin tamamı açık temada.)
  iadeRengi: '#a78bfa',

  // ⭐ YENİ (GV/Faz 1) — lacivert dolu yüzey, koyu tema karşılığı.
  //
  // ⚠️ Açık temadaki değer (#12294b) burada KULLANILAMAZ: koyu
  // temada o değer zaten kartArka. Giriş ekranının bandı kartla
  // aynı renk olsaydı band diye bir şey görünmezdi. Bir basamak
  // açıldı.
  lacivertYuzey: '#22376e',
  lacivertYuzeyUstuYazi: '#e8eefb',

  // ⚠️ Koyu temada pasif sekme rengi, açık temadakinden FARKLI
  // olmak zorunda değil ama olmalı: çubuk zemini burada daha açık
  // (#22376e), aynı gri orada yeterli kontrastı vermiyor.
  lacivertYuzeyPasif: '#8fa0c9',

  // ⭐ YENİ — yumuşak zeminler, koyu tema karşılıkları.
  //
  // Opaklık açık temadakinden YÜKSEK (0.16 vs 0.10) — bilinçli.
  // Koyu zeminde düşük opaklıklı bir renk neredeyse kaybolur;
  // aynı sayıyı kullansaydık rozetler koyu temada görünmez olurdu.
  yumusakBasari: 'rgba(74, 222, 128, 0.16)',
  yumusakUyari: 'rgba(251, 191, 36, 0.16)',
  yumusakHata: 'rgba(255, 107, 107, 0.16)',
  yumusakVurgu: 'rgba(255, 107, 53, 0.18)',

  // ⚠️ Koyu temada biraz daha güçlü: koyu lacivert zeminde düşük
  // saydamlıktaki turuncu kayboluyor.
  vurguSerit: 'rgba(255, 107, 53, 0.34)',

  // İndirim rozeti koyu temada bir tık açık: koyu zeminde koyu
  // kırmızı okunmuyor.
  indirimArka: '#ef4444',
  indirimYazi: '#ffffff',

  iskeletArka: '#1b3a63',

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
