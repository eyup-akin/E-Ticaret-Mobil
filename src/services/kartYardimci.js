// Kullanıcı yazdıkça "MM/YY" formatına sokar. Örnek: "0531" -> "05/31"
export function tarihFormatla(girdi) {
  // Sadece rakamları al
  const rakamlar = girdi.replace(/\D/g, '');

  if (rakamlar.length === 0) return '';
  if (rakamlar.length <= 2) return rakamlar;

  const ay = rakamlar.slice(0, 2);
  const yil = rakamlar.slice(2, 4);
  return ay + '/' + yil;
}

// "05/31" -> { ay: 5, yil: 2031 }  (backend 4 haneli yıl bekliyor)
export function tarihiParcala(metin) {
  const rakamlar = metin.replace(/\D/g, '');
  if (rakamlar.length !== 4) return null;

  const ay = parseInt(rakamlar.slice(0, 2), 10);
  const kisaYil = parseInt(rakamlar.slice(2, 4), 10);

  if (ay < 1 || ay > 12) return null;

  // 31 -> 2031, 05 -> 2005 değil 2005 saçma olur; hep 2000'li yıllar
  const yil = 2000 + kisaYil;

  return { ay: ay, yil: yil };
}

// Kart numarasını 4'erli gruplar halinde gösterir: "4111111111111111" -> "4111 1111 1111 1111"
export function numaraFormatla(girdi) {
  const rakamlar = girdi.replace(/\D/g, '').slice(0, 16);
  const gruplar = rakamlar.match(/.{1,4}/g);
  return gruplar ? gruplar.join(' ') : '';
}

// Formatlı numaradan sadece rakamları çıkarır (backend'e giderken)
export function numarayiTemizle(metin) {
  return metin.replace(/\D/g, '');
}