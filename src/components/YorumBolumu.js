import React, { useState, useEffect } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiGet, apiPost } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { tarihBicimle } from '../utils/bicimlendir';
import Yildizlar from './Yildizlar';

// Ürün detayındaki tüm yorum işleri burada.
// urunId: hangi ürün · onDegisti: yorum eklenince parent ürünü tazelesin (ortalama puan / favori sayısı)
export default function YorumBolumu({ urunId, onDegisti }) {
  const { token } = useAuth();
  const { renkler } = useTema();
  const navigation = useNavigation();
  const styles = stilOlustur(renkler);

  const [yorumlar, setYorumlar] = useState([]);

  // ⭐ YENİ (GV/Faz 5.7 · B5) — puan dağılımı (5/4/3/2/1).
  //
  // ⚠️ Yorum listesinden TÜRETİLMİYOR, sunucudan geliyor. Burada
  // sayabilirdik ama listeye bir gün sayfalama eklendiğinde ekrandaki
  // 10 yorumu sayar ve "toplam 42 değerlendirme" yazan satırla
  // çelişirdi. Sayım kimin elindeyse dağılım da onun.
  const [dagilim, setDagilim] = useState([]);

  const [durum, setDurum] = useState(null);
  const [yeniPuan, setYeniPuan] = useState(0);
  const [yeniYorum, setYeniYorum] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  async function yorumlariGetir() {
    try {
      const veri = await apiGet('/products/' + urunId + '/reviews');

      // ⭐ DEĞİŞTİ (B5) — uç artık düz dizi değil, { yorumlar, dagilim }
      // döndürüyor. Tek istekte iki bilgi: bölüm ikisini birden
      // çiziyor, ayrı uç ikinci bir istek demekti.
      //
      // ⚠️ || [] güvenliği duruyor: alan hiç gelmezse map çağrısı
      // "undefined is not a function" ile ekranı komple düşürürdü.
      setYorumlar(veri.yorumlar || []);
      setDagilim(veri.dagilim || []);
    } catch {}
  }

  async function durumuGetir() {
    if (!token) { setDurum(null); return; }
    try {
      const veri = await apiGet('/products/' + urunId + '/reviews/durum');
      setDurum(veri);
    } catch { setDurum(null); }
  }

  useEffect(() => { yorumlariGetir(); }, [urunId]);
  useEffect(() => { durumuGetir(); }, [urunId, token]);

  async function yorumGonder() {
    if (yeniPuan < 1) { Alert.alert('Uyarı', 'Lütfen yıldızlara dokunarak bir puan seç.'); return; }
    if (yeniYorum.trim().length === 0) { Alert.alert('Uyarı', 'Lütfen yorumunu yaz.'); return; }
    try {
      setGonderiliyor(true);
      await apiPost('/products/' + urunId + '/reviews', { rating: yeniPuan, comment: yeniYorum.trim() });
      setYeniPuan(0);
      setYeniYorum('');
      await yorumlariGetir();
      await durumuGetir();
      if (onDegisti) onDegisti();   // parent ürünü tazeler → ortalama puan güncellenir
      Alert.alert('Teşekkürler', 'Yorumun eklendi biladerim!');
    } catch (hata) {
      Alert.alert('Hata', hata.message);
    } finally {
      setGonderiliyor(false);
    }
  }

  function form() {
    if (!token) {
      return (
        <TouchableOpacity style={styles.girisUyari} onPress={() => navigation.navigate('Giris')}>
          <Text style={styles.girisUyariYazi}>Yorum yapmak için giriş yap</Text>
        </TouchableOpacity>
      );
    }
    if (!durum) return null;
    if (durum.zatenYorumladi) return <Text style={styles.durumNot}>Bu ürüne zaten yorum yaptın. Teşekkürler!</Text>;
    if (!durum.teslimAlindi) {
      return <Text style={styles.durumNot}>Yorum yapabilmek için önce ürünü satın alıp teslim almış olman gerekiyor.</Text>;
    }

    return (
      <View style={styles.form}>
        <Text style={styles.formBaslik}>Puanın</Text>
        <Yildizlar deger={yeniPuan} boyut={32} secilebilir onSec={setYeniPuan} />
        <TextInput
          style={styles.formInput}
          placeholder="Ürün hakkındaki düşüncelerin..."
          placeholderTextColor={renkler.yaziGri}
          value={yeniYorum}
          onChangeText={setYeniYorum}
          multiline
        />
        <TouchableOpacity style={[styles.formButon, gonderiliyor && styles.formButonPasif]} onPress={yorumGonder} disabled={gonderiliyor}>
          {gonderiliyor ? <ActivityIndicator color={renkler.anaRenkUstuYazi} /> : <Text style={styles.formButonYazi}>Yorumu Gönder</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  // ⭐ YENİ (GV/Faz 5.7 · B5) — çubukların paydası.
  //
  // ⚠️ Ürünün reviewCount'u KULLANILMIYOR, dağılımın kendi toplamı
  // alınıyor. İki sayı aynı sorgudan gelse bile ayrı isteklerle
  // geliyor; arada bir yorum eklenirse yüzdeler %100'ü aşabilir ya da
  // altında kalabilirdi. Bir oranın payı ve paydası aynı kaynaktan.
  const toplamPuan = dagilim.reduce((t, d) => t + d.adet, 0);

  return (
    <View>
      <Text style={styles.bolumBaslik}>Değerlendirmeler</Text>

      {/* ⭐ YENİ (GV/Faz 5.7 · B5) — PUAN DAĞILIMI ÇUBUKLARI.

          ⚠️ Ayrı bir bileşen yapılmadı: tek tüketicisi burası.
          "Kural tek yerde kullanılıyorsa orada durur; ikinci tüketici
          çıktığı an ortak yere taşınır." İkinci bir ekran puan kırılımı
          isterse `components/`e çıkar.

          ⚠️ Hiç yorum yokken bölüm ÇİZİLMİYOR. Beş boş çubuk, "bu ürün
          kötü puan almış" gibi okunabilecek bir görsel — oysa hiç puan
          almamış.

          ⚠️ Tasarım burada bir de büyük "4.8" ve yıldızları çiziyor.
          Bizde YOK: aynı sayı bu ekranda zaten yukarıdaki bilgi
          kartında duruyor. 5.3'te fiyat için verilen karar bu — aynı
          sayıyı ekranda iki kez çizmiyoruz. Çubuklar yeni bilgi
          taşıyor, ortalama taşımıyor.

          ⚠️ Çubuk rengi yildizRengi: çubuk bir yıldız sayımı ve
          yıldızlarla aynı dili konuşmalı. Turuncu YAPILMADI — turuncu
          eylem demek, bu çubuklar tıklanmıyor. */}
      {toplamPuan > 0 && (
        <View style={styles.dagilim}>
          {dagilim.map((d) => (
            <View key={d.puan} style={styles.dagilimSatir}>
              <Text style={styles.dagilimPuan}>{d.puan}</Text>

              <View style={styles.cubukYol}>
                {/* ⚠️ Yüzde string olarak veriliyor ('40%'): React
                    Native genişlikte oran istiyorsa metin bekler,
                    sayı verirsek 40 PİKSEL olur ve tüm çubuklar
                    aynı boyda çıkardı. */}
                <View style={[styles.cubukDolu, { width: `${(d.adet / toplamPuan) * 100}%` }]} />
              </View>

              {/* ⚠️ Sayı gösteriliyor, tasarımda yok.
                  Tasarım 1.240 değerlendirmeyle çizilmiş; orada oran
                  tek başına anlamlı. Bizde bir ürünün 2 yorumu var ve
                  tek yorumluk bir çubuk ekranı baştan sona doldurup
                  "%100 beş yıldız" diye okunuyor. Ham sayı o yanılgıyı
                  kapatıyor. */}
              <Text style={styles.dagilimAdet}>{d.adet}</Text>
            </View>
          ))}
        </View>
      )}

      {form()}
      {yorumlar.length === 0 ? (
        <Text style={styles.yorumYok}>Bu ürüne henüz yorum yapılmamış.</Text>
      ) : (
        yorumlar.map((y) => (
          /* ⭐ DEĞİŞTİ (GV/Faz 5.8) — YORUM KARTI YENİDEN KURULDU.

             Eski hali: ad solda, tarih sağda, altında yıldızlar,
             altında metin. Tasarımda ise kimlik bilgisi bir BLOK:
             baş harf avatarı + yanında ad ve yıldızlar. Tarih tek
             başına sağda kalıyor.

             ⚠️ Yıldızlar ADIN ALTINA taşındı: puan yorumcuya ait
             bir ifade, karta değil. Adın altında durunca "bu kişi
             şu kadar verdi" diye okunuyor; ayrı satırdayken kartın
             genel bir özelliği gibi duruyordu. */
          <View key={y.id} style={styles.yorumKart}>
            <View style={styles.yorumUst}>
              {/* ⭐ YENİ — BAŞ HARF AVATARI.

                  ⚠️ Zemin lacivertYuzey, anaRenk DEĞİL.
                  Turuncu bu uygulamada eylem demek; dekoratif bir
                  daireyi turuncu yapmak Faz 1'de düzeltilen hatanın
                  aynısı olurdu (resimsiz ürün yer tutucusu). Bu
                  token zaten "baş harf avatarları" için tanımlanmıştı,
                  ilk tüketicisi burası.

                  ⚠️ Harf toLocaleUpperCase('tr-TR') ile büyütülüyor:
                  varsayılan büyütme "irem" adını "IREM" yapar, doğrusu
                  "İREM". Aynı tuzağa kupon kodu normalleştirmesinde
                  düşülmüştü.

                  ⚠️ Ad boş gelirse '?' — charAt(0) boş string
                  döndürseydi daire içi bomboş kalırdı. */}
              <View style={styles.avatar}>
                <Text style={styles.avatarHarf}>
                  {(y.userName || '?').trim().charAt(0).toLocaleUpperCase('tr-TR') || '?'}
                </Text>
              </View>

              <View style={styles.yorumKimlik}>
                <Text style={styles.yorumKisi} numberOfLines={1}>{y.userName}</Text>
                <Yildizlar deger={y.rating} boyut={14} />
              </View>

              {/* ⚠️ Tarih flexShrink: 0 — uzun adlar tarihi
                  kırpmasın. Kırpılacaksa ad kırpılır (numberOfLines),
                  çünkü tarih tam okunmadığında bilgi değerini
                  tamamen kaybediyor: "11.08.20…" hiçbir şey demiyor. */}
              <Text style={styles.yorumTarih}>{tarihBicimle(y.createdAt)}</Text>
            </View>

            <Text style={styles.yorumMetin}>{y.comment}</Text>
          </View>
        ))
      )}
    </View>
  );
}

/* ⭐ DEĞİŞTİ (GV/Faz 5.8) — DOSYADAKİ TÜM ELLE YAZILI ÖLÇÜLER
   TOKEN'A BAĞLANDI.

   Yorum kartını zaten yeniden kuruyordum ve aynı dosyada yarısı
   token, yarısı sabit sayı bir StyleSheet bırakmak, sonraki
   okuyucuya "burada iki kural var" demek olurdu. Değerlerin çoğu
   ölçeğe zaten oturuyordu (12 → bosluk.orta, 14 → yazi.normal).

   ⚠️ Üç yerde bir basamak KAYMA oldu, bilerek:
     • bolumBaslik 18 → yazi.buyuk (18)  — aynı
     • durumNot / girisUyari köşesi 10 → kose.kucuk (8)
     • form köşesi 12 → kose.orta (12)   — aynı
   Yani gözle görülür tek fark yumuşak kutuların köşesinde 2px.
   Ara değer uydurmak yerine ölçeğe inmek tercih edildi; aynı karar
   AramaCubugu'nda da verilmişti. */
const stilOlustur = (renkler) => StyleSheet.create({
  bolumBaslik: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.orta,
  },

  /* ⭐ YENİ (GV/Faz 5.7 · B5) — puan dağılımı çubukları. */
  dagilim: {
    gap: bosluk.mikro,
    marginBottom: bosluk.normal,
  },

  dagilimSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
  },

  /* ⚠️ Rakamlara sabit genişlik: beş satırın çubukları aynı yerden
     başlamazsa göz uzunlukları karşılaştıramaz — çubuğun tek işi
     zaten karşılaştırma. Sağdaki sayı da aynı sebeple sabit ve sağa
     yaslı; 2 ile 12 alt alta gelince nokta kaymasın. */
  dagilimPuan: {
    width: 10,
    textAlign: 'right',
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
  },

  dagilimAdet: {
    minWidth: 20,
    textAlign: 'right',
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
  },

  /* Boş yol + dolu kısım. Yol acikKart: sayfa zemininden bir tık
     koyu, böylece %0'lık bir satırda bile çubuğun nerede olduğu
     görünüyor. Tamamen görünmez bir yol, sıfırı "veri yok" gibi
     gösterirdi. */
  cubukYol: {
    flex: 1,
    height: 8,
    borderRadius: kose.tam,
    backgroundColor: renkler.acikKart,
    overflow: 'hidden',
  },

  cubukDolu: {
    height: '100%',
    borderRadius: kose.tam,
    backgroundColor: renkler.yildizRengi,
  },

  durumNot: {
    fontSize: yazi.normal,
    lineHeight: satir.normal,
    color: renkler.yaziOrta,
    backgroundColor: renkler.acikKart,
    padding: bosluk.orta,
    borderRadius: kose.kucuk,
    marginBottom: bosluk.normal,
  },

  girisUyari: {
    backgroundColor: renkler.acikKart,
    padding: bosluk.orta,
    borderRadius: kose.kucuk,
    marginBottom: bosluk.normal,
    alignItems: 'center',
  },

  girisUyariYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.anaRenk,
  },

  form: {
    backgroundColor: renkler.acikKart,
    padding: bosluk.orta,
    borderRadius: kose.orta,
    marginBottom: bosluk.normal,
  },

  formBaslik: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
    marginBottom: bosluk.kucuk,
  },

  formInput: {
    borderWidth: 1,
    borderColor: renkler.inputKenar,
    borderRadius: kose.kucuk,
    padding: bosluk.orta,
    marginTop: bosluk.orta,
    marginBottom: bosluk.orta,
    minHeight: 70,
    textAlignVertical: 'top',
    color: renkler.yaziKoyu,
    backgroundColor: renkler.kartArka,
  },

  formButon: {
    backgroundColor: renkler.anaRenk,
    height: 46,
    borderRadius: kose.kucuk,
    justifyContent: 'center',
    alignItems: 'center',
  },

  formButonPasif: { backgroundColor: renkler.pasif },

  formButonYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  yorumYok: {
    fontSize: yazi.normal,
    color: renkler.yaziGri,
    fontStyle: 'italic',
  },

  /* ⭐ DEĞİŞTİ (GV/Faz 5.8) — KART ZEMİNİ arkaPlan, kartArka DEĞİL.

     ⚠️ Bu kart, ürün detayındaki BEYAZ yorum kartının İÇİNDE
     yaşıyor. Zemini de beyaz bırakınca kartın kendisi görünmüyordu;
     ayrımı tek başına 1px kenarlık taşımak zorunda kalıyordu.
     Sayfa zemini rengini kullanmak tasarımın da yaptığı şey ve
     Faz 1'de "beyaz üstünde beyaz kart görünmez" diye zaten
     karara bağlanmıştı. */
  yorumKart: {
    backgroundColor: renkler.arkaPlan,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    borderRadius: kose.orta,
    padding: bosluk.orta,
    marginBottom: bosluk.kucuk,
  },

  /* ⚠️ alignItems: 'flex-start' — 'center' değil.
     Ad iki satıra düşerse (uzun isim) tarih ortada asılı kalmasın;
     ikisi de üst kenardan hizalı başlıyor. */
  yorumUst: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.kucuk,
    marginBottom: bosluk.kucuk,
  },

  /* ⭐ YENİ (GV/Faz 5.8) — baş harf avatarı.

     ⚠️ lacivertYuzey: açık temada bile koyu kalan yüzey. Token
     tam bunun için tanımlanmıştı ve bugüne kadar tüketicisi yoktu.

     ⚠️ 36dp: tasarımda 40, bizde bir tık küçük. Kart bizde daha
     dar (ekran genişliği eksi iki kart dolgusu) ve 40'lık daire
     adın hizasını aşağı itiyordu. */
  avatar: {
    width: 36,
    height: 36,
    borderRadius: kose.tam,
    backgroundColor: renkler.lacivertYuzey,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarHarf: {
    color: renkler.lacivertYuzeyUstuYazi,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  /* Ad + yıldızlar tek blok; kalan genişliği bu alıyor.
     minWidth: 0 olmadan flex çocuğu içeriğinden küçülmüyor ve
     numberOfLines devreye girmiyor — uzun ad tarihi ekrandan
     dışarı iterdi. */
  yorumKimlik: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },

  yorumKisi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  yorumTarih: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    flexShrink: 0,
  },

  yorumMetin: {
    fontSize: yazi.normal,
    color: renkler.yaziOrta,
    lineHeight: satir.normal,
  },
});