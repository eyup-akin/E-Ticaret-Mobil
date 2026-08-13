// Backend'in adresi TELEFONDAN erişildiği için "localhost" DEĞİL.
//
// Adres kodun içinde gömülü DEĞİL — proje kökündeki .env'den geliyor.
// EXPO_PUBLIC_ önekli değişkenler Expo tarafından otomatik okunur.
//
// ⭐ DEĞİŞTİ — IP DEĞİL, TAM ADRES.
//
// ⚠️ Eskiden burada `'http://' + IP + ':5289'` kuruluyordu. Şema ve
// port koda gömülü olduğu için HTTPS'li bir alan adına geçmek
// imkânsızdı; Android 9+ ise düz HTTP'yi varsayılan olarak engelliyor.
//
// ⚠️ SABİT YEDEK YOK ve olmayacak: eskiden `|| '192.168.1.199'` vardı,
// .env okunamayınca uygulama SESSİZCE eski ev ağına bağlanıp "sunucuya
// ulaşılamadı" veriyordu ve hata yanlış yerde aranıyordu. Eksik
// yapılandırma açıkça patlasın.
const TABAN = process.env.EXPO_PUBLIC_API_TABAN;

if (!TABAN) {
  throw new Error(
    'EXPO_PUBLIC_API_TABAN tanımlı değil. Proje kökünde .env dosyası var mı? ' +
    'Örnek: EXPO_PUBLIC_API_TABAN=https://ornek.ts.net — ekledikten sonra ' +
    '"npx expo start -c" ile başlat.'
  );
}

// ⚠️ Sondaki eğik çizgi temizleniyor; yoksa adresler "//api" oluyor.
const TEMIZ = TABAN.replace(/\/+$/, '');

// SUNUCU_URL → resimler için:   https://ornek.ts.net/uploads/urunler/a3f9.jpg
export const SUNUCU_URL = TEMIZ;

// API_URL → veri istekleri için: https://ornek.ts.net/api/products
export const API_URL = SUNUCU_URL + '/api';
