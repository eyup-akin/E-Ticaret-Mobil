import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { apiGet } from '../services/api';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi, agirlik, satir, font } from '../theme/olculer';

/* ⭐ YENİ (Aşama 10) — SÖZLEŞME ONAY KUTUSU
 *
 *   isaretli / onDegis : onay durumu
 *   parcalar           : [{ tip, etiket }] — metne dokununca modal açılır
 *   oncesi / sonrasi   : bağlantıların önündeki/ardındaki düz metin
 *
 * ⚠️ KUTU ÖNCEDEN İŞARETLİ GELMEZ — açık rıza karanlık desenle
 * alınmaz. Varsayılan `false` ve sunucu da onaysız isteği reddediyor.
 */
export default function SozlesmeOnayKutusu({ isaretli, onDegis, parcalar, oncesi = '', sonrasi = '' }) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  const [acikTip, setAcikTip] = useState(null);
  const [metin, setMetin] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function metniAc(tip) {
    setAcikTip(tip);
    setMetin(null);
    setYukleniyor(true);

    try {
      const veri = await apiGet('/sozlesmeler/' + tip);
      setMetin(veri);
    } catch (hata) {
      // Metin gelmezse modal boş kalmasın; müşteri en azından
      // neyin açılamadığını görsün.
      setMetin({ icerik: 'Metin şu anda yüklenemedi: ' + hata.message });
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <View style={styles.kap}>
      <TouchableOpacity
        style={styles.kutu}
        onPress={() => onDegis(!isaretli)}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isaretli }}
      >
        <Ionicons
          name={isaretli ? 'checkbox' : 'square-outline'}
          size={22}
          color={isaretli ? renkler.anaRenk : renkler.yaziGri}
        />
      </TouchableOpacity>

      <Text style={styles.metin}>
        {oncesi}
        {parcalar.map((p, i) => (
          <Text key={p.tip}>
            <Text style={styles.baglanti} onPress={() => metniAc(p.tip)}>
              {p.etiket}
            </Text>
            {i < parcalar.length - 1 ? ' ve ' : ''}
          </Text>
        ))}
        {sonrasi}
      </Text>

      <Modal
        visible={acikTip !== null}
        animationType="slide"
        onRequestClose={() => setAcikTip(null)}
      >
        <View style={styles.modalKap}>
          <View style={styles.modalUst}>
            <Text style={styles.modalBaslik} numberOfLines={1}>
              {parcalar.find((p) => p.tip === acikTip)?.etiket ?? 'Sözleşme'}
            </Text>

            <TouchableOpacity onPress={() => setAcikTip(null)} hitSlop={8}>
              <Ionicons name="close" size={24} color={renkler.yaziKoyu} />
            </TouchableOpacity>
          </View>

          {yukleniyor ? (
            <View style={styles.modalOrta}>
              <ActivityIndicator size="large" color={renkler.anaRenk} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.modalIcerik}>
              <Text style={styles.modalMetin}>{metin?.icerik}</Text>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  kap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: bosluk.kucuk,
    marginBottom: bosluk.normal,
  },

  // Dokunma hedefi ikondan büyük: 22dp ikon parmakla ıskalanıyor.
  kutu: {
    paddingTop: 2,
    paddingRight: bosluk.mikro,
  },

  metin: {
    flex: 1,
    fontSize: yazi.kucuk,
    lineHeight: satir.orta,
    color: renkler.yaziOrta,
  },

  baglanti: {
    color: renkler.anaRenk,
    fontWeight: agirlik.yari,
    fontFamily: font.yari,
  },

  modalKap: {
    flex: 1,
    backgroundColor: renkler.arkaPlan,
  },

  modalUst: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: bosluk.orta,
    paddingHorizontal: bosluk.normal,
    paddingTop: bosluk.dev,
    paddingBottom: bosluk.orta,
    borderBottomWidth: 1,
    borderBottomColor: renkler.kenarlik,
    backgroundColor: renkler.kartArka,
  },

  modalBaslik: {
    flex: 1,
    fontSize: yazi.orta,
    fontWeight: agirlik.kalin,
    fontFamily: font.kalin,
    color: renkler.yaziKoyu,
  },

  modalOrta: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalIcerik: {
    padding: bosluk.normal,
    paddingBottom: bosluk.dev,
  },

  modalMetin: {
    fontSize: yazi.normal,
    lineHeight: satir.orta,
    color: renkler.yaziKoyu,
  },
});
