import { useState, useRef, useCallback } from 'react';

// ⭐ YENİ — KAYDIRMAYA GÖRE GİZLENME KURALI
//
// Yüzen bir öğenin ne zaman görünüp ne zaman kaybolacağına karar
// verir. Kararın kendisi burada; nasıl göründüğü (opaklık, kayma,
// süre) çağıran bileşende.
//
// ⚠️ KARMA KURAL — iki cümlenin ikisi de karşılanıyor:
//
//   scrollY <= esik   →  HER ZAMAN GÖRÜNÜR
//                        Sayfanın üstündeyken buton kaybolmamalı;
//                        orada zaten bir şey aramıyoruz.
//
//   scrollY >  esik   →  YÖN BELİRLER
//                        Aşağı iniyorsa gizlen (müşteri ürün
//                        inceliyor), yukarı çıkıyorsa göster
//                        (müşteri geri dönüyor, kısayol işine yarar).
//
// Sadece konum kullansaydık ızgaranın içinde yukarı kaydırmak butonu
// geri getirmezdi. Sadece yön kullansaydık sayfanın en üstünde bile
// aşağı kaydırınca kaybolurdu.
//
// ⚠️ NEDEN ANIMATED DEĞİL DE BOOLEAN DÖNÜYOR?
//
// Kaydırma konumunu bir Animated.Value'ya bağlayıp opaklığı doğrudan
// ondan türetmek de mümkündü (Animated.event + useNativeDriver). Ama
// yön bilgisi "bir önceki konumla karşılaştırma" gerektiriyor ve bu
// interpolasyonla ifade edilemiyor; diffClamp ile edilebilirdi ama o
// zaman da "eşiğin üstünde hep görünür" kuralı kurulamıyordu.
//
// Bu yol daha ucuz: her karede yapılan iş iki sayı karşılaştırması.
// setState YALNIZCA görünürlük DEĞİŞTİĞİNDE çağrılıyor — yani tipik
// bir kaydırmada iki-üç kez, her karede değil. Asıl animasyon
// çağıran tarafta useNativeDriver ile UI iş parçacığında dönüyor,
// JS'e hiç uğramıyor.
export function useKaydirmaGizleme({ esik = 0, titremePayi = 8 } = {}) {
  const [gorunur, setGorunur] = useState(true);

  // ⚠️ State'in ref ikizi. Karşılaştırmayı state üzerinden yapsaydık
  // kapanış (closure) bayat değeri okurdu: kaydirildi fonksiyonu
  // useCallback ile sabitlenmiş durumda ve içindeki `gorunur` son
  // render'ın değeri olurdu.
  const gorunurRef = useRef(true);

  const sonY = useRef(0);

  const kaydirildi = useCallback(
    (y) => {
      const fark = y - sonY.current;

      // ⚠️ TİTREME PAYI — bu satır olmadan buton takır takır yanıp
      // sönüyordu. Parmak ekranda sabit dururken bile kaydırma
      // konumu birkaç piksel oynuyor ve her oynama bir yön
      // değişikliği sayılıyordu.
      //
      // Fark eşiğin altındaysa sonY GÜNCELLENMİYOR — böylece küçük
      // hareketler birikip gerçek bir kaydırmaya dönüşene kadar
      // sayılmıyor.
      if (Math.abs(fark) < titremePayi) {
        return;
      }

      const asagi = fark > 0;
      sonY.current = y;

      const yeniGorunur = y <= esik ? true : !asagi;

      if (yeniGorunur !== gorunurRef.current) {
        gorunurRef.current = yeniGorunur;
        setGorunur(yeniGorunur);
      }
    },
    [esik, titremePayi]
  );

  return { gorunur, kaydirildi };
}
