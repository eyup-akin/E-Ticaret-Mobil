// Backend'in adresi TELEFONDAN erişildiği için "localhost" DEĞİL,
// bilgisayarının ağdaki IP adresini kullanıyoruz.
//
// IP kodun içinde gömülü DEĞİL — proje kökündeki .env dosyasından geliyor.
// Ağ değişince sadece .env'deki IP'yi düzelt + Expo'yu yeniden başlat.
//
// EXPO_PUBLIC_ önekli değişkenler Expo tarafından otomatik okunur.
//
// ⭐ DEĞİŞTİ — SABİT YEDEK IP KALDIRILDI.
//
// ⚠️ Eskiden burada `|| '192.168.1.199'` vardı. .env okunamadığında
// uygulama SESSİZCE o eski ev ağına bağlanmaya çalışıyor ve "Sunucuya
// ulaşılamadı" veriyordu. Geliştirici .env'i doğru sandığı için hatayı
// yanlış yerde arıyordu.
//
// Artık eksik yapılandırma açıkça patlıyor: sessiz yanlış davranış
// yerine gürültülü doğru hata. (Yorum satırı olarak duran üç eski IP
// de silindi — git zaten hatırlıyor.)
const IP = process.env.EXPO_PUBLIC_API_IP;

if (!IP) {
  throw new Error(
    'EXPO_PUBLIC_API_IP tanımlı değil. Proje kökünde .env dosyası var mı? ' +
    'Örnek: EXPO_PUBLIC_API_IP=192.168.1.42 — ekledikten sonra "npx expo start -c" ile başlat.'
  );
}

// SUNUCU_URL → resimler için:   http://10.242.83.204:5289/uploads/urunler/a3f9.jpg
export const SUNUCU_URL = 'http://' + IP + ':5289';

// API_URL → veri istekleri için: http://10.242.83.204:5289/api/products
export const API_URL = SUNUCU_URL + '/api';