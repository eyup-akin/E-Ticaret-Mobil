// Rol bazlı isimler kullanıyoruz ("beyaz" değil "arkaPlan"),
// çünkü dark temada aynı rol farklı renk olacak.

export const acikTema = {
  ad: 'acik',

  anaRenk: '#2563eb',        // mavi
  anaRenkKoyu: '#1d4ed8',    // koyu mavi
  anaRenkUstuYazi: '#ffffff',   // ana renk butonun üstündeki yazı

  arkaPlan: '#ffffff',
  kartArka: '#ffffff',
  acikKart: '#f8f8f8',
  acikGri: '#f2f2f2',

  yaziKoyu: '#333333',
  yaziOrta: '#666666',
  yaziGri: '#999999',

  kenarlik: '#eeeeee',
  inputKenar: '#dddddd',

  basari: '#27ae60',
  pasif: '#cccccc',

  favoriRenk: '#e74c3c',   // kalp her zaman kırmızı — temadan bağımsız
};

export const koyuTema = {
  ad: 'koyu',

  anaRenk: '#3b82f6',        // koyu temada biraz daha açık mavi (okunurluk için)
  anaRenkKoyu: '#2563eb',
  anaRenkUstuYazi: '#ffffff',

  arkaPlan: '#121212',
  kartArka: '#1e1e1e',
  acikKart: '#2a2a2a',
  acikGri: '#2a2a2a',

  yaziKoyu: '#f5f5f5',    // dark'ta "koyu yazı" aslında açık renk olur
  yaziOrta: '#b0b0b0',
  yaziGri: '#888888',

  kenarlik: '#333333',
  inputKenar: '#444444',

  basari: '#2ecc71',
  pasif: '#555555',

  favoriRenk: '#e74c3c',   // kalp her zaman kırmızı — temadan bağımsız
};

// İleride buraya yeni tema ekleyebilirsin (mavi tema, yeşil tema...)
export const temalar = {
  acik: acikTema,
  koyu: koyuTema,
};