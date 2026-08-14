/* ============================================================
 *  TANIMSIZ DEĞİŞKEN KONTROLÜ
 *
 *  Kullanım:
 *      npm run kontrol
 *      node tanimsiz-kontrol.cjs src/screens/KayitEkrani.js
 *
 *  ⚠️⚠️ NEDEN VAR? GERÇEK BİR HATADAN SONRA YAZILDI.
 *
 *  KayitEkrani'nda toplu bir düzenleme sırasında state tanımları
 *  yanlışlıkla silindi. Ekran açılır açılmaz
 *  "Property 'alanHatasi' doesn't exist" ile patladı.
 *
 *  ⚠️ METRO BUNU YAKALAMAZ. Paketleme yalnızca SÖZDİZİMİNİ
 *  doğruluyor; tanımsız bir değişken geçerli JavaScript'tir ve hata
 *  ancak o satır ÇALIŞTIĞINDA ortaya çıkar. Yani "bundle HTTP 200"
 *  bu hata sınıfı için hiçbir şey kanıtlamıyor — o güvenin bedeli
 *  cihazda kırmızı ekran oldu.
 *
 *  Bu araç dosyayı gerçekten ayrıştırıp (Babel) her referansın bir
 *  tanıma bağlanıp bağlanmadığına bakıyor.
 *
 *  ⚠️ ESLint DEĞİL — bilerek. Projede ESLint kurulu değil ve
 *  yalnızca bu kontrol için tüm eklenti zincirini kurmak, package.json'a
 *  onlarca bağımlılık eklemek demekti. Babel zaten Metro ile birlikte
 *  geliyor; bu dosyanın ek bir bağımlılığı yok.
 * ============================================================ */
const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const path = require('path');

/* Ortamın sağladığı adlar.
 *
 * ⚠️ Liste ELLE tutuluyor ve eksik olabilir. Eksik bir ad YANLIŞ
 * ALARM üretir (zararsız, fark edilir); fazladan bir ad ise gerçek
 * bir hatayı GİZLER. O yüzden buraya bir şey eklerken "bu gerçekten
 * her yerde var mı?" diye sormak gerekiyor. */
const GLOBALLER = new Set([
  'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'require', 'module', 'process', 'global', 'globalThis', 'fetch', 'FormData',
  'Promise', 'JSON', 'Math', 'Number', 'String', 'Object', 'Array', 'Date',
  'Boolean', 'Error', 'RegExp', 'Map', 'Set', 'Symbol', 'Infinity', 'NaN',
  'undefined', '__DEV__', 'URL', 'URLSearchParams', 'Image', 'isNaN',
  'parseInt', 'parseFloat', 'encodeURIComponent', 'decodeURIComponent',
  'AbortController', 'TextEncoder', 'TextDecoder', 'Intl', 'WeakMap',

  /* ⚠️ Web tarafı globalleri. Uygulama Expo web'de de çalışıyor ve
     `services/guvenliDepo.js` bunları `Platform.OS === 'web'`
     dalında kullanıyor — cihazda o dal hiç çalışmıyor. */
  'localStorage', 'sessionStorage', 'window', 'document', 'navigator',
]);

/* Argüman verilmezse `src` altındaki tüm .js dosyaları taranır.
 *
 * ⚠️ GLOB KULLANILMIYOR (joker karakterli desen). npm betikleri Windows'ta
 * cmd üzerinden çalışıyor ve cmd joker karakterleri AÇMIYOR; desen
 * dosya adı sanılıp "ENOENT: src/screens/*.js" hatası veriyordu.
 * Klasörü kendimiz dolaşmak her platformda aynı çalışıyor. */
function jsDosyalari(klasor) {
  const sonuc = [];

  for (const girdi of fs.readdirSync(klasor, { withFileTypes: true })) {
    const tam = path.join(klasor, girdi.name);

    if (girdi.isDirectory()) {
      sonuc.push(...jsDosyalari(tam));
    } else if (girdi.name.endsWith('.js')) {
      sonuc.push(tam);
    }
  }

  return sonuc;
}

const argumanlar = process.argv.slice(2);
const dosyalar = argumanlar.length > 0 ? argumanlar : jsDosyalari('src');

let toplamHata = 0;

for (const yol of dosyalar) {
  let ast;

  try {
    ast = parser.parse(fs.readFileSync(yol, 'utf8'), {
      sourceType: 'module',
      plugins: ['jsx', 'classProperties'],
    });
  } catch (e) {
    console.log(`SÖZDİZİMİ HATASI  ${yol}\n  ${e.message}`);
    toplamHata++;
    continue;
  }

  const bulunanlar = [];

  traverse(ast, {
    /* ⚠️ `ReferencedIdentifier`, düz `Identifier` DEĞİL.
       Düz ziyaret nesne anahtarlarını (`{ ad: 1 }`), etiketleri ve
       tanımların kendisini de yakalar; hepsi yanlış alarm olurdu. */
    ReferencedIdentifier(path) {
      const ad = path.node.name;

      if (GLOBALLER.has(ad)) return;
      if (path.scope.hasBinding(ad, true)) return;

      bulunanlar.push({ ad, satir: path.node.loc && path.node.loc.start.line });
    },
  });

  if (bulunanlar.length > 0) {
    console.log(`\n${yol}`);

    const gorulen = new Set();

    for (const x of bulunanlar) {
      const anahtar = `${x.ad}:${x.satir}`;
      if (gorulen.has(anahtar)) continue;

      gorulen.add(anahtar);
      console.log(`  satır ${x.satir}: '${x.ad}' TANIMSIZ`);
      toplamHata++;
    }
  }
}

console.log(
  toplamHata === 0
    ? `\nTemiz — ${dosyalar.length} dosyada tanımsız referans yok.`
    : `\n${toplamHata} tanımsız referans bulundu.`
);

process.exit(toplamHata === 0 ? 0 : 1);
