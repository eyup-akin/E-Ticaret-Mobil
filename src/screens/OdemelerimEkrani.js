import React, { useState, useEffect } from 'react';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';
import { View, Text, SectionList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import BosDurum from '../components/BosDurum';
import { paraBicimle, tarihBicimle } from '../utils/bicimlendir';

/* ⭐ YENİ (GV/Faz 7.9) — ÖDEMELERİ AYA GÖRE GRUPLA.
 *
 * Tasarım ödeme geçmişini "Ağustos 2026" gibi ay başlıklarıyla
 * bölüyor. Tek uzun liste, "geçen ay ne kadar harcadım" sorusunu
 * cevaplamıyordu.
 *
 * ⚠️ Gruplama İSTEMCİDE yapılıyor, sunucudan gruplu veri
 * istenmiyor. Sebep: liste zaten tarihe göre sıralı geliyor ve
 * gruplama tamamen GÖRÜNÜME ait bir karar. Sunucuya taşısaydık ay
 * adlarının dili ve biçimi backend'e sızardı.
 *
 * ⚠️ Dizinin sırasına güveniliyor (sunucu tarihe göre veriyor);
 * burada yeniden sıralamıyoruz. Sıralama kuralı iki yerde yaşarsa
 * bir gün ayrışır.
 */
function ayaGoreGrupla(odemeler) {
  const gruplar = [];

  for (const odeme of odemeler) {
    const tarih = new Date(odeme.paidAt);

    // ⚠️ Anahtar olarak görünen metni DEĞİL yıl-ay'ı kullanıyoruz.
    // Metni anahtar yapsaydık iki farklı yılın aynı ayı ("Ağustos")
    // tek grupta birleşirdi.
    const anahtar = tarih.getFullYear() + '-' + tarih.getMonth();

    const baslik = tarih.toLocaleDateString('tr-TR', {
      month: 'long',
      year: 'numeric',
    });

    const sonGrup = gruplar[gruplar.length - 1];

    if (sonGrup && sonGrup.anahtar === anahtar) {
      sonGrup.data.push(odeme);
    } else {
      gruplar.push({ anahtar, baslik, data: [odeme] });
    }
  }

  return gruplar;
}

export default function OdemelerimEkrani({ navigation }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [odemeler, setOdemeler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    async function getir() {
      try {
        const veri = await apiGet('/payments');
        setOdemeler(veri);
      } catch (hata) {
        console.log('Ödemeler alınamadı:', hata.message);
      } finally {
        setYukleniyor(false);
      }
    }
    getir();
  }, []);

  // Başarılı ödemeler toplamı ve iade toplamı.
  //
  // ⚠️ Bu iki sayı LİSTEDEN türetiliyor ve bu bilinçli: ekranda
  // gösterilen ödemelerin toplamı, ekranda gösterilen ödemelerden
  // çıkmalı. Sunucudan ayrı bir toplam isteseydik, liste sayfalandığı
  // gün "toplam 12.000 ₺" yazarken altta 3 satır görünürdü.
  const toplamOdenen = odemeler
    .filter((o) => o.status === 'basarili')
    .reduce((t, o) => t + o.amount, 0);

  const toplamIade = odemeler
    .filter((o) => o.status === 'iade')
    .reduce((t, o) => t + o.amount, 0);

  const bolumler = ayaGoreGrupla(odemeler);

  function odemeSatiri({ item }) {
    const iade = item.status === 'iade';
    const renk = iade ? renkler.iadeRengi : renkler.basari;

    return (
      <TouchableOpacity
        style={styles.kart}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('SiparisDetay', { siparisId: item.orderId })}
      >
        {/* ⚠️ İkon iadede ters ok, ödemede tik: renk tek başına bilgi
            taşımamalı — renk körü kullanıcı ikisini ayırt edebilmeli. */}
        <View style={[styles.ikon, { backgroundColor: renkler.acikKart }]}>
          <Ionicons
            name={iade ? 'arrow-undo-outline' : 'checkmark'}
            size={18}
            color={renk}
          />
        </View>

        <View style={styles.orta}>
          <Text style={styles.durumYazi}>{iade ? 'İade Edildi' : 'Ödeme Alındı'}</Text>
          <Text style={styles.tarih}>{tarihBicimle(item.paidAt)}</Text>
        </View>

        <View style={styles.sag}>
          {/* İade tutarının başındaki eksi, işaretin kendisi. Rengi
              göremeyen de yönü okuyabiliyor. */}
          <Text style={[styles.tutar, { color: renk }]}>
            {iade ? '−' : ''}{paraBicimle(item.amount)}
          </Text>
          <Text style={styles.kartBilgi}>•••• {item.cardLast4}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.kapsayici} edges={['top']}>
      <View style={styles.ustBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.geriButon}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={24} color={renkler.yaziKoyu} />
        </TouchableOpacity>
        <Text style={styles.ustBaslik}>Ödemelerim</Text>
      </View>

      {yukleniyor ? (
        <View style={styles.ortala}>
          <ActivityIndicator size="large" color={renkler.anaRenk} />
        </View>
      ) : odemeler.length === 0 ? (
        <BosDurum
          ikon="wallet-outline"
          baslik="Henüz ödeme geçmişin yok"
          aciklama="İlk siparişini verdiğinde ödemelerin burada listelenecek."
        />
      ) : (
        <SectionList
          sections={bolumler}
          keyExtractor={(item) => item.id.toString()}
          renderItem={odemeSatiri}
          renderSectionHeader={({ section }) => (
            <Text style={styles.ayBaslik}>{section.baslik}</Text>
          )}
          contentContainerStyle={styles.liste}
          /* ⚠️ Ay başlıkları yapışkan DEĞİL. Yapışkan başlık uzun
             listelerde işe yarar; burada ayda birkaç ödeme var ve
             ekranda sürekli duran bir şerit yer kaplardı. */
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            /* ⭐ DEĞİŞTİ (GV/Faz 7.9) — İKİ ÖZET KARO.

               ⚠️ İade karosu yalnızca iade VARSA çiziliyor. "İade
               Edilen: 0,00 ₺" yazmak, hiç iadesi olmayan müşteriye
               boşuna bir kavram öğretmek olurdu. */
            <View style={styles.ozet}>
              <View style={styles.ozetKaro}>
                <Text style={styles.ozetEtiket}>Toplam Ödenen</Text>
                <Text style={styles.ozetDeger}>{paraBicimle(toplamOdenen)}</Text>
              </View>

              {toplamIade > 0 && (
                <View style={styles.ozetKaro}>
                  <Text style={styles.ozetEtiket}>İade Edilen</Text>
                  <Text style={[styles.ozetDeger, { color: renkler.iadeRengi }]}>
                    {paraBicimle(toplamIade)}
                  </Text>
                </View>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kapsayici: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },

  ortala: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: renkler.arkaPlan,
  },

  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    paddingHorizontal: sayfaKenari,
    paddingVertical: bosluk.orta,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  geriButon: {
    width: 32,
  },

  ustBaslik: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  liste: {
    padding: sayfaKenari,
    paddingBottom: bosluk.genis,
  },


  /* ---------- ÖZET KAROLAR ---------- */

  ozet: {
    flexDirection: 'row',
    gap: bosluk.orta,
    marginBottom: bosluk.normal,
  },

  ozetKaro: {
    flex: 1,
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
  },

  ozetEtiket: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginBottom: bosluk.mikro,
  },

  /* ⚠️ Turuncu değil. Bu ekranda tıklanabilir olan ödeme kartları;
     özet karoları basılamaz ve turuncu bu uygulamada eylem demek. */
  ozetDeger: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },


  /* ---------- AY BAŞLIĞI ---------- */

  ayBaslik: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziGri,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: bosluk.orta,
    marginBottom: bosluk.kucuk,
  },


  /* ---------- ÖDEME KARTI ---------- */

  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.orta,
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    borderWidth: 1,
    borderColor: renkler.kenarlik,
    padding: bosluk.normal,
    marginBottom: bosluk.kucuk,
  },

  ikon: {
    width: 40,
    height: 40,
    borderRadius: kose.tam,
    justifyContent: 'center',
    alignItems: 'center',
  },

  orta: {
    flex: 1,
    minWidth: 0,
  },

  durumYazi: {
    fontSize: yazi.normal,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
    color: renkler.yaziKoyu,
  },

  tarih: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },

  sag: {
    alignItems: 'flex-end',
  },

  tutar: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },

  kartBilgi: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },
});
