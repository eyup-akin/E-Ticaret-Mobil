import React, { useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';
import { bosluk, kose, yazi } from '../theme/olculer';
import RozetliIkon from './RozetliIkon';

export default function AramaCubugu({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Ürün ara...',
  canliArama = true,
  gecikme = 400,
  onMenuBas,          // verilirse solda hamburger butonu çıkar
  onFiltreBas,        // ⭐ YENİ (6.3) — verilirse sağda filtre butonu çıkar
  aktifFiltre = 0,    // ⭐ YENİ (6.3) — filtre ikonundaki rozet sayısı
}) {
  const { renkler } = useTema();
  const styles = stilOlustur(renkler);

  useEffect(() => {
    if (!canliArama) return;

    const zamanlayici = setTimeout(() => {
      onSubmit(value);
    }, gecikme);

    return () => clearTimeout(zamanlayici);
  }, [value]);

  return (
    <View style={styles.disKutu}>
      {/* Hamburger — sadece onMenuBas verilirse görünür */}
      {onMenuBas && (
        <TouchableOpacity onPress={onMenuBas} style={styles.menuButon}>
          <Ionicons name="menu" size={26} color={renkler.yaziKoyu} />
        </TouchableOpacity>
      )}

      <View style={styles.kapsayici}>
        <Ionicons name="search" size={20} color={renkler.yaziGri} style={styles.ikon} />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={renkler.yaziGri}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={() => onSubmit(value)}
          returnKeyType="search"
          autoCapitalize="none"
        />

        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.temizle}>
            <Ionicons name="close-circle" size={20} color={renkler.yaziGri} />
          </TouchableOpacity>
        )}
      </View>

      {/* ⭐ YENİ (6.3) — FİLTRE BUTONU

          ⚠️ Rozet SAYACINI bu bileşen hesaplamıyor, dışarıdan alıyor.
          Filtre nesnesini buraya verip içeride saydırsaydık, arama
          çubuğu "filtre nedir" bilgisine bağımlı hale gelirdi ve
          filtreye yeni bir alan eklendiğinde burası da değişirdi.

          ⚠️ Rozet ikonun ÜSTÜNE biniyor (RozetliIkon absolute
          konumlandırıyor), yani filtre seçilince buton büyümüyor ve
          arama kutusunun genişliği sabit kalıyor. */}
      {onFiltreBas && (
        <TouchableOpacity onPress={onFiltreBas} style={styles.filtreButon} hitSlop={8}>
          <RozetliIkon
            ikon="options-outline"
            sayi={aktifFiltre}
            size={24}
            color={aktifFiltre > 0 ? renkler.anaRenk : renkler.yaziKoyu}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  disKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: bosluk.orta,
    paddingVertical: bosluk.kucuk,
  },
  menuButon: {
    paddingRight: bosluk.orta,
  },
  kapsayici: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renkler.acikGri,
    borderRadius: kose.orta,
    paddingHorizontal: bosluk.orta,
  },
  ikon: {
    marginRight: bosluk.kucuk,
  },
  input: {
    flex: 1,
    paddingVertical: bosluk.orta,

    // ⚠️ Eskiden 16 yazıyordu; ölçekte 16 yok. En yakın basamak
    // 15 (yazi.orta) — 18'e çıkmak arama kutusunu gereksiz
    // büyütürdü. Ölçeğe uymak, "yakın olduğu için" ara değer
    // uydurmaktan iyi.
    fontSize: yazi.orta,
    color: renkler.yaziKoyu,
  },
  temizle: {
    marginLeft: bosluk.kucuk,
  },
  filtreButon: {
    paddingLeft: bosluk.orta,
  },
});
