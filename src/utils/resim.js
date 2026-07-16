import { SUNUCU_URL } from '../services/config';

// Backend göreli yol döndürüyor:  "/uploads/urunler/a3f9.jpg"
// Telefonun ihtiyacı olan tam adres: "http://10.242.83.204:5289/uploads/urunler/a3f9.jpg"
export function resimUrl(yol) {
  // Resim hiç yoksa null dön → kart tarafında harf placeholder'ına düşeceğiz
  if (!yol) {
    return null;
  }

  // Zaten tam adresse (http ile başlıyorsa) dokunma
  if (yol.startsWith('http')) {
    return yol;
  }

  // Göreli yolun başına sunucu adresini ekle
  return SUNUCU_URL + yol;
}