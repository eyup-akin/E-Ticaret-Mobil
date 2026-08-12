import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTema } from '../context/TemaContext';
import { paraBicimle } from '../utils/bicimlendir';
import { SUNUCU_URL } from '../services/config';
import { bosluk, kose, yazi, agirlik, satir, font, sayfaKenari } from '../theme/olculer';

/* ⭐ YENİ — KOMBİN ŞERİDİ ("Birlikte iyi gider")
 *
 *   kombinler : [{ id, ad, aciklama, urunler[], normalToplam,
 *                  kombinFiyati, tasarruf, indirimYuzdesi }]
 *   onEkle(kombin) : setin tamamını sepete ekler
 *
 * ⚠️ Lacivert panel — "Sana özel" şeridinin turuncu zemininden
 * BİLEREK farklı. İkisi de dekoratif zeminli ama farklı şeyler
 * söylüyor: biri kişisel öneri, bu bir satış paketi. Aynı zemini
 * paylaşsalardı müşteri ikisini aynı şey sanardı.
 *
 * ⚠️ İndirim GERÇEK: sepette kombinin tamamı varsa sunucu aynı
 * indirimi uyguluyor. Bu yüzden "tasarruf" yazısı burada dürüst.
 */
export default function KombinSeridi({ kombinler, onEkle, onUrunBas }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [eklenen, setEklenen] = useState(null);

  if (!kombinler || kombinler.length === 0) {
    return null;
  }

  async function ekle(k) {
    setEklenen(k.id);

    try {
      await onEkle(k);
    } finally {
      setEklenen(null);
    }
  }

  return (
    <View style={styles.panel}>
      {/* Dekoratif daireler — dokunmayı yutmasınlar. */}
      <View style={[styles.isik, styles.isikSag, { pointerEvents: 'none' }]} />
      <View style={[styles.isik, styles.isikSol, { pointerEvents: 'none' }]} />

      <View style={styles.baslikSatir}>
        <Ionicons name="layers-outline" size={16} color={renkler.anaRenk} />
        <Text style={styles.etiket}>KOMBİN ÖNERİSİ</Text>
      </View>

      <Text style={styles.baslik}>Birlikte iyi gider</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.seritKap}
        contentContainerStyle={styles.serit}
        directionalLockEnabled
      >
        {kombinler.map((k) => (
          <View key={k.id} style={styles.kart}>
            {/* Ürün küçük resimleri, aralarında "+" */}
            <View style={styles.urunSatir}>
              {k.urunler.map((u, i) => (
                <React.Fragment key={u.id}>
                  {i > 0 && <Ionicons name="add" size={14} color={renkler.yaziGri} />}

                  <TouchableOpacity
                    style={styles.karo}
                    onPress={() => onUrunBas?.(u)}
                    activeOpacity={0.85}
                  >
                    {u.resimUrl ? (
                      <Image
                        source={{ uri: SUNUCU_URL + u.resimUrl }}
                        style={styles.karoResim}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="image-outline" size={18} color={renkler.yaziGri} />
                    )}
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>

            <Text style={styles.kombinAd} numberOfLines={1}>{k.ad}</Text>
            <Text style={styles.kombinAlt} numberOfLines={1}>{k.aciklama}</Text>

            <View style={styles.fiyatSatir}>
              <View>
                <Text style={styles.eskiFiyat}>{paraBicimle(k.normalToplam)}</Text>
                <Text style={styles.fiyat}>{paraBicimle(k.kombinFiyati)}</Text>
              </View>

              {/* Tasarruf yalnızca gerçekten indirim varken. */}
              {k.tasarruf > 0 && (
                <View style={styles.tasarrufHap}>
                  <Text style={styles.tasarrufYazi}>
                    {paraBicimle(k.tasarruf)} tasarruf
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.ekleButon}
              onPress={() => ekle(k)}
              disabled={eklenen === k.id}
              activeOpacity={0.85}
            >
              {eklenen === k.id ? (
                <ActivityIndicator size="small" color={renkler.anaRenkUstuYazi} />
              ) : (
                <Text style={styles.ekleYazi}>Sepete Ekle</Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  panel: {
    marginHorizontal: sayfaKenari,
    borderRadius: kose.dev,
    backgroundColor: renkler.lacivertYuzey,
    paddingVertical: bosluk.genis,
    overflow: 'hidden',
  },

  isik: {
    position: 'absolute',
    borderRadius: kose.tam,
    backgroundColor: '#ffffff',
    opacity: 0.05,
  },

  isikSag: {
    width: 160,
    height: 160,
    top: -70,
    right: -50,
  },

  isikSol: {
    width: 200,
    height: 200,
    bottom: -90,
    left: -70,
  },

  baslikSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bosluk.kucuk,
    paddingHorizontal: bosluk.normal,
  },

  etiket: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    letterSpacing: 1,
    color: renkler.anaRenk,
  },

  baslik: {
    fontSize: yazi.buyuk,
    lineHeight: satir.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.lacivertYuzeyUstuYazi,
    paddingHorizontal: bosluk.normal,
    marginTop: bosluk.mikro,
    marginBottom: bosluk.normal,
  },

  seritKap: {
    flexGrow: 0,
    flexShrink: 0,
  },

  serit: {
    paddingHorizontal: bosluk.normal,
    gap: bosluk.orta,
  },

  kart: {
    width: 260,
    backgroundColor: renkler.kartArka,
    borderRadius: kose.buyuk,
    padding: bosluk.normal,
  },

  urunSatir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: bosluk.kucuk,
    marginBottom: bosluk.orta,
  },

  karo: {
    width: 56,
    height: 56,
    borderRadius: kose.orta,
    backgroundColor: renkler.acikKart,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  karoResim: {
    width: '100%',
    height: '100%',
  },

  kombinAd: {
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  kombinAlt: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    marginTop: 2,
  },

  fiyatSatir: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: bosluk.kucuk,
    marginTop: bosluk.orta,
    marginBottom: bosluk.orta,
  },

  eskiFiyat: {
    fontSize: yazi.kucuk,
    color: renkler.yaziGri,
    textDecorationLine: 'line-through',
  },

  fiyat: {
    fontSize: yazi.buyuk,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  tasarrufHap: {
    backgroundColor: renkler.yumusakBasari,
    borderRadius: kose.kucuk,
    paddingHorizontal: bosluk.kucuk,
    paddingVertical: bosluk.mikro,
  },

  tasarrufYazi: {
    fontSize: yazi.mikro,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.basari,
  },

  ekleButon: {
    height: 40,
    borderRadius: kose.orta,
    backgroundColor: renkler.anaRenk,
    justifyContent: 'center',
    alignItems: 'center',
  },

  ekleYazi: {
    color: renkler.anaRenkUstuYazi,
    fontSize: yazi.normal,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
  },
});
