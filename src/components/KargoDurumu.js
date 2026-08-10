import React from 'react';
import { font } from '../theme/olculer';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { durumYazisi } from '../utils/durum';
import { tarihBicimle } from '../utils/bicimlendir';

// Sipariş iptalse kırmızı iptal kutusu, değilse kargo adım çubuğu gösterir.
export default function KargoDurumu({ siparis }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const iptalMi = siparis.status === 'iptal';

  // ⭐ DEĞİŞTİ — aşamalar artık düz metin dizisi değil, nesne dizisi.
  //
  // Her aşamanın kendi tarih kaynağı var:
  //   hazirlaniyor  → createdAt   (sipariş oluşturulduğu an)
  //   kargoda       → shippedAt   (admin kargoya verdiği an)
  //   teslim_edildi → deliveredAt (admin teslim işaretlediği an)
  //
  // Neden nesne? Aşama adı ile tarihi ayrı iki dizide tutsaydık
  // ("asamalar" ve "tarihler") ikisinin sırasının aynı kalması
  // bize kalırdı. Araya bir aşama eklendiğinde birini güncelleyip
  // diğerini unutmak çok kolay olurdu. Birlikte değişen veriler
  // birlikte dursun.
  const asamalar = [
    { kod: 'hazirlaniyor',  tarih: siparis.createdAt },
    { kod: 'kargoda',       tarih: siparis.shippedAt },
    { kod: 'teslim_edildi', tarih: siparis.deliveredAt },
  ];

  const suankiIndex = asamalar.findIndex((a) => a.kod === siparis.status);

  if (iptalMi) {
    return (
      <View style={styles.iptalKutu}>
        <View style={styles.iptalUst}>
          <Ionicons name="close-circle" size={22} color="#e74c3c" />
          <Text style={styles.iptalBaslik}>  Sipariş İptal Edildi</Text>
        </View>

        {siparis.cancelledAt ? (
          <Text style={styles.iptalTarih}>{tarihBicimle(siparis.cancelledAt)}</Text>
        ) : null}

        {siparis.cancelReason ? (
          <Text style={styles.iptalSebep}>Sebep: {siparis.cancelReason}</Text>
        ) : null}

        <Text style={styles.iptalIade}>Ödemeniz iade edildi.</Text>
      </View>
    );
  }

  return (
    <View style={styles.kutu}>
      {asamalar.map((asama, i) => {
        const gecti = i <= suankiIndex;

        return (
          <View key={asama.kod} style={styles.asamaSatir}>
            <Ionicons
              name={gecti ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={gecti ? renkler.basari : renkler.yaziGri}
            />

            {/* ⭐ DEĞİŞTİ — yazı ve tarih alt alta olduğu için
                sarmalayıcı View gerekti. Önce tek Text vardı. */}
            <View style={styles.asamaOrta}>
              <Text style={[styles.asamaYazi, gecti && styles.asamaYaziAktif]}>
                {durumYazisi(asama.kod)}
              </Text>

              {/* ⭐ YENİ — tarih.
                  
                  İKİ koşul birden aranıyor:
                  
                  gecti → henüz ulaşılmamış aşamanın tarihi olamaz.
                  Tek başına "asama.tarih" kontrolü yetmezdi çünkü
                  veri bozuksa gelecekteki bir aşamada tarih görünebilirdi.
                  
                  asama.tarih → aşamaya ulaşılmış ama tarih boş olabilir.
                  Bu, biz bu alanları eklemeden ÖNCE kargoya verilmiş
                  eski siparişlerde oluyor: status "kargoda" ama
                  shippedAt null. Eski veriyi kırmadan gösteriyoruz. */}
              {gecti && asama.tarih ? (
                <Text style={styles.asamaTarih}>{tarihBicimle(asama.tarih)}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kutu: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14
  },
  asamaSatir: {
    flexDirection: 'row',

    /* ⭐ DEĞİŞTİ: 'center' → 'flex-start'
       
       Aşama artık iki satır olabiliyor (yazı + tarih). 'center'
       kalsaydı ikonun ortası iki satırın ortasına hizalanır,
       yazının hizasından kayardı. 'flex-start' ikonu ilk satıra
       hizalıyor — göz ikonu ve başlığı aynı çizgide okuyor. */
    alignItems: 'flex-start',
    paddingVertical: 8
  },

  /* ⭐ YENİ — yazı ve tarihi taşıyan sütun */
  asamaOrta: {
    flex: 1,
    marginLeft: 12
  },

  asamaYazi: {
    fontSize: 15,
    color: renkler.yaziGri

    /* marginLeft kaldırıldı — artık asamaOrta veriyor */
  },
  asamaYaziAktif: {
    color: renkler.yaziKoyu,
    fontWeight: '600',
    fontFamily: font.yari,
  },

  /* ⭐ YENİ — aşama tarihi */
  asamaTarih: {
    fontSize: 12,
    color: renkler.yaziGri,
    marginTop: 2
  },

  iptalKutu: {
    backgroundColor: renkler.acikKart,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e74c3c'
  },
  iptalUst: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  iptalBaslik: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: font.kalin,
    color: '#e74c3c'
  },
  iptalTarih: {
    fontSize: 13,
    color: renkler.yaziGri,
    marginBottom: 6
  },
  iptalSebep: {
    fontSize: 14,
    color: renkler.yaziKoyu,
    marginBottom: 6
  },
  iptalIade: {
    fontSize: 14,
    color: renkler.yaziOrta
  }
});