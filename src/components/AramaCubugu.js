import React, { useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTema } from '../context/TemaContext';

export default function AramaCubugu({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Ürün ara...',
  canliArama = true,
  gecikme = 400,
  onMenuBas,          // verilirse solda hamburger butonu çıkar
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
    </View>
  );
}

const stilOlustur = (renkler) => StyleSheet.create({
  disKutu: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuButon: {
    paddingRight: 10,
  },
  kapsayici: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: renkler.acikGri,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  ikon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: renkler.yaziKoyu,
  },
  temizle: {
    marginLeft: 8,
  },
});