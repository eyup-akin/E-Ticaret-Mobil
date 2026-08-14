/* ============================================================
 *  TÜRKİYE İLLERİ
 *
 *  ⚠️ NEDEN 81'İN HEPSİ, NEDEN "İLK 20" DEĞİL?
 *
 *  Liste 81 kısa metin — sıkıştırılmadan ~1 KB. Paket boyutunda
 *  ölçülebilir bir etkisi yok (tek bir ürün görseli bunun binlerce
 *  katı). Kısa tutmanın tek sonucu, listede kendi ilini bulamayan
 *  müşterinin adres KAYDEDEMEMESİ olurdu — kazanılan bir kilobayt
 *  için kaybedilen bir sipariş.
 *
 *  ⚠️ NEDEN SUNUCUDAN ÇEKİLMİYOR?
 *
 *  Bu liste değişmiyor: son il 2000'de kuruldu. Uç açmak her adres
 *  formunda bir ağ turu ve internet kopukken adres girilememesi
 *  demekti. Değiştiği gün (ki değişmeyecek) bu dosya güncellenir.
 *
 *  ⚠️ İLÇE VE MAHALLE YOK. Onlar ~970 ve on binlerce kayıt; o
 *  ölçekte veri gerçekten sunucuya ait. Sunucudaki `city` alanı da
 *  tek bir metin — ilçe eklemek veri modelini değiştirmeyi
 *  gerektirir.
 *
 *  ⚠️ SIRA PLAKA DEĞİL ALFABETİK: müşteri ili ADIYLA arıyor.
 *  Türkçe sıralama farkı önemli — "Iğdır" ile "İstanbul" arasındaki
 *  fark ancak tr-TR harmanlamasıyla doğru çıkıyor.
 * ============================================================ */
export const SEHIRLER = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya',
  'Ankara', 'Antalya', 'Ardahan', 'Artvin', 'Aydın', 'Balıkesir',
  'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis',
  'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane',
  'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 'İzmir',
  'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu',
  'Kayseri', 'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kilis',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin',
  'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu',
  'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
  'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon',
  'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
];

/* Aramada karşılaştırma için sadeleştirme.
 *
 * ⚠️ TÜRKÇE KARAKTERLER ŞART.
 *
 * Müşteri telefon klavyesinde "istanbul", "canakkale", "sanliurfa"
 * yazıyor — şapkasız, noktasız. Düz `toLowerCase()` ile
 * karşılaştırsaydık bu üç il HİÇBİR ARAMADA çıkmazdı ve müşteri
 * "ilim listede yok" sanırdı.
 *
 * ⚠️ 'I' → 'i' dönüşümü için `toLocaleLowerCase('tr-TR')`
 * KULLANILMIYOR, elle eşleştiriliyor. Sebep: tr-TR kuralında
 * 'I'.toLowerCase() = 'ı' oluyor ve kullanıcı "Isparta" ararken
 * yazdığı 'i' ile kayıttaki 'ı' eşleşmiyordu. Burada amaç dilbilimsel
 * doğruluk değil, ARAMANIN TUTMASI — o yüzden hepsi ASCII karşılığına
 * indiriliyor.
 */
export function sadelestir(metin) {
  return (metin || '')
    .replace(/[İIı]/g, 'i')
    .replace(/[Şş]/g, 's')
    .replace(/[Ğğ]/g, 'g')
    .replace(/[Üü]/g, 'u')
    .replace(/[Öö]/g, 'o')
    .replace(/[Çç]/g, 'c')
    .replace(/[Ââ]/g, 'a')
    .toLowerCase()
    .trim();
}

/* Arama metnine uyan illeri döndürür.
 *
 * ⚠️ `includes`, `startsWith` DEĞİL: "urfa" yazan müşteri
 * "Şanlıurfa"yı bulabilmeli. Başlangıçla eşleştirseydik il adının
 * tamamını bilmek gerekirdi.
 *
 * ⚠️ Arama boşsa TÜM liste dönüyor — filtrelemeden önce de seçim
 * yapılabilsin diye.
 */
export function sehirAra(arama) {
  const kelime = sadelestir(arama);

  if (kelime === '') {
    return SEHIRLER;
  }

  return SEHIRLER.filter((s) => sadelestir(s).includes(kelime));
}
