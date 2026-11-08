import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from './Button';
import { Chip } from './Chip';
import { borderRadius, colors, typography, FONT_CAP } from '../utils/theme';

export type SortKey = 'featured' | 'priceAsc' | 'priceDesc';

export interface Filters {
  sort: SortKey;
  sizes: string[];
  inStockOnly: boolean;
  pickupOnly: boolean;
}

const TRACK = { false: colors.disabled, true: colors.primary };

export const defaultFilters: Filters = { sort: 'featured', sizes: [], inStockOnly: false, pickupOnly: false };

export const activeFilterCount = (f: Filters): number =>
  (f.sort !== 'featured' ? 1 : 0) + f.sizes.length + (f.inStockOnly ? 1 : 0) + (f.pickupOnly ? 1 : 0);

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'priceAsc', label: 'Price: low to high' },
  { key: 'priceDesc', label: 'Price: high to low' },
];

interface Props {
  visible: boolean;
  value: Filters;
  sizeOptions: string[];
  onChange: (f: Filters) => void;
  onClose: () => void;
}

export const FilterSheet: React.FC<Props> = ({ visible, value, sizeOptions, onChange, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
    <View style={styles.sheet}>
      <Text style={styles.title} maxFontSizeMultiplier={FONT_CAP} accessibilityRole="header">Sort & filter</Text>
      <ScrollView>
        <Text style={styles.label} maxFontSizeMultiplier={FONT_CAP}>SORT BY</Text>
        <View style={styles.wrap}>
          {SORTS.map(s => (
            <Chip key={s.key} label={s.label} selected={value.sort === s.key} onPress={() => onChange({ ...value, sort: s.key })} />
          ))}
        </View>
        <Text style={styles.label} maxFontSizeMultiplier={FONT_CAP}>SIZE</Text>
        <View style={styles.wrap}>
          {sizeOptions.map(z => (
            <Chip
              key={z}
              label={z}
              selected={value.sizes.includes(z)}
              onPress={() =>
                onChange({ ...value, sizes: value.sizes.includes(z) ? value.sizes.filter(x => x !== z) : [...value.sizes, z] })
              }
            />
          ))}
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>In stock only</Text>
          <Switch accessibilityLabel="In stock only" value={value.inStockOnly} onValueChange={v => onChange({ ...value, inStockOnly: v })} trackColor={TRACK} />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>Store pickup available</Text>
          <Switch accessibilityLabel="Store pickup available" value={value.pickupOnly} onValueChange={v => onChange({ ...value, pickupOnly: v })} trackColor={TRACK} />
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <Button title="Clear" variant="secondary" style={styles.clear} onPress={() => onChange(defaultFilters)} />
        <Button title="Show results" style={styles.apply} onPress={onClose} />
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  clear: { flex: 1 },
  apply: { flex: 2 },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: 20, paddingBottom: 34, maxHeight: '80%' },
  title: { ...typography.h2, marginBottom: 8 },
  label: { ...typography.label, color: colors.textSecondary, marginTop: 16, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 52 },
  rowText: { ...typography.body },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
});
