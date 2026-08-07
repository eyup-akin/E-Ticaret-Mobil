// Backend'in adresi. TELEFONDAN erişildiği için "localhost" DEĞİL,
// bilgisayarının ağdaki IP adresini yazıyoruz (ipconfig'den bulduğun).
//export const API_URL = "http://192.168.1.103:5289/api"; //yiğitin ev

//export const API_URL = "http://10.242.83.204:5289/api"; //eduroam

//export const API_URL = "http://192.168.1.199:5289/api"; //alternet


// Backend'in adresi TELEFONDAN erişildiği için "localhost" DEĞİL,
// bilgisayarının ağdaki IP adresini kullanıyoruz.
//
// IP artık kodun içinde gömülü DEĞİL — proje kökündeki .env dosyasından geliyor.
// Ağ değişince sadece .env'deki IP'yi düzelt + Expo'yu yeniden başlat.
//
// EXPO_PUBLIC_ önekli değişkenler Expo tarafından otomatik okunur.
// .env okunamazsa (nadiren) sağdaki yedek IP devreye girer.
const IP = process.env.EXPO_PUBLIC_API_IP || '192.168.1.199';

// SUNUCU_URL → resimler için:   http://10.242.83.204:5289/uploads/urunler/a3f9.jpg
export const SUNUCU_URL = 'http://' + IP + ':5289';

// API_URL → veri istekleri için: http://10.242.83.204:5289/api/products
export const API_URL = SUNUCU_URL + '/api';