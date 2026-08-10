// ============================================================
//  KAMPANYALAR — ana sayfadaki banner şeridi ve detay ekranı
//
//  ⚠️⚠️ BU VERİ GEÇİCİ VE YERELDİR.
//
//  Bizde kampanya diye bir kavram YOK: ne tablo, ne uç, ne admin
//  ekranı, ne görsel yükleme. Yol haritasında **B2** olarak onay
//  bekliyor.
//
//  ⚠️ KUPON KODLARI GERÇEK. Bu dosyadaki kodların karşılığı
//  veritabanında var; müşteri kopyalayıp sepette kullanabiliyor.
//  Sahte kupon kodu göstermek, müşteriye tutmayacağımız bir söz
//  vermek olurdu — kampanya metni uydurma olabilir ama İNDİRİM
//  UYDURULMAZ.
//
//  ---- B2 GELDİĞİNDE NE DEĞİŞECEK ----
//  Yalnızca bu dosya: iki fonksiyon birer apiGet çağrısına
//  dönüşecek. Şerit, detay ekranı ve ana sayfa değişmeyecek.
// ============================================================

// ⚠️ NEDEN "kampanyalar" ADI, "bannerlar" DEĞİL?
//
// Banner bir GÖRSEL; kampanya ise arkasındaki iş. Detay ekranı
// açıldığında müşteri banner'ı değil kampanyayı okuyor: koşullar,
// tarih, kupon kodları. Değişkeni "banner" diye adlandırmak, bir
// gün kampanyaya görselsiz bir giriş noktası eklendiğinde adı
// yalan söyler hale getirirdi.
const kampanyalar = [
  {
    id: 'kara-cuma',
    gorsel: require('../../assets/bannerlar/kara-cuma.jpg'),
    baslik: 'Kara Cuma Şenliği',
    kisaAciklama: 'Yılın en büyük indirimleri ve özel kuponlar',
    bitisMetni: '30 Kasım’a kadar',

    aciklama:
      'Yılın en çok beklenen alışveriş haftası başladı. Seçili ' +
      'kategorilerde binlerce ürün indirimde; üstüne aşağıdaki ' +
      'kuponlardan birini uygulayarak sepetini daha da ucuza ' +
      'getirebilirsin. Kuponlar stoklarla sınırlıdır.',

    kuponKodlari: ['KAFAGEL300', 'SUPER50'],

    kosullar: [
      'Kuponlar aynı siparişte birlikte kullanılamaz.',
      'Her kupon hesap başına bir kez geçerlidir.',
      'İptal edilen siparişlerde kupon hakkı iade edilmez.',
    ],
  },
  {
    id: 'efsane-kasim',
    gorsel: require('../../assets/bannerlar/efsane-kasim.jpg'),
    baslik: 'Efsane Kasım',
    kisaAciklama: 'Kasım boyunca geçerli özel kupon fırsatları',
    bitisMetni: 'Kasım ayı boyunca',

    aciklama:
      'Kasım ayı boyunca tüm kategorilerde geçerli kupon ' +
      'fırsatları seni bekliyor. Sepetini hazırla, kodu uygula, ' +
      'indirimi anında gör. Kampanya süresince stoklar hızla ' +
      'tükeniyor.',

    kuponKodlari: ['EFSANE300', 'KASIM50'],

    kosullar: [
      'Kuponlar aynı siparişte birlikte kullanılamaz.',
      'Her kupon hesap başına bir kez geçerlidir.',
      'Kampanya süresi mağaza tarafından uzatılabilir.',
    ],
  },
  {
    id: 'hosgeldin',
    gorsel: require('../../assets/bannerlar/hosgeldin.jpg'),
    baslik: 'Yeni Üyemiz Hoş Geldin',
    kisaAciklama: 'İlk alışverişine özel indirimler',
    bitisMetni: 'Üyeliğinden itibaren 30 gün',

    aciklama:
      'Aramıza yeni katıldıysan ilk alışverişin bizden hediyeli. ' +
      'Aşağıdaki kuponları sepetinde kullanarak ilk siparişini ' +
      'indirimli tamamlayabilirsin.',

    kuponKodlari: ['HOSGELDIN300', 'ILKADIM50'],

    kosullar: [
      'Yalnızca ilk siparişte geçerlidir.',
      'Kuponlar aynı siparişte birlikte kullanılamaz.',
    ],
  },
];

// ⚠️ async — bugün beklemeye gerek yok ama B2 geldiğinde ağdan
// gelecek. Şimdiden async yazmak, o gün çağrı yerlerinin
// değişmemesini sağlıyor.
export async function kampanyalariGetir() {
  return kampanyalar;
}

export async function kampanyaGetir(id) {
  return kampanyalar.find((k) => k.id === id) ?? null;
}
